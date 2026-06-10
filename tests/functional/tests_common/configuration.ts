import { S3Client } from '@aws-sdk/client-s3';
import { IAMClient } from '@aws-sdk/client-iam';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { getSecretByLabel, getSecretByName, getSecretAllFieldsByLabel, getCustomObject } from "./kubernetes";

const ZENKO_NAME = process.env.ZENKO_NAME || 'end2end';
const INSTANCE_SELECTOR = `app.kubernetes.io/instance=${ZENKO_NAME}`;

export const ZENKO_ACCOUNT_NAME = 'zenko-ctst';
export const CLOUDSERVER_HOST = 's3.zenko.local';
export const CLOUDSERVER_ENDPOINT = 'http://s3.zenko.local';
export const VAULT_ENDPOINT = 'http://iam.zenko.local';
export const VAULT_AUTH_HOST = 'vault-auth.zenko.local';
export const VAULT_STS_ENDPOINT = 'http://sts.zenko.local';
export const BACKBEAT_API_HOST = 'backbeat-api.zenko.local';
export const BACKBEAT_API_ENDPOINT = 'http://backbeat-api.zenko.local';
export const BACKBEAT_API_PORT = '80';
export const KEYCLOAK_TEST_PORT = '80'
export const KEYCLOAK_GRANT_TYPE = 'password'
export const KAFKA_CONNECT_URL = 'http://kafka-connect.zenko.local/connectors';
export const AZURE_ARCHIVE_ACCESS_TIER = 'Hot';
export const AZURE_ARCHIVE_MANIFEST_TIER = 'Hot';

export interface VaultCredentials {
    accessKey: string;
    secretKey: string;
}

export interface NamedVaultCredentials extends VaultCredentials {
    name: string;
}

export interface AccountCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
}

// Minimal Zenko CR (only fields needed for the tests)
interface ZenkoCR {
    metadata: {
        annotations?: Record<string, string>;
    };
    spec: {
        kafkaCleaner: {
            interval?: string;
        };
        sorbet: {
            server: {
                azure: {
                    restoreTimeout?: string;
                };
            };
        };
        scuba: {
            api: {
                ingress: {
                    hostname?: string;
                };
            };
        };
    };
    status: {
        instanceID: string;
    };
}

export interface TestsConfiguration {
    KafkaTopics: {
        DeadLetterQueue: string;
        ObjectTasks: string;
        GcRequest: string;
    }
    ServiceUsers: {
        BackbeatLifecycleBp1: NamedVaultCredentials;
        BackbeatLifecycleConductor1: NamedVaultCredentials;
        BackbeatLifecycleOp1: NamedVaultCredentials;
        BackbeatQp1: NamedVaultCredentials;
        SorbetFwd2: NamedVaultCredentials;
    };
    DRAdmin?: VaultCredentials;
    AdminCredentials: VaultCredentials;
    ZenkoAccount: {
        credentials: AccountCredentials;
        s3Client: S3Client;
        iamClient: IAMClient;
    };
    ZenkoCR: {
        TimeProgressionFactor: number;
        InstanceID: string;
        KafkaCleanerInterval: string;
        SorbetdRestoreTimeout: string;
        UtilizationServiceHost: string;
    };
}

export const config = {} as TestsConfiguration;

export const initConfig = async (): Promise<void> => {
    if (Object.keys(config).length > 0) {
        return;
    }
    const zenkoAccountCredentials = await loadZenkoAccount();
    const clients = createClients(zenkoAccountCredentials);
    Object.assign(config, {
        KafkaTopics: await loadKafkaTopics(),
        ServiceUsers: await loadServiceUsers(),
        DRAdmin: await loadDRAdminCredentials(),
        AdminCredentials: await loadAdminCredentials(),
        ZenkoCR: await loadZenkoCR(),
        ZenkoAccount: {
            credentials: zenkoAccountCredentials,
            iamClient: clients.iamClient,
            s3Client: clients.s3Client,            
        },
    });
};

const createClients = (zenkoAccount: AccountCredentials): { s3Client: S3Client; iamClient: IAMClient } => {
    const sharedHttpHandler = new NodeHttpHandler({ requestTimeout: 0, connectionTimeout: 0 });
    const credentials = {
        accessKeyId: zenkoAccount.accessKeyId,
        secretAccessKey: zenkoAccount.secretAccessKey,
        sessionToken: zenkoAccount.sessionToken,
    };
    return {
        s3Client: new S3Client({
            credentials,
            tls: false,
            endpoint: CLOUDSERVER_ENDPOINT,
            region: 'us-east-1',
            forcePathStyle: true,
            maxAttempts: 1,
            requestHandler: sharedHttpHandler,
        }),
        iamClient: new IAMClient({
            credentials,
            tls: false,
            endpoint: VAULT_ENDPOINT,
            region: 'us-east-1',
            maxAttempts: 1,
            requestHandler: sharedHttpHandler,
        }),
    };
};

