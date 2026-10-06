import { STSClient, AssumeRoleWithWebIdentityCommand } from '@aws-sdk/client-sts';
import { PensieveClient } from 'clients/pensieveClient';
import { KubernetesClient } from 'clients/k8s';
import { AWSCredentials } from 'clients/aws';
import { Env } from '../config';

async function getAccountCredentials(
    stsClient: STSClient,
    token: string,
    accountId: string,
): Promise<Required<AWSCredentials>> {
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
        accessKeyId: result.Credentials.AccessKeyId,
        secretAccessKey: result.Credentials.SecretAccessKey,
        sessionToken: result.Credentials.SessionToken,
    };
}

export async function createAccounts(
    pensieveClient: PensieveClient,
    stsClient: STSClient,
    k8sClient: KubernetesClient,
    env: Env,
    accountNames: string[],
): Promise<Record<string, AWSCredentials>> {
    const creds: Record<string, AWSCredentials> = {};
    for (const accountName of accountNames) {
        const user = await pensieveClient.createUser(env.UUID, accountName);
        const credentials = await getAccountCredentials(stsClient, env.TOKEN, user.id);
        // setup-e2e-env.sh reads these PascalCase keys from the secret
        await k8sClient.createSecretIfMissing(env.NAMESPACE, `end2end-account-${user.userName}`, {
            AccessKeyId: credentials.accessKeyId,
            SecretAccessKey: credentials.secretAccessKey,
            SessionToken: credentials.sessionToken,
            AccountId: user.id,
        });
        console.log(`Created account: ${accountName}`);
        creds[accountName] = credentials;
    }
    return creds;
}
