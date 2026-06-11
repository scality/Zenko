import fs from 'fs';
import yaml from 'js-yaml';

export interface EndpointConfig {
    hostname: string;
    locationName: string;
}

export interface LocationDetails {
    bucketName?: string;
    endpoint?: string;
    accessKey?: string;
    secretKey?: string;
    bucketMatch?: boolean;
    repoId?: string[];
    bootstrapList?: string[];
    mpuBucketName?: string;
    stsEndpoint?: string;
    username?: string;
    password?: string;
    nsId?: string;
    queue?: {
        type: string;
        queueName: string;
        endpoint: string;
    };
    auth?: {
        type: string;
        accountName: string;
        accountKey: string;
    };
}

export interface LocationConfig {
    name: string;
    locationType: string;
    details: LocationDetails;
}

export interface E2EConfig {
    accounts: string[];
    endpoints: EndpointConfig[];
    locations: LocationConfig[];
}

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export interface Env {
    TOKEN: string;
    UUID: string;
    NAMESPACE: string;
    MANAGEMENT_ENDPOINT: string;
    IAM_ENDPOINT: string;
    STS_ENDPOINT: string;
    CONFIG_FILE: string;
    KUBECONFIG?: string;
    VERIFY_CERTIFICATES: boolean;
    ENABLE_RING_TESTS: boolean;
    DEPLOY_CRR_LOCATIONS: boolean;
    CRR_ROLE_NAME: string;
    CRR_SOURCE_ACCOUNT_NAME?: string;
    CRR_DESTINATION_ACCOUNT_NAME?: string;
    CRR_DESTINATION_LOCATION_NAME?: string;
    // Cloud provider credentials — optional since a provider may not be configured
    AWS_ACCESS_KEY?: string;
    AWS_SECRET_KEY?: string;
    AWS_ENDPOINT?: string;
    AWS_FAIL_BUCKET_NAME?: string;
    AWS_REPLICATION_FAIL_CTST_BUCKET_NAME?: string;
    RING_S3C_ACCESS_KEY?: string;
    RING_S3C_SECRET_KEY?: string;
    RING_S3C_ENDPOINT?: string;
    RING_S3C_INGESTION_SRC_BUCKET_NAME?: string;
    RING_S3C_INGESTION_SRC_NON_VERSIONED_BUCKET_NAME?: string;
    RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE?: number;
    AZURE_BACKEND_ENDPOINT?: string;
    AZURE_BACKEND_QUEUE_ENDPOINT?: string;
    AZURE_ACCOUNT_NAME?: string;
    AZURE_SECRET_KEY?: string;
    AZURE_CRR_BUCKET_NAME?: string;
    AZURE_ARCHIVE_BUCKET_NAME?: string;
    AZURE_ARCHIVE_BUCKET_NAME_2?: string;
    AZURE_ARCHIVE_QUEUE_NAME?: string;
}

export function loadConfig(configFile: string): E2EConfig {
    const content = fs.readFileSync(configFile, 'utf8');
    return yaml.load(content) as E2EConfig;
}

export function loadEnv(): Env {
    return {
        TOKEN: requireEnv('TOKEN'),
        UUID: requireEnv('UUID'),
        NAMESPACE: process.env.NAMESPACE ?? 'default',
        MANAGEMENT_ENDPOINT: requireEnv('MANAGEMENT_ENDPOINT').replace(/\/$/, ''),
        IAM_ENDPOINT: requireEnv('IAM_ENDPOINT'),
        STS_ENDPOINT: requireEnv('STS_ENDPOINT'),
        CONFIG_FILE: requireEnv('CONFIG_FILE'),
        KUBECONFIG: process.env.KUBECONFIG,
        VERIFY_CERTIFICATES: process.env.VERIFY_CERTIFICATES?.toLowerCase() === 'true',
        ENABLE_RING_TESTS: process.env.ENABLE_RING_TESTS?.toLowerCase() !== 'false',
        DEPLOY_CRR_LOCATIONS: process.env.DEPLOY_CRR_LOCATIONS?.toLowerCase() !== 'false',
        CRR_ROLE_NAME: process.env.CRR_ROLE_NAME ?? 'crr-role',
        CRR_SOURCE_ACCOUNT_NAME: process.env.CRR_SOURCE_ACCOUNT_NAME,
        CRR_DESTINATION_ACCOUNT_NAME: process.env.CRR_DESTINATION_ACCOUNT_NAME,
        CRR_DESTINATION_LOCATION_NAME: process.env.CRR_DESTINATION_LOCATION_NAME,
        AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
        AWS_SECRET_KEY: process.env.AWS_SECRET_KEY,
        AWS_ENDPOINT: process.env.AWS_ENDPOINT,
        AWS_FAIL_BUCKET_NAME: process.env.AWS_FAIL_BUCKET_NAME,
        AWS_REPLICATION_FAIL_CTST_BUCKET_NAME: process.env.AWS_REPLICATION_FAIL_CTST_BUCKET_NAME,
        RING_S3C_ACCESS_KEY: process.env.RING_S3C_ACCESS_KEY,
        RING_S3C_SECRET_KEY: process.env.RING_S3C_SECRET_KEY,
        RING_S3C_ENDPOINT: process.env.RING_S3C_ENDPOINT,
        RING_S3C_INGESTION_SRC_BUCKET_NAME: process.env.RING_S3C_INGESTION_SRC_BUCKET_NAME,
        RING_S3C_INGESTION_SRC_NON_VERSIONED_BUCKET_NAME: process.env.RING_S3C_INGESTION_SRC_NON_VERSIONED_BUCKET_NAME,
        RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE:
            process.env.RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE
                ? parseInt(process.env.RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE, 10)
                : undefined,
        AZURE_BACKEND_ENDPOINT: process.env.AZURE_BACKEND_ENDPOINT,
        AZURE_BACKEND_QUEUE_ENDPOINT: process.env.AZURE_BACKEND_QUEUE_ENDPOINT,
        AZURE_ACCOUNT_NAME: process.env.AZURE_ACCOUNT_NAME,
        AZURE_SECRET_KEY: process.env.AZURE_SECRET_KEY,
        AZURE_CRR_BUCKET_NAME: process.env.AZURE_CRR_BUCKET_NAME,
        AZURE_ARCHIVE_BUCKET_NAME: process.env.AZURE_ARCHIVE_BUCKET_NAME,
        AZURE_ARCHIVE_BUCKET_NAME_2: process.env.AZURE_ARCHIVE_BUCKET_NAME_2,
        AZURE_ARCHIVE_QUEUE_NAME: process.env.AZURE_ARCHIVE_QUEUE_NAME,
    };
}
