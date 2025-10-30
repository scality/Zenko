import KubernetesHelper from 'cli-testing/utils/KubernetesHelper';
import * as k8s from './utils/k8s';
import { logger } from './utils/logger';

export interface RBACOptions {
    namespace: string;
}

/**
 * Setup RBAC
 * @param options - RBAC options
 * @returns Promise that resolves when the RBAC is setup
 */
export async function setupRBAC(options: RBACOptions): Promise<void> {
    k8s.initKubernetes();
    await KubernetesHelper.ensureNamespace(options.namespace);

    logger.info('Setting up comprehensive RBAC permissions for all services');

    const clusterRole = {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'ClusterRole',
        metadata: {
            name: 'zenko-admin'
        },
        rules: [
            {
                apiGroups: ['*'],
                resources: ['*'],
                verbs: ['*']
            }
        ]
    };

    if (!KubernetesHelper.clientCore) {
        throw new Error('KubernetesHelper not initialized');
    }
    const serviceAccounts = await KubernetesHelper.clientCore.listNamespacedServiceAccount({
        namespace: options.namespace,
    });
    const zenkoServiceAccounts = serviceAccounts.items.filter((sa: any) =>
        sa.metadata?.name?.includes('zenko') ||
        sa.metadata?.name?.includes('cloudserver') ||
        sa.metadata?.name?.includes('backbeat') ||
        sa.metadata?.name?.includes('operator')
    );
    if (!KubernetesHelper.rbacApi) {
        throw new Error('KubernetesHelper not initialized');
    }

    try {
        await KubernetesHelper.rbacApi.createClusterRole({
            body: clusterRole,
        });
        logger.debug('ClusterRole zenko-admin created');
    } catch (error: any) {
        if (error.code === 409) {
            logger.debug('ClusterRole zenko-admin already exists, attempting to update');
            await KubernetesHelper.rbacApi.replaceClusterRole({
                name: 'zenko-admin',
                body: clusterRole,
            });
            logger.debug('ClusterRole zenko-admin updated');
        } else {
            throw error;
        }
    }

    const setupRoleBinding = {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'ClusterRoleBinding',
        metadata: {
            name: 'zenko-admin-setup'
        },
        subjects: [{
            kind: 'ServiceAccount',
            name: 'zenko-setup',
            namespace: options.namespace
        }],
        roleRef: {
            kind: 'ClusterRole',
            name: 'zenko-admin',
            apiGroup: 'rbac.authorization.k8s.io'
        }
    };

    try {
        await KubernetesHelper.rbacApi.createClusterRoleBinding({
            body: setupRoleBinding,
        });
        logger.debug('Created comprehensive ClusterRoleBinding for setup service account');
    } catch (error: any) {
        if (error.code === 409) {
            logger.debug('Setup ClusterRoleBinding already exists, attempting to update');
            await KubernetesHelper.rbacApi.replaceClusterRoleBinding({
                name: 'zenko-admin-setup',
                body: setupRoleBinding,
            });
            logger.debug('Setup ClusterRoleBinding updated');
        } else {
            throw error;
        }
    }

    for (const sa of zenkoServiceAccounts) {
        const saName = sa.metadata?.name;
        if (!saName) continue;

        const clusterRoleBinding = {
            apiVersion: 'rbac.authorization.k8s.io/v1',
            kind: 'ClusterRoleBinding',
            metadata: {
                name: `zenko-admin-${saName}`
            },
            subjects: [{
                kind: 'ServiceAccount',
                name: saName,
                namespace: options.namespace
            }],
            roleRef: {
                kind: 'ClusterRole',
                name: 'zenko-admin',
                apiGroup: 'rbac.authorization.k8s.io'
            }
        };

        try {
            await KubernetesHelper.rbacApi.createClusterRoleBinding({
                body: clusterRoleBinding,
            });
            logger.debug(`Created ClusterRoleBinding for ${saName}`);
        } catch (error: any) {
            if (error.code === 409) {
                logger.debug(`ClusterRoleBinding for ${saName} already exists, attempting to update`);
                try {
                } catch (replaceError: any) {
                    logger.debug(`Failed to replace ClusterRoleBinding for ${saName}, it may already be correct`, { error: replaceError.message });
                }
            } else {
                throw error;
            }
        }
    }

    const defaultRoleBinding = {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'ClusterRoleBinding',
        metadata: {
            name: `zenko-admin-default-${options.namespace}`
        },
        subjects: [{
            kind: 'ServiceAccount',
            name: 'default',
            namespace: options.namespace
        }],
        roleRef: {
            kind: 'ClusterRole',
            name: 'zenko-admin',
            apiGroup: 'rbac.authorization.k8s.io'
        }
    };

    try {
        await KubernetesHelper.rbacApi.createClusterRoleBinding({
            body: defaultRoleBinding,
        });
        logger.debug(`Created default ClusterRoleBinding`);
    } catch (error: any) {
        if (error.code === 409) {
            logger.debug(`Default ClusterRoleBinding already exists, attempting to update`);
            try {
                await KubernetesHelper.rbacApi.replaceClusterRoleBinding({
                    name: `zenko-admin-default-${options.namespace}`,
                    body: defaultRoleBinding,
                });
                logger.debug(`Default ClusterRoleBinding updated`);
            } catch (replaceError: any) {
                logger.debug(`Failed to replace default ClusterRoleBinding, it may already be correct`, { error: replaceError.message });
            }
        } else {
            throw error;
        }
    }

    logger.info(`RBAC setup completed for ${zenkoServiceAccounts.length + 1} service accounts`);

    await cleanupOldRBACResources(options.namespace);
    await cleanupBootstrapRBAC();
}

