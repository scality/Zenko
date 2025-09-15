import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export interface EndpointConfig {
    hostname: string;
    locationName: string;
    description?: string;
}

export interface EndpointsConfig {
    endpoints: EndpointConfig[];
}

export interface EndpointsOptions {
    namespace: string;
    instanceId?: string;
    configFile?: string;
}

function loadEndpointsConfig(configFile?: string): EndpointsConfig {
    const defaultConfigPath = path.join(__dirname, '..', 'configs', 'endpoints.json');
    const configPath = configFile ? path.resolve(configFile) : defaultConfigPath;
    
    if (!fs.existsSync(configPath)) {
        throw new Error(`Endpoints configuration file not found: ${configPath}`);
    }
    
    try {
        const configData = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(configData) as EndpointsConfig;
    } catch (error) {
        throw new Error(`Failed to parse endpoints configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function setupEndpoints(options: EndpointsOptions): Promise<void> {
    const k8s = new KubernetesClient();
    const config = loadEndpointsConfig(options.configFile);
    
    logger.info('Setting up S3 endpoints via Management API');

    // Get management API endpoint and credentials
    const { managementEndpoint, authToken } = await getManagementCredentials(k8s, options);
    
    // Get instance ID from Zenko CR if not provided
    const instanceId = options.instanceId || await getInstanceId(k8s, options);
    
    if (!instanceId) {
        throw new Error('Instance ID is required for endpoint creation. Either provide --instance-id or ensure Zenko CR exists');
    }

    for (const endpoint of config.endpoints) {
        try {
            await createEndpoint(managementEndpoint, authToken, instanceId, endpoint, options);
            logger.info(`Created endpoint: ${endpoint.hostname} -> ${endpoint.locationName}`);
        } catch (error) {
            logger.error(`Failed to create endpoint ${endpoint.hostname}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    logger.info(`Successfully created ${config.endpoints.length} S3 endpoints`);
}

async function getManagementCredentials(k8s: KubernetesClient, options: EndpointsOptions): Promise<{ managementEndpoint: string; authToken: string }> {
    // Get management API endpoint from service
    const managementService = await k8s.coreApi.readNamespacedService({
        name: 'zenko-management',
        namespace: options.namespace,
    });
    
    const managementPort = managementService.spec?.ports?.find(p => p.name === 'http')?.port || 8080;
    const managementEndpoint = `http://zenko-management.${options.namespace}.svc.cluster.local:${managementPort}`;
    
    // Get admin credentials for authentication
    const adminSecret = await k8s.coreApi.readNamespacedSecret({
        name: 'zenko-admin',
        namespace: options.namespace,
    });
    
    if (!adminSecret.data) {
        throw new Error('Failed to retrieve admin credentials from zenko-admin secret');
    }
    
    const accessKey = Buffer.from(adminSecret.data['access-key'], 'base64').toString();
    const secretKey = Buffer.from(adminSecret.data['secret-key'], 'base64').toString();
    
    // Create admin auth token (basic auth for management API)
    const authToken = Buffer.from(`${accessKey}:${secretKey}`).toString('base64');
    
    return { managementEndpoint, authToken };
}

async function getInstanceId(k8s: KubernetesClient, options: EndpointsOptions): Promise<string | null> {
    try {
        // Try to get instance ID from Zenko CR
        const customObjects = k8s.customObjectsApi;
        const zenkoList = await customObjects.listNamespacedCustomObject({
            group: 'zenko.io',
            version: 'v1alpha1',
            namespace: options.namespace,
            plural: 'zenkos',
        });
        
        const zenkos = zenkoList.body as any;
        if (zenkos.items && zenkos.items.length > 0) {
            return zenkos.items[0].spec?.instanceId || zenkos.items[0].metadata?.name;
        }
        
        return null;
    } catch (error) {
        logger.debug(`Failed to retrieve instance ID from Zenko CR: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

async function createEndpoint(
    managementEndpoint: string,
    authToken: string,
    instanceId: string,
    endpoint: EndpointConfig,
    options: EndpointsOptions
): Promise<void> {

    const endpointPayload = {
        hostname: endpoint.hostname,
        locationName: endpoint.locationName,
    };

    const response = await axios.post(
        `${managementEndpoint}/api/v1/config/${instanceId}/endpoint`,
        endpointPayload,
        {
            headers: {
                'Authorization': `Basic ${authToken}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        }
    );

    if (response.status !== 201 && response.status !== 200) {
        throw new Error(`Management API returned status ${response.status}: ${JSON.stringify(response.data)}`);
    }

    logger.debug(`Created S3 endpoint ${endpoint.hostname} pointing to location ${endpoint.locationName}`);
}