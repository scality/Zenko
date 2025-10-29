import axios from 'axios';
import { S3Client, CreateBucketCommand, DeleteBucketCommand, BucketLocationConstraint } from '@aws-sdk/client-s3';
import KubernetesHelper from 'cli-testing/utils/KubernetesHelper';
import { logger } from './utils/logger';
import { getInstanceId, getManagementEndpoint, getManagementToken } from './utils/management';
import config from '../configs/locations.json';
import { waitForZenkoToStabilize } from './utils/zenko-status';
import { createResourcesForLocations, resolveEnvValues, sanitizeLocationForAPI, StorageLocation } from './utils/resource-creation';
import * as k8s from './utils/k8s';
import { waitForResourceVersionChange } from './utils/k8s';
import { verifyS3CReadiness } from './metadata';

export interface LocationsOptions {
    namespace: string;
    subdomain: string;
    zenkoName: string;
    configFile?: string;
}

function replaceSubdomainPlaceholders(obj: any, subdomain: string): any {
    const jsonString = JSON.stringify(obj);
    const replacedString = jsonString.replace(/{subdomain}/g, subdomain);
    return JSON.parse(replacedString);
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

    // Ensure S3C is ready before creating buckets on it
    await verifyS3CReadiness();

    await createResourcesForLocations(locations);

    const instanceId = await getInstanceId();
    if (!instanceId) {
        throw new Error('Instance ID is required for location setup');
    }

    const managementEndpoint = await getManagementEndpoint();
    const token = await getManagementToken();

    // Capture cloudserver state BEFORE creating locations
    const cloudserverDeployment = `${options.zenkoName}-connector-cloudserver`;
    const initialCloudserverGeneration = await k8s.getDeploymentGeneration(options.namespace, cloudserverDeployment);
    const labelSelector = `app.kubernetes.io/name=connector-cloudserver-config,app.kubernetes.io/instance=${options.zenkoName}`;
    const secrets = await KubernetesHelper.getSecretsByLabels(options.namespace, labelSelector);
    const initialSecretVersion = secrets[0]?.metadata?.resourceVersion;

    // Track locations that need ingestion bootstrap
    const locationsToBootstrap: Array<{ locationName: string; sourceBucket: string }> = [];

    // Create all locations via Management API (batched)
    for (const location of locations) {
        if (location.createResources?.skipLocationCreation) {
            continue;
        }

        const sanitizedLocation = sanitizeLocationForAPI(location);
        await createStorageLocation(managementEndpoint, token, instanceId, sanitizedLocation);

        if (location.bootstrapIngestion && location.createResources?.createBucket) {
            const locationName = resolveEnvValues(location.name);
            const sourceBucket = resolveEnvValues(location.details.bucketName);
            locationsToBootstrap.push({ locationName, sourceBucket });
        }
    }

    logger.info(`Created ${locations.length} storage locations`);

    // Wait for Zenko operator to reconcile all location changes
    logger.info('Waiting for Zenko operator to reconcile locations...');
    await waitForZenkoToStabilize({
        namespace: options.namespace,
        zenkoName: options.zenkoName,
        timeout: 10 * 60 * 1000,
    });

    // Wait for cloudserver config secret to be updated by operator
    await waitForResourceVersionChange(
        options.namespace,
        'secret',
        labelSelector,
        initialSecretVersion,
        5 * 60 * 1000
    );

    // Wait for cloudserver to restart and load new configuration
    await k8s.waitForDeploymentRestart(
        options.namespace,
        cloudserverDeployment,
        initialCloudserverGeneration,
        5 * 60 * 1000
    );

    // Ensure all data services are stable
    await k8s.waitForDataServicesToStabilize(options.namespace, 5 * 60 * 1000);

    // Bootstrap ingestion consumer groups
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

    // Get credentials from account secret
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
        // Create ingestion bucket - this triggers consumer group creation
        // Retry logic: CloudServer may not have loaded the new location config yet
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
                
                // Check if it's the "location not in config" error - this is temporary
                if (errorMsg.includes('not listed in the locationConstraint config')) {
                    if (attempt < maxAttempts) {
                        logger.info(`CloudServer hasn't loaded location ${locationName} yet, attempt ${attempt}/${maxAttempts}, retrying in ${retryDelay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        continue;
                    }
                }
                
                // For other errors or final attempt, throw
                throw error;
            }
        }

        // Wait for ingestion producer to scan and find the new bucket
        // The producer periodically lists all buckets and updates its internal state
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Resume ingestion for this location (tells producer to start processing)
        const backbeatApiEndpoint = `http://${zenkoName}-management-backbeat-api.${namespace}.svc.cluster.local:80`;
        try {
            await axios.post(`${backbeatApiEndpoint}/_/backbeat/api/ingestion/resume/${locationName}`);
            logger.info(`Resumed ingestion for location: ${locationName}`);
        } catch (err: any) {
            logger.warn(`Failed to resume ingestion (may still work): ${err.message}`);
        }

        // Wait for consumer group to become stable
        await k8s.waitForIngestionConsumerGroup(namespace, instanceId, zenkoName, 5 * 60 * 1000);

        logger.info(`Ingestion consumer group is stable for location: ${locationName}`);

        // Cleanup bootstrap bucket
        await s3Client.send(new DeleteBucketCommand({ Bucket: destinationBucket }));

    } catch (error) {
        logger.error(`Failed to bootstrap ingestion for ${locationName}`, {
            error: error instanceof Error ? error.message : String(error),
        });

        // Attempt cleanup
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

    // For AWS S3 locations with bucketMatch: false, enable forcePathStyle
    if ((location.locationType === 'location-aws-s3-v1' ||
        location.locationType === 'location-scality-ring-s3-v1') &&
        locationDetails.bucketMatch === false) {
        locationPayload.details.forcePathStyle = true;
    }

    locationPayload.details = resolveEnvValues(locationPayload.details);

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
        // If location already exists (409 Conflict), skip creation
        if (error.response?.status === 409) {
            logger.debug(`Storage location ${location.name} already exists, skipping creation`);
            return;
        }
        // 404 means instance not found - setup order issue
        if (error.response?.status === 404) {
            logger.error(`Instance not found when creating location ${location.name}`, {
                status: 404,
                data: error.response?.data
            });
        }
        logger.error(`Failed to create location ${location.name}`, {
            status: error.response?.status,
            message: error.message,
        });
        // 400/422 are validation errors - let them propagate
        throw error;
    }
}
