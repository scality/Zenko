import { logger } from './logger';

export interface ManagementCredentials {
    managementEndpoint: string;
    authToken: string;
}

export async function getManagementCredentials(namespace: string): Promise<ManagementCredentials> {
    // Get OIDC token from environment (set by get_token script)
    const token = process.env.TOKEN;
    if (!token) {
        throw new Error('TOKEN environment variable is required for OIDC authentication');
    }

    // Use the standard Zenko naming pattern: {ZENKO_NAME}-management-orbit-api:5001
    const zenkoName = process.env.ZENKO_NAME || 'end2end';
    const managementEndpoint = `http://${zenkoName}-management-orbit-api.${namespace}.svc.cluster.local:5001`;

    logger.info(`Management API endpoint: ${managementEndpoint}`);
    logger.debug('Using OIDC token for authentication');

    return { managementEndpoint, authToken: token };
}
