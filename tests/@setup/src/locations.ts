import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';

export interface LocationsOptions {
    namespace: string;
    instanceId?: string;
    configFile?: string;
}

interface StorageLocation {
    name: string;
    locationType: string;
    details: any;
}

interface LocationsConfig {
    locations: StorageLocation[];
}

function loadLocationsConfig(configFile?: string): LocationsConfig {
    const defaultConfigPath = path.join(__dirname, '..', 'configs', 'locations.json');
    const configPath = configFile ? path.resolve(configFile) : defaultConfigPath;

    if (!fs.existsSync(configPath)) {
        throw new Error(`Locations configuration file not found: ${configPath}`);
    }

    try {
        const configData = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(configData) as LocationsConfig;
    } catch (error) {
        throw new Error(`Failed to parse locations configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function setupLocations(options: LocationsOptions): Promise<void> {
    const k8s = new KubernetesClient();

    logger.info('Setting up storage locations via Management API');

    // Load locations configuration
    const config = loadLocationsConfig(options.configFile);

    // Get Management API endpoint and credentials
    const managementEndpoint = await getManagementEndpoint(k8s, options.namespace);
    const credentials = await getManagementCredentials(k8s, options.namespace);

    // Process locations and replace namespace placeholders
    const locations: StorageLocation[] = config.locations.map(location => ({
        ...location,
        details: {
            ...location.details,
            endpoint: location.details.endpoint?.replace('{namespace}', options.namespace)
        }
    }));


    // Create locations via Management API

    for (const location of locations) {
        await createStorageLocation(managementEndpoint, credentials, location);
    }

    logger.info(`Created ${locations.length} storage locations`);
}

async function getManagementEndpoint(k8s: KubernetesClient, namespace: string): Promise<string> {
    try {
        // Try to find Management API service
        const services = await k8s.coreApi.listNamespacedService({ namespace });
        const mgmtService = services.items.find(svc =>
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
        const secrets = await k8s.coreApi.listNamespacedSecret({ namespace });
        const adminSecret = secrets.items.find(secret =>
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