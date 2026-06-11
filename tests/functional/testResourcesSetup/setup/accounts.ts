import { STSClient, AssumeRoleWithWebIdentityCommand } from '@aws-sdk/client-sts';
import { CoreV1Api } from '@kubernetes/client-node';
import { PensieveClient } from './clients/pensieveClient';
import { AccountCredentials, createKubernetesSecret } from './clients/k8s';
import { Env } from '../config';

async function getAccountCredentials(
    stsClient: STSClient,
    token: string,
    accountId: string,
): Promise<AccountCredentials> {
    const result = await stsClient.send(new AssumeRoleWithWebIdentityCommand({
        RoleArn: `arn:aws:iam::${accountId}:role/scality-internal/storage-manager-role`,
        RoleSessionName: 'end2end',
        WebIdentityToken: token,
        DurationSeconds: 60 * 60 * 12, // 12 hours, max allows by sts assume role
    }));
    if (!result.Credentials?.AccessKeyId || !result.Credentials?.SecretAccessKey || !result.Credentials?.SessionToken) {
        throw new Error(`Incomplete credentials returned from STS for account ${accountId}`);
    }
    return {
        AccessKeyId: result.Credentials.AccessKeyId,
        SecretAccessKey: result.Credentials.SecretAccessKey,
        SessionToken: result.Credentials.SessionToken,
    };
}

export async function createAccounts(
    pensieveClient: PensieveClient,
    stsClient: STSClient,
    coreClient: CoreV1Api,
    env: Env,
    accountNames: string[],
): Promise<Record<string, AccountCredentials>> {
    const creds: Record<string, AccountCredentials> = {};
    for (const accountName of accountNames) {
        const user = await pensieveClient.createUser(env.UUID, accountName);
        const credentials = await getAccountCredentials(stsClient, env.TOKEN, user.id);
        await createKubernetesSecret(coreClient, env.NAMESPACE, `end2end-account-${user.userName}`, {
            AccessKeyId: credentials.AccessKeyId,
            SecretAccessKey: credentials.SecretAccessKey,
            SessionToken: credentials.SessionToken,
            AccountId: user.id,
        });
        console.log(`Created account: ${accountName}`);
        creds[accountName] = credentials;
    }
    return creds;
}
