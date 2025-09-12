import axios from 'axios';
import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';

export interface LocationsOptions {
    namespace: string;
    instanceId?: string;
    dryRun?: boolean;
}

interface StorageLocation {
    name: string;
    locationType: string;
    details: any;
}

export async function setupLocations(options: LocationsOptions): Promise<void> {
    const k8s = new KubernetesClient();

    logger.info('Setting up storage locations via Management API');

    // Get Management API endpoint and credentials
    const managementEndpoint = await getManagementEndpoint(k8s, options.namespace);
    const credentials = await getManagementCredentials(k8s, options.namespace);

    const locations: StorageLocation[] = [
        {
            name: 'aws-s3-mock',
            locationType: 'location-s3-v1',
            details: {
                endpoint: `http://cloudserver-mock.${options.namespace}.svc.cluster.local:8000`,
                bucketName: 'ci-zenko-aws-target-bucket',
                accessKey: 'accessKey1',
                secretKey: 'verySecretKey1',
                bucketMatch: false,
                pathStyle: true
            }
        },
        {
            name: 'azure-blob-mock',
            locationType: 'location-azure-v1',
            details: {
                endpoint: `http://azurite-mock.${options.namespace}.svc.cluster.local:10000/devstoreaccount1`,
                containerName: 'ci-zenko-azure-target-container',
                accountName: 'devstoreaccount1',
                accountKey: 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw=='
            }
        },
        {
            name: 'dmf-tape',
            locationType: 'location-dmf-v1',
            details: {
                endpoint: 'http://dmf-service:7778',
                repoId: ['repoId'],
                nsId: 'nsId',
                username: 'username',
                password: 'password'
            }
        },
        {
            name: 'ring-s3c',
            locationType: 'location-s3-v1',
            details: {
                endpoint: 'http://ring-s3c:8080',
                bucketName: 'ci-zenko-ring-target-bucket',
                accessKey: 'ring-access-key',
                secretKey: 'ring-secret-key',
                bucketMatch: false,
                pathStyle: true
            }
        }
    ];

    for (const location of locations) {
        await createStorageLocation(managementEndpoint, credentials, location);
    }

    logger.info(`Created ${locations.length} storage locations`);
}

async function getManagementEndpoint(k8s: KubernetesClient, namespace: string): Promise<string> {
    try {
        // Try to find Management API service
        const services = await k8s.coreApi.listNamespacedService(namespace);
        const mgmtService = services.body.items.find(svc =>
            svc.metadata?.name?.includes('management') ||
            svc.metadata?.name?.includes('api') ||
            svc.metadata?.name?.includes('zenko-management')
        );

        if (mgmtService) {
            const serviceName = mgmtService.metadata!.name;
            const port = mgmtService.spec?.ports?.[0]?.port || 8443;
            return `http://${serviceName}.${namespace}.svc.cluster.local:${port}`;
        }

        // Fallback to common endpoint
        return `http://zenko-management.${namespace}.svc.cluster.local:8443`;
    } catch (error) {
        logger.warn('Could not determine Management API endpoint, using default');
        return `http://zenko-management.${namespace}.svc.cluster.local:8443`;
    }
}

async function getManagementCredentials(k8s: KubernetesClient, namespace: string): Promise<{ accessKey: string; secretKey: string }> {
    try {
        // Look for admin credentials in secrets
        const secrets = await k8s.coreApi.listNamespacedSecret(namespace);
        const adminSecret = secrets.body.items.find(secret =>
            secret.metadata?.name?.includes('admin') ||
            secret.metadata?.name?.includes('management') ||
            secret.metadata?.name?.includes('credentials')
        );

        if (adminSecret?.data) {
            const accessKey = adminSecret.data['access-key'] || adminSecret.data['accessKey'] || adminSecret.data['AWS_ACCESS_KEY_ID'];
            const secretKey = adminSecret.data['secret-key'] || adminSecret.data['secretKey'] || adminSecret.data['AWS_SECRET_ACCESS_KEY'];

            if (accessKey && secretKey) {
                return {
                    accessKey: Buffer.from(accessKey, 'base64').toString(),
                    secretKey: Buffer.from(secretKey, 'base64').toString()
                };
            }
        }
    } catch (error) {
        logger.debug('Could not find admin credentials in secrets');
    }

    // Return default test credentials
    logger.warn('Using default test credentials for Management API');
    return {
        accessKey: 'accessKey1',
        secretKey: 'verySecretKey1'
    };
}

async function createStorageLocation(endpoint: string, credentials: { accessKey: string; secretKey: string }, location: StorageLocation): Promise<void> {
    try {
        const response = await axios.post(
            `${endpoint}/api/v1/config/${location.name}/location`,
            {
                locationType: location.locationType,
                locationDetails: location.details
            },
            {
                headers: {
                    'Authorization': `AWS ${credentials.accessKey}:${credentials.secretKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        if (response.status === 200 || response.status === 201) {
            logger.debug(`Created storage location: ${location.name}`);
        } else {
            logger.warn(`Unexpected response creating location ${location.name}: ${response.status}`);
        }

    } catch (error: any) {
        if (error.response?.status === 409) {
            logger.debug(`Storage location ${location.name} already exists`);
        } else if (error.code === 'ECONNREFUSED') {
            logger.warn(`Management API not available at ${endpoint}, skipping location ${location.name}`);
        } else {
            logger.error(`Failed to create storage location ${location.name}: ${error.message}`);
            // Don't throw - continue with other locations
        }
    }
}