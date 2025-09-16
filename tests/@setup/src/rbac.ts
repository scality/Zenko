import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';

export interface RBACOptions {
    namespace: string;
}

export async function setupRBAC(options: RBACOptions): Promise<void> {
    const k8s = new KubernetesClient();
    await k8s.ensureNamespace(options.namespace);

    logger.info('Setting up comprehensive RBAC permissions for all services');

    // Create comprehensive cluster role for both setup and test operations
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

    // Get all service accounts in the namespace
    const serviceAccounts = await k8s.coreApi.listNamespacedServiceAccount({
        namespace: options.namespace,
    });
    const zenkoServiceAccounts = serviceAccounts.items.filter(sa =>
        sa.metadata?.name?.includes('zenko') ||
        sa.metadata?.name?.includes('cloudserver') ||
        sa.metadata?.name?.includes('backbeat') ||
        sa.metadata?.name?.includes('operator')
    );

    // Apply comprehensive cluster role
    try {
        await k8s.rbacApi.createClusterRole({
            body: clusterRole,
        });
        logger.debug('ClusterRole zenko-admin created');
    } catch (error: any) {
        if (error.response?.statusCode === 409) {
            logger.debug('ClusterRole zenko-admin already exists, attempting to update');
            try {
                await k8s.rbacApi.replaceClusterRole({
                    name: 'zenko-admin',
                    body: clusterRole,
                });
                logger.debug('ClusterRole zenko-admin updated');
            } catch (replaceError: any) {
                logger.debug('Failed to replace ClusterRole, it may already be correct', { error: replaceError.message });
                // Continue execution as the role likely exists and is functional
            }
        } else {
            throw error;
        }
    }

    // Create comprehensive cluster role binding for setup service account first
    // (so it keeps permissions during the process)
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
        await k8s.rbacApi.createClusterRoleBinding({
            body: setupRoleBinding,
        });
        logger.debug('Created comprehensive ClusterRoleBinding for setup service account');
    } catch (error: any) {
        if (error.response?.statusCode === 409) {
            logger.debug('Setup ClusterRoleBinding already exists, attempting to update');
            try {
                await k8s.rbacApi.replaceClusterRoleBinding({
                    name: 'zenko-admin-setup',
                    body: setupRoleBinding,
                });
                logger.debug('Setup ClusterRoleBinding updated');
            } catch (replaceError: any) {
                logger.debug('Failed to replace setup ClusterRoleBinding, it may already be correct', { error: replaceError.message });
            }
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
            await k8s.rbacApi.createClusterRoleBinding({
                body: clusterRoleBinding,
            });
            logger.debug(`Created ClusterRoleBinding for ${saName}`);
        } catch (error: any) {
            if (error.response?.statusCode === 409) {
                logger.debug(`ClusterRoleBinding for ${saName} already exists, attempting to update`);
                try {
                    await k8s.rbacApi.replaceClusterRoleBinding({
                        name: `zenko-admin-${saName}`,
                        body: clusterRoleBinding,
                    });
                    logger.debug(`ClusterRoleBinding for ${saName} updated`);
                } catch (replaceError: any) {
                    logger.debug(`Failed to replace ClusterRoleBinding for ${saName}, it may already be correct`, { error: replaceError.message });
                    // Continue execution as the binding likely exists and is functional
                }
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
        await k8s.rbacApi.createClusterRoleBinding({
            body: defaultRoleBinding,
        });
        logger.debug(`Created default ClusterRoleBinding`);
    } catch (error: any) {
        if (error.response?.statusCode === 409) {
            logger.debug(`Default ClusterRoleBinding already exists, attempting to update`);
            try {
                await k8s.rbacApi.replaceClusterRoleBinding({
                    name: `zenko-admin-default-${options.namespace}`,
                    body: defaultRoleBinding,
                });
                logger.debug(`Default ClusterRoleBinding updated`);
            } catch (replaceError: any) {
                logger.debug(`Failed to replace default ClusterRoleBinding, it may already be correct`, { error: replaceError.message });
                // Continue execution as the binding likely exists and is functional
            }
        } else {
            throw error;
        }
    }

    logger.info(`RBAC setup completed for ${zenkoServiceAccounts.length + 1} service accounts`);
    
    // Now cleanup old RBAC resources (zenko-test-admin from previous versions)
    await cleanupOldRBACResources(k8s, options.namespace);
    
    // Finally cleanup bootstrap RBAC (at the end, so we maintain permissions throughout)
    await cleanupBootstrapRBAC(k8s, options.namespace);
}

async function cleanupBootstrapRBAC(k8s: any, namespace: string): Promise<void> {
    const bootstrapResources = [
        { type: 'clusterrolebinding', name: 'zenko-setup-binding' },
        { type: 'clusterrole', name: 'zenko-setup-role' }
    ];

    for (const resource of bootstrapResources) {
        try {
            if (resource.type === 'clusterrolebinding') {
                await k8s.rbacApi.deleteClusterRoleBinding({ name: resource.name });
            } else {
                await k8s.rbacApi.deleteClusterRole({ name: resource.name });
            }
            logger.debug(`Cleaned up bootstrap ${resource.type}: ${resource.name}`);
        } catch (error: any) {
            if (error.response?.statusCode === 404) {
                logger.debug(`Bootstrap ${resource.type} ${resource.name} not found (already cleaned up)`);
            } else {
                logger.debug(`Failed to cleanup bootstrap ${resource.type} ${resource.name}:`, { error: error.message });
                // Don't fail setup for cleanup issues
            }
        }
    }
    logger.debug('Bootstrap RBAC cleanup completed');
}

async function cleanupOldRBACResources(k8s: any, namespace: string): Promise<void> {
    // Clean up old zenko-test-admin resources from previous versions
    const oldResources = [
        { type: 'clusterrole', name: 'zenko-test-admin' },
    ];

    // Get all cluster role bindings that start with zenko-test-admin
    try {
        const bindings = await k8s.rbacApi.listClusterRoleBinding();
        const oldBindings = bindings.items.filter((binding: any) => 
            binding.metadata?.name?.startsWith('zenko-test-admin-')
        );
        
        for (const binding of oldBindings) {
            oldResources.push({ type: 'clusterrolebinding', name: binding.metadata.name });
        }
    } catch (error: any) {
        logger.debug('Failed to list cluster role bindings for cleanup:', { error: error.message });
    }

    for (const resource of oldResources) {
        try {
            if (resource.type === 'clusterrolebinding') {
                await k8s.rbacApi.deleteClusterRoleBinding({ name: resource.name });
            } else {
                await k8s.rbacApi.deleteClusterRole({ name: resource.name });
            }
            logger.debug(`Cleaned up old ${resource.type}: ${resource.name}`);
        } catch (error: any) {
            if (error.response?.statusCode === 404) {
                logger.debug(`Old ${resource.type} ${resource.name} not found (already cleaned up)`);
            } else {
                logger.debug(`Failed to cleanup old ${resource.type} ${resource.name}:`, { error: error.message });
                // Don't fail setup for cleanup issues
            }
        }
    }
    logger.debug('Old RBAC resources cleanup completed');
}
