import axios from 'axios';
import { logger } from './logger';
import { IngestionWorkflow, LifecycleWorkflow, ReplicationWorkflow } from './types';

// Disable SSL verification for all requests
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export interface ManagementCredentials {
    managementEndpoint: string;
    authToken: string;
}

export async function getManagementEndpoint(subdomain: string = 'zenko.local'): Promise<string> {
    return `http://management.${subdomain}`;
}

export async function getManagementToken(subdomain: string = 'zenko.local'): Promise<string> {
    const token = process.env.TOKEN;
    if (token) {
        logger.debug('Using provided TOKEN environment variable');
        return token;
    }

    const clientId = process.env.OIDC_CLIENT_ID || 'zenko-ui';
    const username = process.env.OIDC_USERNAME || 'storage_manager';
    const password = process.env.OIDC_PASSWORD || '123';
    const realm = process.env.OIDC_REALM || 'zenko';

    if (!clientId || !username || !password || !realm) {
        throw new Error('Missing OIDC credentials.');
    }

    const baseUrl = process.env.OIDC_ENDPOINT || `https://keycloak.${subdomain}`;

    logger.info('Keycloak authentication configuration:', {
        baseUrl,
        realm,
        clientId,
        username,
    });

    // Direct HTTP request matching working shell script
    const tokenUrl = `${baseUrl}/auth/realms/${realm}/protocol/openid-connect/token`;
    logger.debug('Making direct OIDC token request to:', { tokenUrl });

    const requestData = {
        // eslint-disable-next-line camelcase
        client_id: clientId,
        username,
        password,
        // eslint-disable-next-line camelcase
        grant_type: 'password',
        scope: 'openid'
    };

    const response = await axios.post(tokenUrl, new URLSearchParams(requestData), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
    });

    if (!response.data.id_token) {
        logger.error('No id_token in response:', { data: response.data });
        throw new Error('No id_token received from Keycloak');
    }

    logger.info('Successfully obtained OIDC token from Keycloak', {
        tokenLength: response.data.id_token.length,
    });

    return response.data.id_token;
}

export async function getInstanceId(): Promise<string | null> {
    return process.env.INSTANCE_ID || 'end2end';
}

export async function createReplicationWorkflow(
    managementEndpoint: string,
    authToken: string,
    instanceId: string,
    workflow: ReplicationWorkflow,
): Promise<void> {
    const workflowPayload = {
        workflowId: workflow.name,
        type: 'replication',
        enabled: workflow.enabled,
        source: {
            bucket: workflow.sourceBucket,
            location: workflow.sourceLocation,
        },
        destination: {
            bucket: workflow.targetBucket,
            location: workflow.targetLocation,
        },
    };

    const response = await axios.post(
        `${managementEndpoint}/api/v1/config/${instanceId}/workflow`,
        workflowPayload,
        {
            headers: {
                'X-Authentication-Token': authToken,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        }
    );

    if (response.status !== 201 && response.status !== 200) {
        throw new Error(`Management API returned status ${response.status}: ${JSON.stringify(response.data)}`);
    }
}

export async function createLifecycleWorkflow(
    managementEndpoint: string,
    authToken: string,
    instanceId: string,
    workflow: LifecycleWorkflow,
): Promise<void> {
    const workflowPayload = {
        workflowId: workflow.name,
        type: 'lifecycle',
        bucketName: workflow.bucketName,
        rules: workflow.rules,
    };

    const response = await axios.post(
        `${managementEndpoint}/api/v1/config/${instanceId}/lifecycle`,
        workflowPayload,
        {
            headers: {
                'X-Authentication-Token': authToken,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        }
    );

    if (response.status !== 201 && response.status !== 200) {
        throw new Error(`Management API returned status ${response.status}: ${JSON.stringify(response.data)}`);
    }
}

export async function createIngestionWorkflow(
    managementEndpoint: string,
    authToken: string,
    instanceId: string,
    workflow: IngestionWorkflow,
): Promise<void> {
    const workflowPayload = {
        workflowId: workflow.name,
        type: 'ingestion',
        enabled: workflow.enabled,
        schedule: workflow.schedule,
        source: {
            bucket: workflow.sourceBucket,
            location: workflow.sourceLocation,
        },
        destination: {
            bucket: workflow.targetBucket,
            location: workflow.targetLocation,
        },
    };

    const response = await axios.post(
        `${managementEndpoint}/api/v1/config/${instanceId}/workflow`,
        workflowPayload,
        {
            headers: {
                'X-Authentication-Token': authToken,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        }
    );

    if (response.status !== 201 && response.status !== 200) {
        throw new Error(`Management API returned status ${response.status}: ${JSON.stringify(response.data)}`);
    }
}
