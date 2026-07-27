import { exec } from 'child_process';
import http from 'http';
import { createHash } from 'crypto';
import { Command, IAM, Identity, IdentityEnum } from 'cli-testing';
import {
    AttachedPolicy,
    Group,
    Policy,
    Role,
    User,
} from '@aws-sdk/client-iam';
import { AWSCliOptions } from 'cli-testing';
import Zenko from 'world/Zenko';
import fs from 'fs';
import { runOnceAcrossWorkers } from 'common/WorkerCoordination';
import { ITestCaseHookParameter } from '@cucumber/cucumber';
import { AWSCredentials, Utils } from 'cli-testing';
import { createBucketWithConfiguration, putObject } from '../steps/utils/utils';
import { createJobAndWaitForCompletion } from '../steps/utils/kubernetes';

/**
 * This helper will dynamically extract a property from a CLI result
 * @param {object} results - results from the command line
 * @param {string[]} propertyChain - the property chain to extract, like Policy, Arn
 * @return {string} - the expected property
 */
export function extractPropertyFromResults<T>(results: Command, ...propertyChain: string[]): T | null {
    if (results.stdout) {
        const jsonResults = JSON.parse(results.stdout) as Record<string, unknown>;
        let res: unknown = jsonResults;
        if (jsonResults) {
            while (propertyChain.length > 0) {
                res = (res as Record<string, unknown>)[propertyChain.shift()!];
            }
        }
        return res as T;
    }
    return null;
}

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

export async function listAllEntities<T extends User | Role | Group | Policy>(
    listFn: (params: AWSCliOptions) => Promise<Command>,
    responseKey: string,
): Promise<T[]> {
    let marker;
    const allEntities: T[] = [];
    let parsedResponse;
    do {
        const response = await listFn({ marker });
        if (response.err) {
            throw new Error(response.err);
        }
        parsedResponse = JSON.parse(response.stdout);
        const entities = parsedResponse[responseKey] || [];
        entities.forEach((entity: T) => {
            if (entity.Path?.includes('/scality-internal/')) {
                return;
            }
            allEntities.push(entity);
        });
        marker = parsedResponse.Marker;
    } while (parsedResponse.IsTruncated);
    return allEntities;
};

export async function listAttachedPolicies<T extends AttachedPolicy>(
    listFn: (params: AWSCliOptions) => Promise<Command>,
): Promise<T[]> {
    let marker;
    const allPolicies: T[] = [];
    let parsedResponse;
    do {
        const response = await listFn({ marker });
        if (response.err) {
            throw new Error(response.err);
        }
        parsedResponse = JSON.parse(response.stdout);
        const policies = parsedResponse.AttachedPolicies || [];
        policies.forEach((policy: T) => {
            if (policy.PolicyArn?.includes('/scality-internal/')) {
                return;
            }
            allPolicies.push(policy);
        });
        marker = parsedResponse.Marker;
    } while (parsedResponse.IsTruncated);
    return allPolicies;
}

export async function cleanupAccount(world: Zenko, accountName: string) {
    try {
        await world.deleteAccount(accountName);
    } catch (err) {
        world.logger?.debug('Account has attached resources',{
            accountName,
            err,
        });
    }

    try {
        Identity.useIdentity(IdentityEnum.ACCOUNT, accountName);

        const [allUsers, allGroups, allRoles] = await Promise.all([
            listAllEntities<User>(IAM.listUsers, 'Users'),
            listAllEntities<Group>(IAM.listGroups, 'Groups'),
            listAllEntities<Role>(IAM.listRoles, 'Roles'),
        ]);

        // Detach attached policies from every user, group and role in parallel.
        await Promise.all([
            ...allUsers.map(async user => {
                const policies = await listAttachedPolicies<AttachedPolicy>(
                    params => IAM.listAttachedUserPolicies({ userName: user.UserName, ...params }),
                );
                await Promise.all(policies.map(async policy => {
                    const result = await IAM.detachUserPolicy({
                        userName: user.UserName, policyArn: policy.PolicyArn });
                    if (result.err) {
                        throw new Error(result.err);
                    }
                }));
            }),
            ...allGroups.map(async group => {
                const policies = await listAttachedPolicies<AttachedPolicy>(
                    params => IAM.listAttachedGroupPolicies({ groupName: group.GroupName, ...params }),
                );
                await Promise.all(policies.map(async policy => {
                    const result = await IAM.detachGroupPolicy({
                        groupName: group.GroupName, policyArn: policy.PolicyArn });
                    if (result.err) {
                        throw new Error(result.err);
                    }
                }));
            }),
            ...allRoles.map(async role => {
                const policies = await listAttachedPolicies<AttachedPolicy>(
                    params => IAM.listAttachedRolePolicies({ roleName: role.RoleName, ...params }),
                );
                await Promise.all(policies.map(async policy => {
                    const result = await IAM.detachRolePolicy({
                        roleName: role.RoleName, policyArn: policy.PolicyArn });
                    if (result.err) {
                        throw new Error(result.err);
                    }
                }));
            }),
        ]);

        // Delete all policies in parallel.
        const allPolicies = await listAllEntities<Policy>(IAM.listPolicies, 'Policies');
        await Promise.all(allPolicies.map(async policy => {
            const result = await IAM.deletePolicy({ policyArn: policy.Arn });
            if (result.err) {
                throw new Error(result.err);
            }
        }));

        // Delete all roles, groups and users in parallel (independent now that policies are gone).
        await Promise.all([
            ...allRoles.map(async role => {
                const result = await IAM.deleteRole({ roleName: role.RoleName });
                if (result.err) {
                    throw new Error(result.err);
                }
            }),
            ...allGroups.map(async group => {
                const result = await IAM.deleteGroup({ groupName: group.GroupName });
                if (result.err) {
                    throw new Error(result.err);
                }
            }),
            ...allUsers.map(async user => {
                const result = await IAM.deleteUser({ userName: user.UserName });
                if (result.err) {
                    throw new Error(result.err);
                }
            }),
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
    const dataFile = `/tmp/${featureName}`;

    const {
        versioning = '',
        jobName = 'end2end-ops-count-items',
        jobNamespace = `${featureName}-setup`,
        objectSize = 0,
        objectCount = 1,
    } = options;

    await runOnceAcrossWorkers(
        { lockName: featureName, logger: world.logger },
        async () => {
            const output: Record<string, AWSCredentials> = {};
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
                output[scenarioId] = Identity.getCurrentCredentials()!;
            }

            await createJobAndWaitForCompletion(world, jobName, jobNamespace);
            await Utils.sleep(2000);
            fs.writeFileSync(dataFile, JSON.stringify(output));
        },
    );

    const configuration = JSON.parse(
        fs.readFileSync(dataFile, 'utf8'),
    ) as Record<string, AWSCredentials>;
    const key = hashStringAndKeepFirst20Characters(`${pickle.astNodeIds[1]}`);
    world.logger.debug('Scenario key', { key, from: `${pickle.astNodeIds[1]}`, configuration });
    
    world.addToSaved('bucketName', key);
    world.addToSaved('accountName', key);
    world.addToSaved('accountNameForScenario', key);
    world.addToSaved('metricsEnvironmentSetup', true);
    
    if (configuration[key]) {
        Identity.addIdentity(IdentityEnum.ACCOUNT, key, configuration[key], undefined, true, true);
    }
}