/**
 * Cleanup bootstrap RBAC
 */
async function cleanupBootstrapRBAC(): Promise<void> {
    const bootstrapResources = [
        { type: 'clusterrolebinding', name: 'zenko-setup-binding' },
        { type: 'clusterrole', name: 'zenko-setup-role' }
    ];

    if (!KubernetesHelper.rbacApi) {
        throw new Error('KubernetesHelper not initialized');
    }

    for (const resource of bootstrapResources) {
        try {
            if (resource.type === 'clusterrolebinding') {
                await KubernetesHelper.rbacApi.deleteClusterRoleBinding({ name: resource.name });
            } else {
                await KubernetesHelper.rbacApi.deleteClusterRole({ name: resource.name });
            }
            logger.debug(`Cleaned up bootstrap ${resource.type}: ${resource.name}`);
        } catch (error: any) {
            logger.debug(`Failed to cleanup bootstrap ${resource.type} ${resource.name}:`, { error: error.message });
        }
    }
    logger.debug('Bootstrap RBAC cleanup completed');
}

/**
 * Cleanup old RBAC resources
 * @param namespace - Namespace
 * @returns Promise that resolves when the old RBAC resources are cleaned up
 */
async function cleanupOldRBACResources(namespace: string): Promise<void> {
    const oldResources = [
        { type: 'clusterrole', name: 'zenko-test-admin' },
    ];

    if (!KubernetesHelper.rbacApi) {
        throw new Error('KubernetesHelper not initialized');
    }

    try {
        const bindings = await KubernetesHelper.rbacApi.listClusterRoleBinding();
        const oldBindings = bindings.items.filter((binding: any) =>
            binding.metadata?.name?.startsWith('zenko-test-admin-')
        );

        for (const binding of oldBindings) {
            if (binding.metadata?.name) {
                oldResources.push({ type: 'clusterrolebinding', name: binding.metadata.name });
            }
        }
    } catch (error: any) {
        logger.debug('Failed to list cluster role bindings for cleanup:', { error: error.message });
    }

    for (const resource of oldResources) {
        try {
            if (resource.type === 'clusterrolebinding') {
                await KubernetesHelper.rbacApi.deleteClusterRoleBinding({ name: resource.name });
            } else {
                await KubernetesHelper.rbacApi.deleteClusterRole({ name: resource.name });
            }
            logger.debug(`Cleaned up old ${resource.type}: ${resource.name}`);
        } catch (error: any) {
            logger.debug(`Failed to cleanup old ${resource.type} ${resource.name}:`, { error: error.message });
        }
    }
    logger.debug('Old RBAC resources cleanup completed');
}
