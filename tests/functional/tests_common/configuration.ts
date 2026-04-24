import { S3Client } from '@aws-sdk/client-s3';
import { IAMClient } from '@aws-sdk/client-iam';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { getSecretByLabel, getSecretByName, getCustomObject } from "./kubernetes";

let cachedConfiguration: TestsConfiguration | null = null;

const ZENKO_NAME = 'end2end';
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
export const KAFKA_CONNECT_URL = 'http://kafka-connect.zenko.local/connectors';

export interface ServiceUserCredentials {
    accessKey: string;
    secretKey: string;
}

export interface AccountCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
}

// Minimal Zenko CR type (fields used by tests only)
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
        BackbeatLifecycleBp1: ServiceUserCredentials;
        BackbeatLifecycleConductor1: ServiceUserCredentials;
        BackbeatLifecycleOp1: ServiceUserCredentials;
        BackbeatQp1: ServiceUserCredentials;
        SorbetFwd2: ServiceUserCredentials;
    };
    PRAAdmin?: ServiceUserCredentials;
    AdminCredentials: ServiceUserCredentials;
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

export const getConfig = (): TestsConfiguration => {
    if (!cachedConfiguration) {
        throw new Error('Config not initialized — populateParameters() has not been called yet');
    }
    return cachedConfiguration;
};

export const populateParameters = async (): Promise<TestsConfiguration> => {
    if (cachedConfiguration) {
        return cachedConfiguration;
    }

    const zenkoAccountCredentials = await loadZenkoAccount();

    cachedConfiguration = {
        KafkaTopics: await loadKafkaTopics(),
        ServiceUsers: await loadServiceUsers(),
        PRAAdmin: await loadPRACredentials(),
        AdminCredentials: await loadAdminCredentials(),
        ZenkoCR: await loadZenkoCR(),
        ZenkoAccount: {
            credentials: zenkoAccountCredentials,
            ...createClients(zenkoAccountCredentials),
        },
    };
    return cachedConfiguration;
}

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
    const config = JSON.parse(raw) as Record<string, string>;
    return {
        DeadLetterQueue: config['kafka-dead-letter-topic'],
        ObjectTasks: config['kafka-object-task-topic'],
        GcRequest: config['kafka-gc-request-topic'],
    };
};

const loadServiceUsers = async (): Promise<TestsConfiguration['ServiceUsers']> => {
    const lcBp = 'backbeat-lifecycle-bp-1';
    const lcConductor = 'backbeat-lifecycle-conductor-1';
    const lcOp = 'backbeat-lifecycle-op-1';
    const qp = 'backbeat-qp-1';
    const serviceUsers: Record<string, string> = {
        'backbeat-lcbp-user-creds': lcBp,
        'backbeat-lcc-user-creds': lcConductor,
        'backbeat-lcop-user-creds': lcOp,
        'backbeat-qp-user-creds': qp,
    };
    const fetchedCreds: Record<string, ServiceUserCredentials> = {};
    for (const [secretName, userName] of Object.entries(serviceUsers)) {
        const label = `app.kubernetes.io/name=${secretName},${INSTANCE_SELECTOR}`;
        const raw = await getSecretByLabel(label, `${userName}.json`);
        fetchedCreds[userName] = JSON.parse(raw) as ServiceUserCredentials;
    }
    const sorbetSelector =
        `app.kubernetes.io/name=sorbet-fwd-creds,${INSTANCE_SELECTOR}`;
    const accessKey = await getSecretByLabel(sorbetSelector, 'accessKey');
    const secretKey = await getSecretByLabel(sorbetSelector, 'secretKey');
    return {
        BackbeatLifecycleBp1: fetchedCreds[lcBp],
        BackbeatLifecycleConductor1: fetchedCreds[lcConductor],
        BackbeatLifecycleOp1: fetchedCreds[lcOp],
        BackbeatQp1: fetchedCreds[qp],
        SorbetFwd2: { accessKey, secretKey },
    };
};

const loadPRACredentials = async (): Promise<ServiceUserCredentials | undefined> => {
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

const loadAdminCredentials = async (): Promise<ServiceUserCredentials> => {
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
