import assert from 'assert';
import { exec } from 'child_process';
import http from 'http';
import { createHash, randomBytes } from 'crypto';
import { setTimeout as sleep } from 'timers/promises';
import { IdentityType, saveCredentials } from 'world/identities';
import {
    AttachedPolicy,
    DeleteGroupCommand,
    DeletePolicyCommand,
    DeleteRoleCommand,
    DeleteUserCommand,
    DetachGroupPolicyCommand,
    DetachRolePolicyCommand,
    DetachUserPolicyCommand,
    paginateListAttachedGroupPolicies,
    paginateListAttachedRolePolicies,
    paginateListAttachedUserPolicies,
    paginateListGroups,
    paginateListPolicies,
    paginateListRoles,
    paginateListUsers,
} from '@aws-sdk/client-iam';
import Zenko from 'world/Zenko';
import { AWSCredentials } from 'clients/aws';
import fs from 'fs';
import { runOnceAcrossWorkers } from 'common/WorkerCoordination';
import { ITestCaseHookParameter } from '@cucumber/cucumber';
import { createBucketWithConfiguration, putObject } from '../steps/utils/utils';
import { createJobAndWaitForCompletion } from '../steps/utils/kubernetes';

export { sleep };

export function randomString(): string {
    return randomBytes(5).toString('hex');
}

export function isAccessKeys(object: Partial<AWSCredentials>): object is AWSCredentials {
    return Boolean(object.accessKeyId && object.secretAccessKey && object.sessionToken !== '');
}

export function assertBudgetFitsStepTimeout(budgetSeconds: number, stepTimeoutMs: number): void {
    assert.ok(
        budgetSeconds * 1000 < stepTimeoutMs,
        `budget of ${budgetSeconds}s does not fit the step timeout of ${stepTimeoutMs / 1000}s: `
        + 'raise the step timeout, or the step will be killed before it can report',
    );
}

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

/**
 * Serialises an options object into arguments for a Go CLI built with cobra/pflag.
 * @param {Record<string, unknown>} params - the options to serialise
 * @return {string} - the arguments, space-separated
 */
export function paramToCli(params: Record<string, unknown>): string {
    const command: string[] = [];
    Object.keys(params).forEach(key => {
        const value = params[key];
        if (value == null) {
            return;
        }
        const flag = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        if (typeof value === 'boolean') {
            // pflag boolean flags do not consume the next argument: "--flag false"
            // sets the flag to true and drops "false" as a positional argument.
            command.push(`${flag}=${String(value)}`);
        } else {
            command.push(flag, String(value));
        }
    });
    return command.join(' ');
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

async function collect<Page, Item>(pages: AsyncIterable<Page>, items: (page: Page) => Item[] | undefined) {
    const all: Item[] = [];
    for await (const page of pages) {
        all.push(...(items(page) ?? []));
    }
    return all;
}

const notInternal = ({ Path }: { Path?: string }) => !Path?.includes('/scality-internal/');
const notInternalPolicy = ({ PolicyArn }: AttachedPolicy) => !PolicyArn?.includes('/scality-internal/');

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
        world.useIdentity(IdentityType.ACCOUNT, accountName);
        const iam = world.iam;
        const paginator = { client: iam };

        const [allUsers, allGroups, allRoles] = await Promise.all([
            collect(paginateListUsers(paginator, {}), page => page.Users),
            collect(paginateListGroups(paginator, {}), page => page.Groups),
            collect(paginateListRoles(paginator, {}), page => page.Roles),
        ]);
        const users = allUsers.filter(notInternal);
        const groups = allGroups.filter(notInternal);
        const roles = allRoles.filter(notInternal);

        // Detach attached policies from every user, group and role in parallel.
        await Promise.all([
            ...users.map(async ({ UserName }) => {
                const policies = await collect(paginateListAttachedUserPolicies(paginator, { UserName }),
                    page => page.AttachedPolicies);
                await Promise.all(policies.filter(notInternalPolicy).map(({ PolicyArn }) =>
                    iam.send(new DetachUserPolicyCommand({ UserName, PolicyArn }))));
            }),
            ...groups.map(async ({ GroupName }) => {
                const policies = await collect(paginateListAttachedGroupPolicies(paginator, { GroupName }),
                    page => page.AttachedPolicies);
                await Promise.all(policies.filter(notInternalPolicy).map(({ PolicyArn }) =>
                    iam.send(new DetachGroupPolicyCommand({ GroupName, PolicyArn }))));
            }),
            ...roles.map(async ({ RoleName }) => {
                const policies = await collect(paginateListAttachedRolePolicies(paginator, { RoleName }),
                    page => page.AttachedPolicies);
                await Promise.all(policies.filter(notInternalPolicy).map(({ PolicyArn }) =>
                    iam.send(new DetachRolePolicyCommand({ RoleName, PolicyArn }))));
            }),
        ]);

        // Delete all policies in parallel.
        const allPolicies = await collect(paginateListPolicies(paginator, {}), page => page.Policies);
        const policies = allPolicies.filter(notInternal);
        await Promise.all(policies.map(({ Arn }) => iam.send(new DeletePolicyCommand({ PolicyArn: Arn }))));

        // Delete all roles, groups and users in parallel (independent now that policies are gone).
        await Promise.all([
            ...roles.map(({ RoleName }) => iam.send(new DeleteRoleCommand({ RoleName }))),
            ...groups.map(({ GroupName }) => iam.send(new DeleteGroupCommand({ GroupName }))),
            ...users.map(({ UserName }) => iam.send(new DeleteUserCommand({ UserName }))),
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
                output[scenarioId] = world.credentials;
            }

            await createJobAndWaitForCompletion(world, jobName, jobNamespace);
            await sleep(2000);
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
        saveCredentials(IdentityType.ACCOUNT, key, configuration[key]);
        world.useDefaultAccount(key);
    }
}
