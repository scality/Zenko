import axios from 'axios';
import { S3Client, CreateBucketCommand, DeleteBucketCommand, BucketLocationConstraint } from '@aws-sdk/client-s3';
import { IAMClient, CreateUserCommand, CreateAccessKeyCommand, CreateRoleCommand, CreatePolicyCommand, AttachRolePolicyCommand } from '@aws-sdk/client-iam';
import KubernetesHelper from 'cli-testing/utils/KubernetesHelper';
import { logger } from './utils/logger';
import { getInstanceId, getManagementEndpoint, getManagementToken } from './utils/management';
import config from '../configs/locations.json';
import { waitForZenkoToStabilize } from './utils/zenko-status';
import { createResourcesForLocations, resolveEnvValues, sanitizeLocationForAPI, StorageLocation } from './utils/resource-creation';
import * as k8s from './utils/k8s';
import { waitForResourceVersionChange } from './utils/k8s';
import { verifyS3CReadiness } from './metadata';

interface AccountCredentials {
    AccessKeyId: string;
    SecretAccessKey: string;
    SessionToken: string;
}

interface CRRUserCredentials {
    accessKey: string;
    secretKey: string;
}

export interface LocationsOptions {
    namespace: string;
    subdomain: string;
    zenkoName: string;
    configFile?: string;
}

/**
 * Replace subdomain placeholders in an object
 * @param obj - Object to replace subdomain placeholders in
 * @param subdomain - Subdomain to replace placeholders with
 * @returns Object with subdomain placeholders replaced
 */
function replaceSubdomainPlaceholders(obj: any, subdomain: string): any {
    const jsonString = JSON.stringify(obj);
    const replacedString = jsonString.replace(/{{subdomain}}/g, subdomain);
    return JSON.parse(replacedString);
}

/**
 * Setup IAM resources for CRR location
 * Creates a user, role, and policy for cross-region replication
 * @param accountCreds - Account credentials to use for IAM operations
 * @param subdomain - Subdomain for endpoint construction
 * @returns User credentials (accessKey and secretKey)
 */
async function setupCRRIAMResources(accountCreds: AccountCredentials, subdomain: string): Promise<CRRUserCredentials> {
    const iamEndpoint = process.env.VAULT_IAM_ENDPOINT || `http://iam.${subdomain}`;
    const crrRoleName = process.env.CRR_ROLE_NAME || 'crr-role';

    logger.info('Setting up CRR IAM resources', { iamEndpoint, crrRoleName });

    const iamClient = new IAMClient({
        endpoint: iamEndpoint,
        region: 'us-east-1',
        credentials: {
            accessKeyId: accountCreds.AccessKeyId,
            secretAccessKey: accountCreds.SecretAccessKey,
            sessionToken: accountCreds.SessionToken,
        },
    });

    try {
        const userResponse = await iamClient.send(new CreateUserCommand({
            UserName: 'crr-user',
        }));
        const userArn = userResponse.User?.Arn;
        logger.info('Created CRR IAM user', { userArn });

        const credentialsResponse = await iamClient.send(new CreateAccessKeyCommand({
            UserName: 'crr-user',
        }));
        const accessKey = credentialsResponse.AccessKey?.AccessKeyId!;
        const secretKey = credentialsResponse.AccessKey?.SecretAccessKey!;
        logger.info('Created access key for CRR user');

        const assumeRolePolicyDocument = JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Principal: {
                        AWS: userArn,
                    },
                    Action: 'sts:AssumeRole',
                },
            ],
        });

        await iamClient.send(new CreateRoleCommand({
            RoleName: crrRoleName,
            AssumeRolePolicyDocument: assumeRolePolicyDocument,
        }));
        logger.info('Created CRR IAM role', { crrRoleName });

        const policyDocument = JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: 's3:ReplicateObject',
                    Resource: 'arn:aws:s3:::*/*',
                },
            ],
        });

        const policyResponse = await iamClient.send(new CreatePolicyCommand({
            PolicyName: 'crr-policy',
            PolicyDocument: policyDocument,
        }));
        const policyArn = policyResponse.Policy?.Arn!;
        logger.info('Created CRR IAM policy', { policyArn });

        await iamClient.send(new AttachRolePolicyCommand({
            RoleName: crrRoleName,
            PolicyArn: policyArn,
        }));
        logger.info('Attached policy to CRR role');

        return {
            accessKey,
            secretKey,
        };
    } catch (error: any) {
        logger.error('Failed to setup CRR IAM resources', {
            error: error.message,
        });
        throw new Error(`Failed to setup CRR site: ${error.message}`);
    }
}

/**
 * Setup storage locations via Management API
 * @param options - Locations options
 */
