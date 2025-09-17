import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';
import { getManagementEndpoint, getManagementToken } from './utils/management';

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

    // Get Management API endpoint and OIDC token
    const managementEndpoint = await getManagementEndpoint(options.namespace);
    const token = await getManagementToken();
    
    // Get instance ID
    const instanceId = await getInstanceId(k8s, options.namespace);
    if (!instanceId) {
        throw new Error('Instance ID is required for location creation. Ensure UUID environment variable is set or Zenko CR exists');
    }

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
        await createStorageLocation(managementEndpoint, token, instanceId, location);
    }

    logger.info(`Created ${locations.length} storage locations`);
}

async function getInstanceId(k8s: KubernetesClient, namespace: string): Promise<string | null> {
    try {
        // Try to get instance ID from Zenko CR or environment
        const uuid = process.env.UUID;
        if (uuid) {
            return uuid;
        }

        // Fallback: Try to get instance ID from Zenko CR
        const customObjects = k8s.customObjectsApi;
        const zenkoList = await customObjects.listNamespacedCustomObject({
            group: 'zenko.io',
            version: 'v1alpha1',
            namespace: namespace,
            plural: 'zenkos',
        });

        const zenkos = zenkoList.body as any;
        if (zenkos.items && zenkos.items.length > 0) {
            return zenkos.items[0].spec?.instanceId || zenkos.items[0].metadata?.name;
        }

        return null;
    } catch (error) {
        logger.debug(`Failed to retrieve instance ID: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

async function createStorageLocation(endpoint: string, token: string, instanceId: string, location: StorageLocation): Promise<void> {
    try {
        // Add bootstrapList if not present (required by API)
        const locationDetails = {
            ...location.details,
            bootstrapList: location.details.bootstrapList || []
        };

        const locationPayload = {
            name: location.name,
            locationType: location.locationType,
            details: locationDetails
        };

        const response = await axios.post(
            `${endpoint}/api/v1/config/${instanceId}/location`,
            locationPayload,
            {
                headers: {
                    'X-Authentication-Token': token,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        if (response.status === 200 || response.status === 201) {
            logger.info(`Created storage location: ${location.name}`);
        } else {
            logger.warn(`Unexpected response creating location ${location.name}: ${response.status}`);
        }

    } catch (error: any) {
        if (error.response?.status === 409) {
            logger.debug(`Storage location ${location.name} already exists`);
            return; // Don't throw, just skip
        } else if (error.response?.status === 501) {
            logger.warn(`Location type ${location.locationType} not supported for location ${location.name}, skipping`);
            return; // Don't throw, just skip
        } else if (error.code === 'ECONNREFUSED') {
            logger.warn(`Management API not available at ${endpoint}, skipping location ${location.name}`);
            return; // Don't throw, just skip
        } else if (error.response?.status === 404) {
            logger.warn(`Management API endpoint not found at ${endpoint}, skipping location ${location.name}`);
            return; // Don't throw, just skip
        } else {
            logger.error(`Failed to create storage location ${location.name}: ${error.message}`, { 
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: `${endpoint}/api/v1/config/${instanceId}/location`
            });
            return; // Don't throw, just skip and log the details
        }
    }
}