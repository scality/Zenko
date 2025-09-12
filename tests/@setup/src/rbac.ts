import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';

export interface RBACOptions {
    namespace: string;
    dryRun?: boolean;
}

export async function setupRBAC(options: RBACOptions): Promise<void> {
    const k8s = new KubernetesClient();
    await k8s.ensureNamespace(options.namespace);

    logger.info('Setting up RBAC permissions for service accounts');

    // Create cluster role for test service accounts
    const clusterRole = {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'ClusterRole',
        metadata: {
            name: 'zenko-test-admin'
        },
        rules: [
            {
                apiGroups: ['*'],
                resources: ['*'],
                verbs: ['*']
            }
        ]
    };

    // Get all service accounts in the namespace
    const serviceAccounts = await k8s.coreApi.listNamespacedServiceAccount(options.namespace);
    const zenkoServiceAccounts = serviceAccounts.body.items.filter(sa =>
        sa.metadata?.name?.includes('zenko') ||
        sa.metadata?.name?.includes('cloudserver') ||
        sa.metadata?.name?.includes('backbeat') ||
        sa.metadata?.name?.includes('operator')
    );

    // Apply cluster role
    try {
        await k8s.rbacApi.createClusterRole(clusterRole);
    } catch (error: any) {
        if (error.response?.statusCode === 409) {
            logger.debug('ClusterRole zenko-test-admin already exists');
            await k8s.rbacApi.replaceClusterRole('zenko-test-admin', clusterRole);
        } else {
            throw error;
        }
    }

    // Create cluster role bindings for each service account
    for (const sa of zenkoServiceAccounts) {
        const saName = sa.metadata?.name;
        if (!saName) continue;

        const clusterRoleBinding = {
            apiVersion: 'rbac.authorization.k8s.io/v1',
            kind: 'ClusterRoleBinding',
            metadata: {
                name: `zenko-test-admin-${saName}`
            },
            subjects: [{
                kind: 'ServiceAccount',
                name: saName,
                namespace: options.namespace
            }],
            roleRef: {
                kind: 'ClusterRole',
                name: 'zenko-test-admin',
                apiGroup: 'rbac.authorization.k8s.io'
            }
        };

        try {
            await k8s.rbacApi.createClusterRoleBinding(clusterRoleBinding);
            logger.debug(`Created ClusterRoleBinding for ${saName}`);
        } catch (error: any) {
            if (error.response?.statusCode === 409) {
                logger.debug(`ClusterRoleBinding for ${saName} already exists`);
                await k8s.rbacApi.replaceClusterRoleBinding(`zenko-test-admin-${saName}`, clusterRoleBinding);
            } else {
                throw error;
            }
        }
    }

    // Create role binding for default service account in namespace
    const defaultRoleBinding = {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'ClusterRoleBinding',
        metadata: {
            name: `zenko-test-admin-default-${options.namespace}`
        },
        subjects: [{
            kind: 'ServiceAccount',
            name: 'default',
            namespace: options.namespace
        }],
        roleRef: {
            kind: 'ClusterRole',
            name: 'zenko-test-admin',
            apiGroup: 'rbac.authorization.k8s.io'
        }
    };

    try {
        await k8s.rbacApi.createClusterRoleBinding(defaultRoleBinding);
    } catch (error: any) {
        if (error.response?.statusCode === 409) {
            logger.debug(`Default ClusterRoleBinding already exists`);
            await k8s.rbacApi.replaceClusterRoleBinding(`zenko-test-admin-default-${options.namespace}`, defaultRoleBinding);
        } else {
            throw error;
        }
    }

    logger.info(`RBAC setup completed for ${zenkoServiceAccounts.length + 1} service accounts`);
}