export async function setupLocations(options: LocationsOptions): Promise<void> {
    logger.info('Setting up storage locations via Management API');
    k8s.initKubernetes();

    const locations: StorageLocation[] = config.locations.map(location => ({
        ...location,
        details: replaceSubdomainPlaceholders(location.details, options.subdomain)
    }));

    logger.debug('Locations:', { locations });

    await verifyS3CReadiness();

    await createResourcesForLocations(locations);

    const instanceId = await getInstanceId(options.zenkoName, options.namespace);
    if (!instanceId) {
        throw new Error('Instance ID is required for location setup');
    }

    const managementEndpoint = await getManagementEndpoint(options.zenkoName, options.namespace);
    const token = await getManagementToken(options.subdomain);

    logger.debug('Management API configuration', {
        zenkoName: options.zenkoName,
        namespace: options.namespace,
        subdomain: options.subdomain,
        managementEndpoint,
        instanceId
    });

    const accountsCredentials: Record<string, AccountCredentials> = {};
    const crrSourceAccountName = process.env.CRR_SOURCE_ACCOUNT_NAME;
    const crrDestinationAccountName = process.env.CRR_DESTINATION_ACCOUNT_NAME;

    if (crrSourceAccountName) {
        try {
            const sourceSecret = await KubernetesHelper.getClientCore()!.readNamespacedSecret({
                name: `end2end-account-${crrSourceAccountName}`,
                namespace: options.namespace,
            });
            accountsCredentials[crrSourceAccountName] = {
                AccessKeyId: Buffer.from(sourceSecret.data?.AccessKeyId || '', 'base64').toString('utf8'),
                SecretAccessKey: Buffer.from(sourceSecret.data?.SecretAccessKey || '', 'base64').toString('utf8'),
                SessionToken: Buffer.from(sourceSecret.data?.SessionToken || '', 'base64').toString('utf8'),
            };
            logger.debug('Loaded CRR source account credentials');
        } catch (error: any) {
            logger.warn(`Could not load CRR source account credentials: ${error.message}`);
        }
    }

    if (crrDestinationAccountName) {
        try {
            const destSecret = await KubernetesHelper.getClientCore()!.readNamespacedSecret({
                name: `end2end-account-${crrDestinationAccountName}`,
                namespace: options.namespace,
            });
            accountsCredentials[crrDestinationAccountName] = {
                AccessKeyId: Buffer.from(destSecret.data?.AccessKeyId || '', 'base64').toString('utf8'),
                SecretAccessKey: Buffer.from(destSecret.data?.SecretAccessKey || '', 'base64').toString('utf8'),
                SessionToken: Buffer.from(destSecret.data?.SessionToken || '', 'base64').toString('utf8'),
            };
            logger.debug('Loaded CRR destination account credentials');
        } catch (error: any) {
            logger.warn(`Could not load CRR destination account credentials: ${error.message}`);
        }
    }

    const cloudserverDeployment = `${options.zenkoName}-connector-cloudserver`;
    const initialCloudserverGeneration = await k8s.getDeploymentGeneration(options.namespace, cloudserverDeployment);
    const labelSelector = `app.kubernetes.io/name=connector-cloudserver-config,app.kubernetes.io/instance=${options.zenkoName}`;
    const secrets = await KubernetesHelper.getSecretsByLabels(options.namespace, labelSelector);
    const initialSecretVersion = secrets[0]?.metadata?.resourceVersion;

    const locationsToBootstrap: Array<{ locationName: string; sourceBucket: string }> = [];

    const enableRingTests = process.env.ENABLE_RING_TESTS === 'true';
    const deployCRRLocations = process.env.DEPLOY_CRR_LOCATIONS !== 'false';

    for (const location of locations) {
        if (location.createResources?.skipLocationCreation) {
            logger.info(`Skipping location ${location.name} (skipLocationCreation=true)`);
            continue;
        }

        if (!enableRingTests && location.locationType === 'location-scality-ring-s3-v1') {
            logger.info(`Skipping Ring location ${location.name} (ENABLE_RING_TESTS=false)`);
            continue;
        }

        if (location.locationType === 'location-scality-crr-v1') {
            if (!deployCRRLocations) {
                logger.info(`Skipping CRR location ${location.name} (DEPLOY_CRR_LOCATIONS=false)`);
                continue;
            }

            const locationName = resolveEnvValues(location.name);
            const crrDestLocationName = process.env.CRR_DESTINATION_LOCATION_NAME;
            const accountName = locationName === crrDestLocationName
                ? crrDestinationAccountName
                : crrSourceAccountName;

            if (!accountName || !accountsCredentials[accountName]) {
                logger.warn(`Skipping CRR location ${location.name}: account credentials not available`);
                continue;
            }

            const userCreds = await setupCRRIAMResources(accountsCredentials[accountName], options.subdomain);
            location.details.accessKey = userCreds.accessKey;
            location.details.secretKey = userCreds.secretKey;

            logger.info(`Configured CRR location ${location.name} with IAM credentials`, { location });
        }

        const sanitizedLocation = sanitizeLocationForAPI(location);
        await createStorageLocation(managementEndpoint, token, instanceId, sanitizedLocation);

        if (location.bootstrapIngestion && location.createResources?.createBucket) {
            const locationName = resolveEnvValues(location.name);
            const sourceBucket = resolveEnvValues(location.details.bucketName);
            locationsToBootstrap.push({ locationName, sourceBucket });
        }
    }

    logger.info(`Created storage locations`);

    logger.info('Waiting for Zenko operator to reconcile locations...');
    await waitForZenkoToStabilize({
        namespace: options.namespace,
        zenkoName: options.zenkoName,
        timeout: 10 * 60 * 1000,
    });

    await waitForResourceVersionChange(
        options.namespace,
        'secret',
        labelSelector,
        initialSecretVersion,
        5 * 60 * 1000
    );

    await k8s.waitForDeploymentRestart(
        options.namespace,
        cloudserverDeployment,
        initialCloudserverGeneration,
        5 * 60 * 1000
    );

    await k8s.waitForDataServicesToStabilize(options.namespace, 5 * 60 * 1000);

    if (locationsToBootstrap.length > 0) {
        logger.info(`Bootstrapping ${locationsToBootstrap.length} ingestion location(s)`);

        for (const { locationName, sourceBucket } of locationsToBootstrap) {
            await waitForLocationInCloudserver(locationName, options.namespace, options.zenkoName);
            await bootstrapIngestionConsumerGroup(locationName, sourceBucket, instanceId, options.namespace, options.zenkoName);
        }

        logger.info('Ingestion bootstrap completed');
    }
}

