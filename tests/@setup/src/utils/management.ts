import axios from 'axios';
import { logger } from './logger';

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

    try {
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

        logger.debug('Request parameters:', {
            clientId,
            username,
            grant: 'password',
            scope: 'openid',
            password,
        });

        const response = await axios.post(tokenUrl, new URLSearchParams(requestData), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 10000
        });

        logger.debug('Keycloak authentication completed successfully');
        logger.debug('Response status:', { status: response.status });
        logger.debug('Response data keys:', Object.keys(response.data || {}));

        if (!response.data.id_token) {
            logger.error('No id_token in response:', { data: response.data });
            throw new Error('No id_token received from Keycloak');
        }

        logger.info('Successfully obtained OIDC token from Keycloak', {
            tokenLength: response.data.id_token.length,
        });

        return response.data.id_token;
    } catch (error) {
        // Enhanced error logging for axios errors
        const errorDetails: any = {
            message: error instanceof Error ? error.message : String(error),
            name: error instanceof Error ? error.name : 'Unknown',
        };

        // Handle axios specific errors
        if (error && typeof error === 'object') {
            const err = error as any;
            if (err.code) {
                errorDetails.code = err.code;
            }

            // Axios response errors
            if (err.response) {
                errorDetails.httpStatus = err.response.status;
                errorDetails.httpStatusText = err.response.statusText;
                errorDetails.requestUrl = err.response.config?.url;
                errorDetails.responseData = err.response.data;
                logger.error('HTTP Response Error:', {
                    status: err.response.status,
                    statusText: err.response.statusText,
                    url: err.response.config?.url,
                    data: err.response.data
                });
            }

            // Axios request errors (no response received)
            if (err.request && !err.response) {
                errorDetails.requestUrl = err.request.path || err.request.url;
                errorDetails.requestMethod = err.request.method;
                logger.error('Network/Request Error:', {
                    url: err.request.path || err.request.url,
                    method: err.request.method,
                    message: err.message
                });
            }
        }

        logger.error('Failed to authenticate with Keycloak:', errorDetails);

        let errorMessage = 'OIDC authentication failed';
        if (errorDetails.code === 'ENOTFOUND') {
            errorMessage += ': Cannot resolve hostname. Check DNS configuration.';
        } else if (errorDetails.code === 'ECONNREFUSED') {
            errorMessage += ': Connection refused. Service may not be running.';
        } else if (errorDetails.httpStatus === 404) {
            errorMessage += ': Token endpoint not found (${errorDetails.requestUrl}). Check realm/path configuration.';
        } else if (errorDetails.httpStatus) {
            errorMessage += `: HTTP ${errorDetails.httpStatus} ${errorDetails.httpStatusText || ''}`;
        } else if (errorDetails.message) {
            errorMessage += ': ${errorDetails.message}';
        }

        throw new Error(errorMessage);
    }
}
