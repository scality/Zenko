import { exec } from 'child_process';
import http from 'http';
import { createHash } from 'crypto';
import {
    DeleteGroupCommand,
    DeletePolicyCommand,
    DeleteRoleCommand,
    DeleteUserCommand,
    DetachGroupPolicyCommand,
    DetachRolePolicyCommand,
    DetachUserPolicyCommand,
    ListAttachedGroupPoliciesCommand,
    ListAttachedRolePoliciesCommand,
    ListAttachedUserPoliciesCommand,
    ListGroupsCommand,
    ListPoliciesCommand,
    ListRolesCommand,
    ListUsersCommand,
} from '@aws-sdk/client-iam';
import Zenko from 'world/Zenko';
import fs from 'fs';
import lockFile from 'proper-lockfile';
import { ITestCaseHookParameter } from '@cucumber/cucumber';
import { Constants, Utils } from 'cli-testing';
import { AwsCredentials } from 'world/AwsClientManager';
import { createBucketWithConfiguration, putObject } from '../steps/utils/utils';
import { createJobAndWaitForCompletion } from '../steps/utils/kubernetes';


export const s3FunctionExtraParams: { [key: string]: Record<string, unknown>[] } = {
    restoreObject: [{ restoreRequest: 'Days=1' }],
    putObjectAcl: [{ acl: 'public-read-write' }],
    putBucketCors: [{ corsConfiguration: '\'{"CORSRules":[{"AllowedMethods":["GET"],"AllowedOrigins":["*"]}]}\'' }],
    putBucketTagging: [{ tagging: '{"TagSet":[{"Key":"tag1","Value":"value1"},{"Key":"tag2","Value":"value2"}]}' }],
    putObjectTagging: [{ tagging: '{"TagSet":[{"Key":"string","Value":"string"}]}' }],
    putBucketVersioning: [{ versioningConfiguration: 'Status=Enabled' }],
    putObjectLegalHold: [{ legalHold: 'Status=ON' }],
    putObjectRetention: [{
        retention: 'Mode=GOVERNANCE,RetainUntilDate=2080-01-01T00:00:00Z',
        bypassGovernanceRetention: 'true',
    }],
    putObjectLockConfiguration: [{
        objectLockConfiguration: '{ "ObjectLockEnabled": "Enabled", "Rule": ' +
            '{ "DefaultRetention": ' +
            '{ "Mode": "GOVERNANCE", "Days": 50 }}}',
    }],
    deleteObjects: [{
        delete: JSON.stringify({
            Objects: [{
                Key: 'x'.repeat(10),
            }],
        }),
    }],
    putBucketLifecycleConfiguration: [{
        lifecycleConfiguration: JSON.stringify(
            {
                Rules: [
                    {
                        Prefix: '',
                        Status: 'Enabled',
                        Transitions: [
                            {
                                Days: 365,
                                StorageClass: 'e2e-cold',
                            },
                        ],
                        Expiration: {
                            Days: 3650,
                        },
                        ID: 'ExampleRule',
                    },
                ],
            }),
    }],
    putBucketReplication: [{
        replicationConfiguration: JSON.stringify(
            {
                Role: 'arn:aws:iam::123456789012:role/s3-replication-role',
                Rules: [
                    {
                        Status: 'Enabled',
                        Prefix: '',
                        Destination: {
                            Bucket: 'arn:aws:s3:::examplebucket',
                        },
                    },
                ],
            }),
    }],
};

/**
 * Parses a duration string in Go's time.ParseDuration format
 * (https://pkg.go.dev/time#ParseDuration) and returns the equivalent in seconds.
 * @param {string} duration - the duration string to parse (e.g. "1h30m", "500ms")
 * @return {number} - the duration in seconds
 */
export function parseGoDuration(duration: string): number {
    const units: Record<string, number> = {
        ns: 1e-9, us: 1e-6, µs: 1e-6, ms: 1e-3, s: 1, m: 60, h: 3600,
    };
    let remaining = duration;
    if (remaining.length === 0) {
        throw new Error(`Invalid duration: "${duration}"`);
    }
    let totalSeconds = 0;
    while (remaining.length > 0) {
        const match = remaining.match(/^(\d+(?:\.\d*)?)(ns|us|µs|ms|s|m|h)/);
        if (!match) {
            throw new Error(`Invalid duration: "${duration}" (unparsed: "${remaining}")`);
        }
        totalSeconds += parseFloat(match[1]) * units[match[2]];
        remaining = remaining.slice(match[0].length);
    }
    return totalSeconds;
}