/**
 * Wait for location to be available in cloudserver config secret
 * @param locationName - Location name
 * @param namespace - Namespace
 * @param zenkoName - Zenko name
 * @param timeout - Timeout
 */
async function waitForLocationInCloudserver(
    locationName: string,
    namespace: string,
    zenkoName: string,
    timeout: number = 60000
): Promise<void> {
    const labelSelector = `app.kubernetes.io/name=connector-cloudserver-config,app.kubernetes.io/instance=${zenkoName}`;
    const startTime = Date.now();
    const pollInterval = 2000;

    logger.info(`Verifying location ${locationName} is in cloudserver config`);

    while (Date.now() - startTime < timeout) {
        try {
            const secrets = await KubernetesHelper.getSecretsByLabels(namespace, labelSelector);
            if (!secrets || secrets.length === 0) {
                throw new Error('connector-cloudserver-config secret not found');
            }

            const locationConfigJson = KubernetesHelper.getSecretData(secrets[0], 'locationConfig.json');
            if (locationConfigJson) {
                const locationConfig = JSON.parse(locationConfigJson);
                if (locationConfig[locationName]) {
                    logger.info(`Location ${locationName} confirmed in cloudserver config`);
                    return;
                }
            }
        } catch (error: any) {
            logger.debug(`Waiting for location ${locationName} in config: ${error.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Timeout waiting for location ${locationName} in cloudserver config`);
}

/**
 * Bootstrap ingestion consumer group
 * @param locationName - Location name
 * @param sourceBucket - Source bucket
 * @param instanceId - Instance ID
 * @param namespace - Namespace
 * @param zenkoName - Zenko name
 */
async function bootstrapIngestionConsumerGroup(
    locationName: string,
    sourceBucket: string,
    instanceId: string,
    namespace: string,
    zenkoName: string
): Promise<void> {
    logger.info(`Bootstrapping ingestion for location: ${locationName}`);

    const secretName = 'end2end-account-zenko';
    const secret = await KubernetesHelper.getClientCore()!.readNamespacedSecret({
        name: secretName,
        namespace,
    });

    const data = secret.data || {};
    const credentials = {
        accessKeyId: Buffer.from(data.AccessKeyId || '', 'base64').toString('utf8'),
        secretAccessKey: Buffer.from(data.SecretAccessKey || '', 'base64').toString('utf8'),
        sessionToken: Buffer.from(data.SessionToken || '', 'base64').toString('utf8'),
    };

    const s3Endpoint = `http://${zenkoName}-connector-s3api.${namespace}.svc.cluster.local`;
    const destinationBucket = `ingestion-bootstrap-${Date.now()}`;
    const locationNameWithSuffix = `${locationName}:ingest`;

    const s3Client = new S3Client({
        endpoint: s3Endpoint,
        region: 'us-east-1',
        credentials,
        forcePathStyle: true,
    });

    try {
        const maxAttempts = 30;
        const retryDelay = 2000;
        let lastError: any;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await s3Client.send(new CreateBucketCommand({
                    Bucket: destinationBucket,
                    CreateBucketConfiguration: {
                        LocationConstraint: locationNameWithSuffix as BucketLocationConstraint,
                    },
                }));

                logger.info(`Created ingestion bucket: ${destinationBucket}`);
                break; // Success!
            } catch (error: any) {
                lastError = error;
                const errorMsg = error.message || '';

                if (errorMsg.includes('not listed in the locationConstraint config')) {
                    if (attempt < maxAttempts) {
                        logger.info(`CloudServer hasn't loaded location ${locationName} yet, attempt ${attempt}/${maxAttempts}, retrying in ${retryDelay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        continue;
                    }
                }

                throw error;
            }
        }

        // Wait for ingestion producer to scan and find the new bucket
        // The producer periodically lists all buckets and updates its internal state
        await new Promise(resolve => setTimeout(resolve, 10000));

        const backbeatApiEndpoint = `http://${zenkoName}-management-backbeat-api.${namespace}.svc.cluster.local:80`;
        try {
            await axios.post(`${backbeatApiEndpoint}/_/backbeat/api/ingestion/resume/${locationName}`);
            logger.info(`Resumed ingestion for location: ${locationName}`);
        } catch (err: any) {
            logger.warn(`Failed to resume ingestion (may still work): ${err.message}`);
        }

        await k8s.waitForIngestionConsumerGroup(namespace, instanceId, zenkoName, 5 * 60 * 1000);

        logger.info(`Ingestion consumer group is stable for location: ${locationName}`);

        await s3Client.send(new DeleteBucketCommand({ Bucket: destinationBucket }));
    } catch (error) {
        logger.error(`Failed to bootstrap ingestion for ${locationName}`, {
            error: error instanceof Error ? error.message : String(error),
        });

        try {
            await s3Client.send(new DeleteBucketCommand({ Bucket: destinationBucket }));
        } catch (cleanupError) {
            // Ignore cleanup errors
        }

        throw error;
    }
}

/**
 * Create storage location
 * @param endpoint - Endpoint
 * @param token - Token
 * @param instanceId - Instance ID
 * @param location - Location
 */
async function createStorageLocation(
    endpoint: string,
    token: string,
    instanceId: string,
    location: StorageLocation
): Promise<void> {
    const locationDetails = {
        ...location.details,
        bootstrapList: location.details.bootstrapList || []
    };

    const locationName = resolveEnvValues(location.name);

    const locationPayload = {
        name: locationName,
        locationType: location.locationType,
        details: locationDetails,
    };

    if (location.legacyAwsBehavior) {
        locationPayload.details.legacyAwsBehavior = location.legacyAwsBehavior;
    }

    if ((location.locationType === 'location-aws-s3-v1' ||
        location.locationType === 'location-scality-ring-s3-v1') &&
        locationDetails.bucketMatch === false) {
        locationPayload.details.forcePathStyle = true;
    }

    locationPayload.details = resolveEnvValues(locationPayload.details);

    logger.debug('Creating location via Management API', {
        endpoint,
        instanceId,
        locationName: location.name,
        url: `${endpoint}/api/v1/config/${instanceId}/location`
    });

    try {
        const response = await axios.post(
            `${endpoint}/api/v1/config/${instanceId}/location`,
            locationPayload,
            {
                headers: {
                    'X-Authentication-Token': token,
                    'Content-Type': 'application/json'
                },
                timeout: 30000,
            }
        );

        if (response.status === 200 || response.status === 201) {
            logger.info(`Created storage location: ${location.name}`);
        }
    } catch (error: any) {
        if (error.response?.status === 409) {
            logger.debug(`Storage location ${location.name} already exists, skipping creation`);
            return;
        }
        if (error.response?.status === 404) {
            logger.error(`Instance not found when creating location ${location.name}`, {
                status: 404,
                data: error.response?.data
            });
        }
        if (error.response?.status === 403) {
            logger.error(`Forbidden when creating location ${location.name}`, {
                status: 403,
                endpoint,
                instanceId,
                url: `${endpoint}/api/v1/config/${instanceId}/location`,
                responseData: error.response?.data,
                message: error.message,
            });
        }
        logger.error(`Failed to create location ${location.name}`, {
            status: error.response?.status,
            message: error.message,
        });
        throw error;
    }
}
