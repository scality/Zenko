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

        // List and detach policies for each user
        const allUsers = await listAllEntities<User>(IAM.listUsers, 'Users');
        for (const user of allUsers) {
            const allUserPolicies = await listAttachedPolicies<AttachedPolicy>(
                params => IAM.listAttachedUserPolicies({ userName: user.UserName, ...params }),
            );
            for (const policy of allUserPolicies) {
                const result = await IAM.detachUserPolicy({
                    userName: user.UserName, policyArn: policy.PolicyArn });
                if (result.err) {
                    throw new Error(result.err);
                }
            }
        }

        // List and detach policies for each group
        const allGroups = await listAllEntities<Group>(IAM.listGroups, 'Groups');
        for (const group of allGroups) {
            const allGroupPolicies = await listAttachedPolicies<AttachedPolicy>(
                params => IAM.listAttachedGroupPolicies({ groupName: group.GroupName, ...params }),
            );
            for (const policy of allGroupPolicies) {
                const result = await IAM.detachGroupPolicy({
                    groupName: group.GroupName, policyArn: policy.PolicyArn });
                if (result.err) {
                    throw new Error(result.err);
                }
            }
        }

        // List and detach policies for each role
        const allRoles = await listAllEntities<Role>(IAM.listRoles, 'Roles');
        for (const role of allRoles) {
            const allRolePolicies = await listAttachedPolicies<AttachedPolicy>(
                params => IAM.listAttachedRolePolicies({ roleName: role.RoleName, ...params }),
            );
            for (const policy of allRolePolicies) {
                const result = await IAM.detachRolePolicy({
                    roleName: role.RoleName, policyArn: policy.PolicyArn });
                if (result.err) {
                    throw new Error(result.err);
                }
            }
        }

        // Delete all policies
        const allPolicies = await listAllEntities<Policy>(IAM.listPolicies, 'Policies');
        for (const policy of allPolicies) {
            const result = await IAM.deletePolicy({ policyArn: policy.Arn });
            if (result.err) {
                throw new Error(result.err);
            }
        }

        // Delete all roles
        for (const role of allRoles) {
            const result = await IAM.deleteRole({ roleName: role.RoleName });
            if (result.err) {
                throw new Error(result.err);
            }
        }

        // Delete all groups
        for (const group of allGroups) {
            const result = await IAM.deleteGroup({ groupName: group.GroupName });
            if (result.err) {
                throw new Error(result.err);
            }
        }

        // Delete all users
        for (const user of allUsers) {
            const result = await IAM.deleteUser({ userName: user.UserName });
            if (result.err) {
                throw new Error(result.err);
            }
        }

        // Finally, delete the account
        await world.deleteAccount(accountName);
    } catch (err) {
        world.logger.warn('Error while deleting cross account', {
            accountName,
            error: err,
        });
    }
}