export function safeJsonParse<T>(jsonString: string): { ok: boolean, result: T | null, error?: Error | null } {
    let result: T;
    try {
        result = JSON.parse(jsonString) as T;
    } catch (err) {
        return { ok: false, result: null, error: (err as Error) };
    }
    return { ok: true, result };
}

/**
 * Executes a shell command and return it as a Promise.
 * @param {string} cmd The command to execute
 * @return {Promise<string>} the command output
 */
export function execShellCommand(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }
            return resolve(stdout || stderr);
        });
    });
}

export async function request(options: http.RequestOptions, data: string | undefined):
    Promise<{response: http.IncomingMessage, body: string}> {
    return new Promise((resolve, reject) => {
        const req = http.request(options, res => {
            const chunks: string[] = [];
            res.setEncoding('utf8');
            res.on('data', (chunk: string) => {
                chunks.push(chunk);
            });
            res.once('end', () => {
                resolve({
                    response: res,
                    body: chunks.join(''),
                });
            });
        });
        req.once('error', reject);
        if (data) {
            req.write(data);
        }
        req.end();
    });
}

export function hashStringAndKeepFirst20Characters(input: string) {
    return createHash('sha256').update(input).digest('hex').slice(0, 20);
}

async function paginateAll<TResp extends { IsTruncated?: boolean; Marker?: string }, TItem>(
    fetch: (marker?: string) => Promise<TResp>,
    extract: (resp: TResp) => TItem[] | undefined,
): Promise<TItem[]> {
    const all: TItem[] = [];
    let marker: string | undefined;
    do {
        const resp = await fetch(marker);
        all.push(...(extract(resp) ?? []));
        marker = resp.IsTruncated ? resp.Marker : undefined;
    } while (marker);
    return all;
}

export async function cleanupAccount(world: Zenko, accountName: string) {
    try {
        await world.deleteAccount(accountName);
    } catch (err) {
        world.logger?.debug('Account has attached resources', {
            accountName,
            err,
        });
    }

    try {
        world.awsClients.useIdentity(accountName);
        const iam = world.awsClients.iam;
        const isInternal = (path?: string) => path?.includes('/scality-internal/');

        const [allUsers, allGroups, allRoles] = await Promise.all([
            paginateAll(
                marker => iam.send(new ListUsersCommand({ Marker: marker })),
                r => r.Users,
            ).then(users => users.filter(u => !isInternal(u.Path))),
            paginateAll(
                marker => iam.send(new ListGroupsCommand({ Marker: marker })),
                r => r.Groups,
            ).then(groups => groups.filter(g => !isInternal(g.Path))),
            paginateAll(
                marker => iam.send(new ListRolesCommand({ Marker: marker })),
                r => r.Roles,
            ).then(roles => roles.filter(r => !isInternal(r.Path))),
        ]);

        // Detach attached policies from every user, group and role in parallel.
        await Promise.all([
            ...allUsers.map(async user => {
                const policies = await paginateAll(
                    marker => iam.send(new ListAttachedUserPoliciesCommand({ UserName: user.UserName, Marker: marker })),
                    r => r.AttachedPolicies,
                ).then(ps => ps.filter(p => !isInternal(p.PolicyArn)));
                await Promise.all(policies.map(p =>
                    iam.send(new DetachUserPolicyCommand({ UserName: user.UserName, PolicyArn: p.PolicyArn })),
                ));
            }),
            ...allGroups.map(async group => {
                const policies = await paginateAll(
                    marker => iam.send(new ListAttachedGroupPoliciesCommand({ GroupName: group.GroupName, Marker: marker })),
                    r => r.AttachedPolicies,
                ).then(ps => ps.filter(p => !isInternal(p.PolicyArn)));
                await Promise.all(policies.map(p =>
                    iam.send(new DetachGroupPolicyCommand({ GroupName: group.GroupName, PolicyArn: p.PolicyArn })),
                ));
            }),
            ...allRoles.map(async role => {
                const policies = await paginateAll(
                    marker => iam.send(new ListAttachedRolePoliciesCommand({ RoleName: role.RoleName, Marker: marker })),
                    r => r.AttachedPolicies,
                ).then(ps => ps.filter(p => !isInternal(p.PolicyArn)));
                await Promise.all(policies.map(p =>
                    iam.send(new DetachRolePolicyCommand({ RoleName: role.RoleName, PolicyArn: p.PolicyArn })),
                ));
            }),
        ]);

        // Delete all local policies in parallel.
        const allPolicies = await paginateAll(
            marker => iam.send(new ListPoliciesCommand({ Marker: marker, Scope: 'Local' })),
            r => r.Policies,
        ).then(ps => ps.filter(p => !isInternal(p.Arn)));
        await Promise.all(allPolicies.map(p => iam.send(new DeletePolicyCommand({ PolicyArn: p.Arn }))));

        // Delete all roles, groups and users in parallel (independent now that policies are gone).
        await Promise.all([
            ...allRoles.map(role => iam.send(new DeleteRoleCommand({ RoleName: role.RoleName }))),
            ...allGroups.map(group => iam.send(new DeleteGroupCommand({ GroupName: group.GroupName }))),
            ...allUsers.map(user => iam.send(new DeleteUserCommand({ UserName: user.UserName }))),
        ]);

        // Finally, delete the account
        await world.deleteAccount(accountName);
    } catch (err) {
        world.logger.warn('Error while deleting cross account', {
            accountName,
            error: err,
        });
    }
}

