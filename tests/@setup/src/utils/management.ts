import axios from 'axios';
import { logger } from './logger';
import { IngestionWorkflow, LifecycleWorkflow, ReplicationWorkflow } from './types';
import jwt from 'jsonwebtoken';
import KubernetesHelper from 'cli-testing/utils/KubernetesHelper';

// Disable SSL verification for all requests
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export interface ManagementCredentials {
    managementEndpoint: string;
    authToken: string;
}

export interface STSAssumeRoleRequest {
    RoleArn: string;
    RoleSessionName: string;
    WebIdentityToken: string;
    DurationSeconds?: number;
}

export interface STSCredentials {
    AccessKeyId: string;
    SecretAccessKey: string;
    SessionToken: string;
}

export interface STSAssumeRoleResponse {
    Credentials: STSCredentials;
}

export interface AccountPayload {
    userName: string;
    email: string;
    quota?: number | null;
}

export interface AccountResponse {
    id: string;
    userName: string;
    email: string;
    arn: string;
    createDate: string;
    quotaMax: number | null;
}

/**
 * Get Management API endpoint using internal Kubernetes service name
 * @param zenkoName - Name of the Zenko instance
 * @param namespace - Kubernetes namespace
 * @returns Management endpoint URL
 */
export async function getManagementEndpoint(
    zenkoName: string = 'end2end',
    namespace: string = 'default'
): Promise<string> {
    return `http://${zenkoName}-management-orbit-api.${namespace}.svc.cluster.local:5001`;
}

/**
 * Get management token
 * @param subdomain - Subdomain
 * @returns Management token
 */
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
        grant_type: 'password'
    };

    const response = await axios.post(tokenUrl, new URLSearchParams(requestData), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
    });

    if (!response.data.access_token) {
        logger.error('No access_token in response:', { data: response.data });
        throw new Error('No access_token received from Keycloak');
    }

    logger.info('Successfully obtained OIDC token from Keycloak', {
        token: response.data.access_token,
        decoded: jwt.decode(response.data.access_token),
    });

    return response.data.access_token;
}

/**
 * Get instance ID from the Zenko CR
 * @returns Instance ID
 */
export async function getInstanceId(zenkoName: string = 'end2end', namespace: string = 'default'): Promise<string | null> {
    if (!KubernetesHelper.customObject) {
        throw new Error('KubernetesHelper not initialized');
    }
    
    const instanceId = await KubernetesHelper.customObject.getNamespacedCustomObject({
        group: 'zenko.io',
        version: 'v1alpha2',
        namespace,
        plural: 'zenkos',
        name: zenkoName,
    });

    return instanceId.status?.instanceID || process.env.INSTANCE_ID;
}

/**
 * Create replication workflow
 * @param managementEndpoint - Management endpoint
 * @param authToken - Auth token
 * @param instanceId - Instance ID
 * @param workflow - Workflow
 */
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

    try {
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
    } catch (error: any) {
        // If workflow already exists (409 Conflict), skip creation
        if (error.response?.status === 409) {
            logger.debug(`Replication workflow ${workflow.name} already exists, skipping creation`);
            return;
        }
        // 404 means parent resource (instance/bucket) not found - might be a setup order issue
        if (error.response?.status === 404) {
            logger.error(`Parent resource not found for replication workflow ${workflow.name}`, {
                status: 404,
                data: error.response?.data
            });
        }
        // 400/422 are validation errors - let them propagate
        throw error;
    }
}

/**
 * Create lifecycle workflow
 * @param managementEndpoint - Management endpoint
 * @param authToken - Auth token
 * @param instanceId - Instance ID
 * @param workflow - Workflow
 */
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

    try {
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
    } catch (error: any) {
        // If lifecycle workflow already exists (409 Conflict), skip creation
        if (error.response?.status === 409) {
            logger.debug(`Lifecycle workflow ${workflow.name} already exists, skipping creation`);
            return;
        }
        // 404 means parent resource (instance/bucket) not found - might be a setup order issue
        if (error.response?.status === 404) {
            logger.error(`Parent resource not found for lifecycle workflow ${workflow.name}`, {
                status: 404,
                data: error.response?.data
            });
        }
        // 400/422 are validation errors - let them propagate
        throw error;
    }
}

/**
 * Create ingestion workflow
 * @param managementEndpoint - Management endpoint
 * @param authToken - Auth token
 * @param instanceId - Instance ID
 * @param workflow - Workflow
 */
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

    try {
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
    } catch (error: any) {
        // If ingestion workflow already exists (409 Conflict), skip creation
        if (error.response?.status === 409) {
            logger.debug(`Ingestion workflow ${workflow.name} already exists, skipping creation`);
            return;
        }
        // 404 means parent resource (instance/bucket) not found - might be a setup order issue
        if (error.response?.status === 404) {
            logger.error(`Parent resource not found for ingestion workflow ${workflow.name}`, {
                status: 404,
                data: error.response?.data
            });
        }
        // 400/422 are validation errors - let them propagate
        throw error;
    }
}

/**
 * Create account
 * @param managementEndpoint - Management endpoint
 * @param authToken - Auth token
 * @param instanceId - Instance ID
 * @param accountData - Account data
 * @returns Account response
 */