const loadKafkaTopics = async (): Promise<TestsConfiguration['KafkaTopics']> => {
    const labelSelector =
        'app.kubernetes.io/name=cold-sorbet-config-e2e-azure-archive' +
        `,${INSTANCE_SELECTOR}`;
    const raw = await getSecretByLabel(labelSelector, 'config.json');
    const sorbetKafkaConfig = JSON.parse(raw) as Record<string, string>;
    return {
        DeadLetterQueue: sorbetKafkaConfig['kafka-dead-letter-topic'],
        ObjectTasks: sorbetKafkaConfig['kafka-object-task-topic'],
        GcRequest: sorbetKafkaConfig['kafka-gc-request-topic'],
    };
};

const loadServiceUsers = async (): Promise<TestsConfiguration['ServiceUsers']> => {
    const load = async (secretName: string): Promise<NamedVaultCredentials> => {
        const label = `app.kubernetes.io/name=${secretName},${INSTANCE_SELECTOR}`;
        const data = await getSecretAllFieldsByLabel(label);
        const jsonKey = Object.keys(data).find(k => k.endsWith('.json'));
        if (!jsonKey) {
            throw new Error(`No .json key found in secret "${secretName}"`);
        }
        return { ...JSON.parse(data[jsonKey]) as VaultCredentials, name: jsonKey.replace('.json', '') };
    };
    const sorbetSelector = `app.kubernetes.io/name=sorbet-fwd-creds,${INSTANCE_SELECTOR}`;
    return {
        BackbeatLifecycleBp1: await load('backbeat-lcbp-user-creds'),
        BackbeatLifecycleConductor1: await load('backbeat-lcc-user-creds'),
        BackbeatLifecycleOp1: await load('backbeat-lcop-user-creds'),
        BackbeatQp1: await load('backbeat-qp-user-creds'),
        SorbetFwd2: {
            name: 'sorbet-fwd-2',
            accessKey: await getSecretByLabel(sorbetSelector, 'accessKey'),
            secretKey: await getSecretByLabel(sorbetSelector, 'secretKey'),
        },
    };
};

const loadDRAdminCredentials = async (): Promise<VaultCredentials | undefined> => {
    const praSecretName = `${ZENKO_NAME}-pra-management-vault-admin-creds.v1`;
    try {
        const accessKey = await getSecretByName(praSecretName, 'accessKey');
        const secretKey = await getSecretByName(praSecretName, 'secretKey');
        return { accessKey, secretKey };
    } catch {
        // PRA admin credentials are optional : may not exist for non-PRA runs
        return undefined;
    }
};

const loadAdminCredentials = async (): Promise<VaultCredentials> => {
    const secretName = `${ZENKO_NAME}-management-vault-admin-creds.v1`;
    const accessKey = await getSecretByName(secretName, 'accessKey');
    const secretKey = await getSecretByName(secretName, 'secretKey');
    return { accessKey, secretKey };
};

const loadZenkoAccount = async (): Promise<AccountCredentials> => {
    const secretName = `${ZENKO_NAME}-account-zenko`;
    const accessKeyId = await getSecretByName(secretName, 'AccessKeyId');
    const secretAccessKey = await getSecretByName(secretName, 'SecretAccessKey');
    let sessionToken: string | undefined;
    try {
        sessionToken = await getSecretByName(secretName, 'SessionToken');
    } catch {
        sessionToken = undefined;
    }
    return { accessKeyId, secretAccessKey, sessionToken };
};

const loadZenkoCR = async (): Promise<TestsConfiguration['ZenkoCR']> => {
    const cr = await getCustomObject(
        'zenko.io', 'v1alpha2', 'zenkos', ZENKO_NAME,
    ) as unknown as ZenkoCR;
    return {
        TimeProgressionFactor: Number(cr.metadata.annotations?.['zenko.io/time-progression-factor'] || '1'),
        InstanceID: cr.status.instanceID,
        KafkaCleanerInterval: cr.spec.kafkaCleaner.interval || '',
        SorbetdRestoreTimeout: cr.spec.sorbet.server.azure.restoreTimeout || '',
        UtilizationServiceHost: cr.spec.scuba.api.ingress.hostname || '',
    };
};