export interface PrepareScenarioOptions {
    versioning?: string;
    jobNamespace?: string;
    jobName?: string;
    objectSize?: number;
    objectCount?: number;
}

/**
 * Generic function to prepare scenarios that need cronjob to run (e.g., count-items)
 * Can be used by both quota and utilization tests to avoid code duplication
 * Creates accounts, buckets and runs cronjob once for all scenarios
 */
export async function prepareMetricsScenarios(
    world: Zenko, 
    scenarioConfiguration: ITestCaseHookParameter,
    options: PrepareScenarioOptions = {},
): Promise<void> {
    const { gherkinDocument, pickle } = scenarioConfiguration;
    const featureName = gherkinDocument.feature?.name?.replace(/ /g, '-').toLowerCase() || 'metrics';
    const filePath = `/tmp/${featureName}`;
    let initiated = false;
    let releaseLock: (() => Promise<void>) | false = false;
    const output: Record<string, AwsCredentials> = {};
    
    const {
        versioning = '',
        jobName = 'end2end-ops-count-items',
        jobNamespace = `${featureName}-setup`,
        objectSize = 0,
        objectCount = 1,
    } = options;

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({
            ready: false,
        }));
    } else {
        initiated = true;
    }

    if (!initiated) {
        try {
            releaseLock = await lockFile.lock(filePath, { stale: Constants.DEFAULT_TIMEOUT / 2 });
        } catch (err) {
            world.logger.error('Unable to acquire lock', { err });
            releaseLock = false;
        }
    }

    if (releaseLock) {
        const scenarioIds = new Set<string>();
        
        for (const scenario of gherkinDocument.feature?.children || []) {
            for (const example of scenario.scenario?.examples || []) {
                for (const values of example.tableBody || []) {
                    const scenarioWithExampleID = hashStringAndKeepFirst20Characters(`${values.id}`);
                    scenarioIds.add(scenarioWithExampleID);
                }
            }
        }
        
        for (const scenarioId of scenarioIds) {
            await world.createAccount(scenarioId, true);
            await createBucketWithConfiguration(world, scenarioId, versioning);
            for (let i = 0; i < objectCount; i++) {
                await putObject(world, undefined, undefined, objectSize);
            }
            output[scenarioId] = world.awsClients.getCredentials();
        }

        await createJobAndWaitForCompletion(world, jobName, jobNamespace);
        
        await Utils.sleep(2000);
        fs.writeFileSync(filePath, JSON.stringify({
            ready: true,
            ...output,
        }));

        await releaseLock();
    } else {
        while (!fs.existsSync(filePath)) {
            await Utils.sleep(100);
        }

        let configuration: { ready: boolean } = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { ready: boolean };
        while (!configuration.ready) {
            await Utils.sleep(100);
            configuration = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { ready: boolean };
        }
    }

    const configuration: typeof output = JSON.parse(fs.readFileSync(filePath, 'utf8')) as typeof output;
    const key = hashStringAndKeepFirst20Characters(`${pickle.astNodeIds[1]}`);
    world.logger.debug('Scenario key', { key, from: `${pickle.astNodeIds[1]}`, configuration });
    
    world.addToSaved('bucketName', key);
    world.addToSaved('accountName', key);
    world.addToSaved('accountNameForScenario', key);
    world.addToSaved('metricsEnvironmentSetup', true);
    
    if (configuration[key]) {
        Zenko.storedCredentials.set(key, configuration[key]);
        world.awsClients.registerIdentity(key, configuration[key], true);
    }
}