export async function createAccount(
    managementEndpoint: string,
    authToken: string,
    instanceId: string,
    accountData: AccountPayload,
): Promise<AccountResponse> {
    logger.debug('Creating account via management API', {
        userName: accountData.userName,
        email: accountData.email,
        endpoint: managementEndpoint
    });

    try {
        const response = await axios.post(
            `${managementEndpoint}/api/v1/config/${instanceId}/user`,
            accountData,
            {
                headers: {
                    'X-Authentication-Token': authToken,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }
        );

        if (response.status !== 201 && response.status !== 200) {
            throw new Error(`Account creation failed. Returned ${response.status}: ${JSON.stringify(response.data)}`);
        }

        logger.debug('Account created successfully', {
            accountId: response.data.id,
            userName: response.data.userName
        });

        return response.data;
    } catch (error: any) {
        // If account already exists (409 Conflict), log and skip creation
        if (error.response?.status === 409) {
            logger.debug('Account already exists, skipping creation', {
                userName: accountData.userName
            });
            // Return a dummy response since we can't fetch the existing account details
            // Note: The Management API doesn't provide a GET endpoint for users by name
            return {
                id: 'existing',
                userName: accountData.userName,
                email: accountData.email,
                arn: '',
                createDate: new Date().toISOString(),
                quotaMax: accountData.quota || null
            };
        }
        // 404 means instance not found - setup order issue
        if (error.response?.status === 404) {
            logger.error('Instance not found when creating account', {
                userName: accountData.userName,
                status: 404,
                data: error.response?.data
            });
        }
        // 400/422 are validation errors - let them propagate
        throw error;
    }
}

/**
 * Generate account access key
 * @param managementEndpoint - Management endpoint
 * @param authToken - Auth token
 * @param instanceId - Instance ID
 * @param accountName - Account name
 * @returns Account access key
 */
export async function generateAccountAccessKey(
    managementEndpoint: string,
    authToken: string,
    instanceId: string,
    accountName: string,
): Promise<{ AccessKeyId: string; SecretAccessKey: string }> {
    logger.debug('Generating access key for account', { accountName });

    try {
        const response = await axios.post(
            `${managementEndpoint}/api/v1/config/${instanceId}/user/${accountName}/key`,
            {},
            {
                headers: {
                    'X-Authentication-Token': authToken,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }
        );

        if (response.status !== 201 && response.status !== 200) {
            throw new Error(
                `Access key generation failed. Returned ${response.status}: ${JSON.stringify(response.data)}`);
        }

        logger.debug('Access key generated successfully', {
            accountName,
            accessKeyId: response.data.AccessKeyId
        });

        return response.data;
    } catch (error: any) {
        // 404 means account or instance not found
        if (error.response?.status === 404) {
            logger.error('Account or instance not found when generating access key', {
                accountName,
                status: 404,
                data: error.response?.data
            });
        }
        // 400 is validation error, 501 is not implemented - let them propagate
        throw error;
    }
}

/**
 * Assume role with web identity
 * @param subdomain - Subdomain
 * @param request - Request
 * @returns STS credentials
 */
export async function assumeRoleWithWebIdentity(
    subdomain: string = 'zenko.local',
    request: STSAssumeRoleRequest,
): Promise<STSCredentials> {
    const stsEndpoint = process.env.VAULT_STS_ENDPOINT || `http://sts.${subdomain}`;

    logger.debug('Assuming role with web identity', {
        endpoint: stsEndpoint,
        roleArn: request.RoleArn,
        sessionName: request.RoleSessionName,
        durationSeconds: request.DurationSeconds
    });

    const params = new URLSearchParams({
        Action: 'AssumeRoleWithWebIdentity',
        Version: '2011-06-15',
        RoleArn: request.RoleArn,
        RoleSessionName: request.RoleSessionName,
        WebIdentityToken: request.WebIdentityToken,
        DurationSeconds: (request.DurationSeconds || 43200).toString(), // 12 hours default
    });

    const response = await axios.post(
        stsEndpoint,
        params.toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 30000,
        }
    );

    if (response.status !== 200) {
        throw new Error(
            `STS AssumeRoleWithWebIdentity failed. Returned ${response.status}: ${JSON.stringify(response.data)}`);
    }

    // Parse XML response (STS returns XML)
    let credentials: STSCredentials;
    try {
        // Simple XML parsing for the STS response structure
        const responseData = response.data;
        const accessKeyMatch = responseData.match(/<AccessKeyId>([^<]+)<\/AccessKeyId>/);
        const secretKeyMatch = responseData.match(/<SecretAccessKey>([^<]+)<\/SecretAccessKey>/);
        const sessionTokenMatch = responseData.match(/<SessionToken>([^<]+)<\/SessionToken>/);

        if (!accessKeyMatch || !secretKeyMatch || !sessionTokenMatch) {
            throw new Error('Invalid STS response: missing credentials');
        }

        credentials = {
            AccessKeyId: accessKeyMatch[1],
            SecretAccessKey: secretKeyMatch[1],
            SessionToken: sessionTokenMatch[1],
        };
    } catch (error) {
        logger.error('Failed to parse STS response', { error, responseData: response.data });
        throw new Error(`Failed to parse STS response: ${error}`);
    }

    logger.debug('STS credentials obtained successfully', {
        roleArn: request.RoleArn,
        accessKeyId: `${credentials.AccessKeyId.substring(0, 8)}...`,
    });

    return credentials;
}
