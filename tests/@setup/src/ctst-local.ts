import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { logger } from './utils/logger';
import { setupRBAC } from './rbac';
import { setupDNS } from './dns';
import { waitForZenkoToStabilize } from './utils/zenko-status';

export interface CTSTLocalOptions {
    namespace: string;
    instanceId?: string;
    subdomain?: string;
    skipHostsFile?: boolean;
    skipRBAC?: boolean;
    skipDNS?: boolean;
    skipZenkoWait?: boolean;
}

export async function setupCTSTLocal(options: CTSTLocalOptions): Promise<void> {
    logger.info('Setting up CTST local development environment...');

    try {
        // 1. Setup RBAC permissions for CTST
        if (!options.skipRBAC) {
            logger.info('Setting up CTST permissions...');
            await setupCTSTPermissions(options.namespace);
        }

        // 2. Setup DNS/CoreDNS configuration
        if (!options.skipDNS) {
            logger.info('Checking CoreDNS configuration...');
            await setupDNS({
                namespace: options.namespace,
                subdomain: options.subdomain || 'zenko.local',
            });
        }

        // 3. Setup /etc/hosts for local development
        if (!options.skipHostsFile) {
            logger.info('Checking /etc/hosts configuration...');
            await setupHostsFile(options.subdomain || 'zenko.local');
        }

        // 4. Wait for Zenko to be ready
        if (!options.skipZenkoWait) {
            logger.info('Waiting for Zenko deployment to be ready...');
            await waitForZenkoToStabilize({
                namespace: options.namespace,
                instanceId: options.instanceId || 'end2end',
                timeout: 10 * 60 * 1000, // 10 minutes
            });
        }

        logger.info('CTST local environment ready!');
        logger.info('Usage:');
        logger.info('  cd tests/ctst');
        logger.info('  npm test                    # Run all CTST tests');
        logger.info('  npm run test -- --tags @PRA # Run specific test tags');
        logger.info('');
        logger.info('Note: CTST will handle all Kubernetes setup (mocks, topics, deployments, etc.) automatically');

    } catch (error) {
        logger.error('Failed to setup CTST local environment:', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}

async function setupCTSTPermissions(namespace: string): Promise<void> {
    try {
        logger.info('Creating cluster-admin permissions for CTST...');
        
        // Create clusterrolebinding for CTST with cluster-admin permissions
        const clusterRoleBindingYaml = `
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ctst-cluster-admin
subjects:
- kind: ServiceAccount
  name: default
  namespace: ${namespace}
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
`;

        // Apply the configuration using kubectl
        execSync('kubectl apply -f -', {
            input: clusterRoleBindingYaml,
            stdio: ['pipe', 'inherit', 'inherit'],
        });

        logger.info('CTST cluster-admin permissions configured successfully');
    } catch (error) {
        logger.error('Failed to setup CTST permissions:', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}

async function setupHostsFile(subdomain: string): Promise<void> {
    try {
        // Check if /etc/hosts already contains our entries
        let hostsContent = '';
        try {
            hostsContent = readFileSync('/etc/hosts', 'utf8');
        } catch (error) {
            logger.debug('Could not read /etc/hosts file, skipping hosts file setup');
            return;
        }

        if (hostsContent.includes(subdomain)) {
            logger.info('/etc/hosts already configured');
            return;
        }

        logger.info('Setting up /etc/hosts (requires sudo)...');
        
        const hostsEntry = `127.0.0.1 iam.${subdomain} ui.${subdomain} s3-local-file.${subdomain} keycloak.${subdomain} sts.${subdomain} management.${subdomain} s3.${subdomain} website.mywebsite.com utilization.${subdomain}`;
        
        // Use sudo to append to /etc/hosts
        execSync(`echo "${hostsEntry}" | sudo tee -a /etc/hosts`, {
            stdio: 'inherit',
        });

        logger.info('/etc/hosts configured successfully');
    } catch (error) {
        logger.warn('Failed to setup /etc/hosts (this may require manual setup):', { error: error instanceof Error ? error.message : String(error) });
        logger.info(`Manual setup: Add this line to /etc/hosts:`);
        logger.info(`127.0.0.1 iam.${subdomain} ui.${subdomain} s3-local-file.${subdomain} keycloak.${subdomain} sts.${subdomain} management.${subdomain} s3.${subdomain} website.mywebsite.com utilization.${subdomain}`);
    }
}