import axios from 'axios';
import { logger } from './utils/logger';
import { getInstanceId, getManagementEndpoint, getManagementToken } from './utils/management';
import config from '../configs/locations.json';
import { waitForZenkoToStabilize } from './utils/zenko-status';

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

export async function setupLocations(options: LocationsOptions): Promise<void> {
    logger.info('setting up storage locations via Management API');

    // Get Management API endpoint and OIDC token
    const managementEndpoint = await getManagementEndpoint();
    const token = await getManagementToken();
    
    // Get instance ID
    const instanceId = await getInstanceId();
    if (!instanceId) {
        throw new Error('instance ID is required for location creation. Ensure UUID environment variable is set or Zenko CR exists');
    }

    // Process locations and replace namespace placeholders
    const locations: StorageLocation[] = config.locations.map(location => ({
        ...location,
        details: {
            ...location.details,
            endpoint: location.details.endpoint?.replace('{namespace}', options.namespace)
        }
    }));

    logger.info('locations to create', { locations });

    // Create locations via Management API
    for (const location of locations) {
        await createStorageLocation(managementEndpoint, token, instanceId, location);
    }

    logger.info(`created ${locations.length} storage locations`);

    // Wait for Zenko to stabilize
    await waitForZenkoToStabilize({
        namespace: options.namespace || 'default',
        instanceId: options.instanceId || 'end2end',
        timeout: 10 * 60 * 1000,
    });
}

async function createStorageLocation(endpoint: string, token: string, instanceId: string, location: StorageLocation): Promise<void> {
    const locationDetails = {
        ...location.details,
        bootstrapList: location.details.bootstrapList || []
    };

    const locationPayload = {
        location: {
            name: location.name,
            locationType: location.locationType,
            details: locationDetails,
        }
    };

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
        logger.info(`created storage location: ${location.name}`);
    } else {
        logger.warn(`unexpected response creating location ${location.name}: ${response.status}`);
    }
}