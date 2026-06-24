import {
    IAMClient,
    CreateUserCommand,
    CreateAccessKeyCommand,
    CreateRoleCommand,
    CreatePolicyCommand,
    AttachRolePolicyCommand,
} from '@aws-sdk/client-iam';
import { PensieveClient } from './clients/pensieveClient';
import { LocationConfig, Env } from '../config';
import { AccountCredentials } from './clients/k8s';

interface CRRUserCredentials {
    accessKey: string;
    secretKey: string;
}

async function setupCRRIamResources(
    accountCreds: AccountCredentials,
    env: Env,
): Promise<CRRUserCredentials> {
    const iamClient = new IAMClient({
        credentials: {
            accessKeyId: accountCreds.AccessKeyId,
            secretAccessKey: accountCreds.SecretAccessKey,
            sessionToken: accountCreds.SessionToken,
        },
        endpoint: env.IAM_ENDPOINT,
        region: 'us-east-1',
    });

    const userResult = await iamClient.send(new CreateUserCommand({ UserName: 'crr-user' }));
    const accessKeyResult = await iamClient.send(new CreateAccessKeyCommand({ UserName: 'crr-user' }));

    await iamClient.send(new CreateRoleCommand({
        RoleName: env.CRR_ROLE_NAME,
        AssumeRolePolicyDocument: JSON.stringify({
            Version: '2012-10-17',
            Statement: [{
                Effect: 'Allow',
                Principal: { AWS: userResult.User?.Arn },
                Action: 'sts:AssumeRole',
            }],
        }),
    }));

    const policyResult = await iamClient.send(new CreatePolicyCommand({
        PolicyName: 'crr-policy',
        PolicyDocument: JSON.stringify({
            Version: '2012-10-17',
            Statement: [{
                Effect: 'Allow',
                Action: 's3:ReplicateObject',
                Resource: 'arn:aws:s3:::*/*',
            }],
        }),
    }));

    await iamClient.send(new AttachRolePolicyCommand({
        RoleName: env.CRR_ROLE_NAME,
        PolicyArn: policyResult.Policy?.Arn,
    }));

    if (!accessKeyResult.AccessKey?.AccessKeyId || !accessKeyResult.AccessKey?.SecretAccessKey) {
        throw new Error('CreateAccessKey did not return credentials');
    }
    return {
        accessKey: accessKeyResult.AccessKey.AccessKeyId,
        secretKey: accessKeyResult.AccessKey.SecretAccessKey,
    };
}

export async function createLocations(
    pensieveClient: PensieveClient,
    env: Env,
    locations: LocationConfig[],
    accountsCreds: Record<string, AccountCredentials>,
): Promise<void> {
    for (const location of locations) {
        if (!location.name) {
            console.warn(`Skipping location with empty name (type: ${location.locationType})`);
            continue;
        }

        if (!env.ENABLE_RING_TESTS && location.locationType === 'location-scality-ring-s3-v1') {
            continue;
        }

        if (location.locationType === 'location-scality-crr-v1') {
            if (!env.DEPLOY_CRR_LOCATIONS) {
                continue;
            }
            if (!env.CRR_SOURCE_ACCOUNT_NAME || !env.CRR_DESTINATION_ACCOUNT_NAME ||
                !env.CRR_DESTINATION_LOCATION_NAME) {
                throw new Error(
                    'CRR_SOURCE_ACCOUNT_NAME, CRR_DESTINATION_ACCOUNT_NAME, and ' +
                    'CRR_DESTINATION_LOCATION_NAME are required when DEPLOY_CRR_LOCATIONS=true',
                );
            }
            const locationAccountMap: Record<string, string | undefined> = {
                [env.CRR_DESTINATION_LOCATION_NAME ?? '']: env.CRR_DESTINATION_ACCOUNT_NAME,
                [env.CRR_LOCATION_A_NAME ?? '']: env.CRR_ACCOUNT_A_NAME,
                [env.CRR_LOCATION_B_NAME ?? '']: env.CRR_ACCOUNT_B_NAME,
                [env.CRR_LOCATION_C_NAME ?? '']: env.CRR_ACCOUNT_C_NAME,
            };
            const accountName = locationAccountMap[location.name] ?? env.CRR_SOURCE_ACCOUNT_NAME;
            if (!accountName || !accountsCreds[accountName]) {
                throw new Error(
                    `No credentials found for CRR location "${location.name}" ` +
                    `(resolved account: "${accountName ?? 'undefined'}"). ` +
                    'Ensure the corresponding CRR_*_ACCOUNT_NAME env var and k8s secret are set.',
                );
            }
            const userCreds = await setupCRRIamResources(accountsCreds[accountName], env);
            location.details.accessKey = userCreds.accessKey;
            location.details.secretKey = userCreds.secretKey;
        }

        await pensieveClient.createLocation(env.UUID, {
            name: location.name,
            locationType: location.locationType,
            details: location.details as Record<string, unknown>,
        });
        console.log(`Created location: ${location.name}`);
    }
}
