#!/usr/bin/env node

import { Command } from 'commander';
import { setupMocks } from './mocks';
import { setupLocations } from './locations';
import { setupWorkflows } from './workflows';
import { setupDNS } from './dns';
import { setupRBAC } from './rbac';
import { setupMetadata } from './metadata';
import { setupNotifications } from './notifications';
import { setupAccounts } from './accounts';
import { waitForZenkoToStabilize } from './utils/zenko-status';
import { logger } from './utils/logger';
import { getInstanceId } from './utils/management';
import { initKubernetes } from './utils/k8s';

// Track completed setup steps
const setupFlags = {
    rbac: false,
    dns: false,
    metadata: false,
    mocks: false,
    locations: false,
    accounts: false,
};

const program = new Command();

program
    .name('zenko-setup')
    .description('Unified CLI tool for Zenko test environment setup')
    .version('1.0.0');

program
    .option('-n, --namespace <namespace>', 'Kubernetes namespace', 'default')
    .option('-d, --subdomain <subdomain>', 'DNS subdomain', 'zenko.local')
    .option('-k, --kubeconfig <path>', 'Path to kubeconfig file')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('-z, --zenko-name <zenko-name>', 'Zenko name', 'end2end');

program
    .command('all')
    .description('Run complete setup (all tasks, use --no-<task> to exclude specific tasks)')
    .option('--config <path>', 'Path to setup configuration file')
    .option('--workflows-config <path>', 'Path to workflows configuration file')
    .option('--locations-config <path>', 'Path to locations configuration file')
    .option('--git-access-token <token>', 'Git access token for metadata repository')
    .option('--metadata-namespace <namespace>', 'Metadata service namespace', 'metadata')
    .option('--no-rbac', 'Skip RBAC setup')
    .option('--no-dns', 'Skip DNS setup')
    .option('--no-mocks', 'Skip mock services setup')
    .option('--no-locations', 'Skip storage locations setup')
    .option('--no-accounts', 'Skip accounts setup')
    .option('--no-workflows', 'Skip workflows setup')
    .option('--no-metadata', 'Skip Metadata service setup')
    .option('--no-notifications', 'Skip notifications setup')
    .action(async (options) => {
        const globalOptions = program.opts();
        await runSetup({
            ...globalOptions,
            rbac: !options.noRbac,
            dns: !options.noDns,
            mocks: !options.noMocks,
            locations: !options.noLocations,
            accounts: !options.noAccounts,
            workflows: !options.noWorkflows,
            metadata: !options.noMetadata,
            notifications: !options.noNotifications,
            ctstLocal: !options.noCtstLocal,
            configFile: options.config,
            workflowsConfig: options.workflowsConfig,
            locationsConfig: options.locationsConfig,
            gitAccessToken: options.gitAccessToken,
            metadataNamespace: options.metadataNamespace,
        });
    });

program
    .command('setup')
    .description('Run selective setup tasks')
    .option('--rbac', 'Setup RBAC permissions')
    .option('--dns', 'Configure DNS')
    .option('--mocks', 'Setup mock services')
    .option('--locations', 'Setup storage locations')
    .option('--accounts', 'Create test accounts')
    .option('--workflows', 'Create workflows')
    .option('--metadata', 'Deploy metadata service')
    .option('--notifications', 'Setup Kafka notifications')
    .option('--config <path>', 'Path to setup configuration file')
    .option('--workflows-config <path>', 'Path to workflows configuration file')
    .option('--locations-config <path>', 'Path to locations configuration file')
    .option('--git-access-token <token>', 'Git access token for metadata repository')
    .option('--metadata-namespace <namespace>', 'Metadata service namespace', 'metadata')
    .action(async (options) => {
        const globalOptions = program.opts();
        await runSetup({
            ...globalOptions,
            // Only run tasks that are explicitly specified
            rbac: options.rbac || false,
            dns: options.dns || false,
            mocks: options.mocks || false,
            locations: options.locations || false,
            workflows: options.workflows || false,
            metadata: options.metadata || false,
            notifications: options.notifications || false,
            configFile: options.config,
            workflowsConfig: options.workflowsConfig,
            locationsConfig: options.locationsConfig,
            gitAccessToken: options.gitAccessToken,
            metadataNamespace: options.metadataNamespace,
        });
    });

program
    .command('mocks')
    .description('Setup AWS and Azure mock services')
    .option('--aws-only', 'Setup only AWS mocks')
    .option('--azure-only', 'Setup only Azure mocks')
    .action(async (options) => {
        if (!setupFlags.rbac) {
            throw new Error('RBAC setup is required before mocks setup');
        }
        if (!setupFlags.dns) {
            throw new Error('DNS setup is required before mocks setup');
        }
        const globalOptions = program.opts();
        await setupMocks({
            namespace: globalOptions.namespace || 'default',
            subdomain: globalOptions.subdomain || 'zenko.local',
            awsOnly: options.awsOnly,
            azureOnly: options.azureOnly,
        });
        setupFlags.mocks = true;
    });

program
    .command('locations')
    .description('Setup storage locations via Management API')
    .option('--config <path>', 'Path to locations configuration file')
    .action(async (options) => {
        if (!setupFlags.dns) {
            throw new Error('DNS setup is required before locations setup');
        }
        const globalOptions = program.opts();
        await setupLocations({
            namespace: globalOptions.namespace || 'default',
            subdomain: globalOptions.subdomain || 'zenko.local',
            configFile: options.config,
            zenkoName: globalOptions.zenkoName || 'end2end',
        });
        setupFlags.locations = true;
    });

program
    .command('workflows')
    .description('Create replication/lifecycle/ingestion workflows')
    .option('--config <path>', 'Path to workflows configuration file')
    .option('--type <type>', 'Specific workflow type (replication|lifecycle|ingestion)')
    .action(async (options) => {
        if (!setupFlags.locations) {
            throw new Error('Locations setup is required before workflows setup');
        }
        const globalOptions = program.opts();
        const instanceId = await getInstanceId();
        if (!instanceId) {
            throw new Error('instance ID is required for workflow setup. Ensure UUID environment variable is set or Zenko CR exists');
        }
        await setupWorkflows({
            namespace: globalOptions.namespace || 'default',
            configFile: options.config,
            workflowType: options.type,
            instanceId,
            zenkoName: globalOptions.zenkoName || 'end2end',
        });
    });

program
    .command('dns')
    .description('Configure CoreDNS for test domains')
    .action(async () => {
        if (!setupFlags.rbac) {
            throw new Error('RBAC setup is required before DNS setup');
        }
        const globalOptions = program.opts();
        await setupDNS({
            namespace: globalOptions.namespace || 'default',
            subdomain: globalOptions.subdomain || 'zenko.local',
        });
        setupFlags.dns = true;
    });

program
    .command('rbac')
    .description('Setup RBAC permissions for service accounts')
    .action(async () => {
        const globalOptions = program.opts();
        await setupRBAC({
            namespace: globalOptions.namespace || 'default',
        });
        setupFlags.rbac = true;
        logger.debug('RBAC setup flag set');
    });

program
    .command('metadata')
    .description('Deploy metadata service (S3C)')
    .option('--git-access-token <token>', 'Git access token for metadata repository')
    .option('--metadata-namespace <namespace>', 'Metadata service namespace', 'metadata')
    .option('--timeout <seconds>', 'Timeout in seconds for deployment', '300')
    .action(async (options) => {
        // Check RBAC dependency
        if (!setupFlags.rbac) {
            throw new Error('RBAC setup is required before metadata setup');
        }

        await setupMetadata({
            gitAccessToken: options.gitAccessToken || process.env.GIT_ACCESS_TOKEN,
            namespace: options.metadataNamespace || 'metadata',
            timeout: parseInt(options.timeout || '300'),
        });
    });

program
    .command('notifications')
    .description('Setup Kafka notification topics and destinations')
    .option('--config <path>', 'Path to notification destinations configuration file')
    .action(async (options) => {
        if (!setupFlags.locations) {
            throw new Error('Locations setup is required before notifications setup');
        }
        const globalOptions = program.opts();
        await setupNotifications({
            namespace: globalOptions.namespace || 'default',
            configFile: options.config,
        });
    });

async function runSetup(options: any) {
    try {
        logger.info('Starting Zenko test environment setup');
        logger.info('Checking Zenko readiness...');
        initKubernetes();
        await waitForZenkoToStabilize({
            namespace: options.namespace || 'default',
            zenkoName: options.zenkoName || 'end2end',
            timeout: 10 * 60 * 1000,
        });

        const tasks = [];

        // Ensure tasks are added in dependency order
        if (options.rbac) {
            tasks.push({
                name: 'RBAC', fn: async () => {
                    await setupRBAC({
                        namespace: options.namespace || 'default',
                    });
                    setupFlags.rbac = true;
                    logger.debug('RBAC setup flag set');
                }
            });
        }

        if (options.dns) {
            tasks.push({
                name: 'DNS', fn: async () => {
                    if (!setupFlags.rbac) {
                        throw new Error('RBAC setup is required before DNS setup');
                    }
                    await setupDNS({
                        namespace: options.namespace || 'default',
                        subdomain: options.subdomain || 'zenko.local',
                    });
                    setupFlags.dns = true;
                }
            });
        }

        if (options.metadata) {
            tasks.push({
                name: 'Metadata Service', fn: async () => {
                    if (!setupFlags.rbac) {
                        throw new Error('RBAC setup is required before metadata setup');
                    }

                    await setupMetadata({
                        gitAccessToken: options.gitAccessToken || process.env.GIT_ACCESS_TOKEN,
                        namespace: options.metadataNamespace || 'metadata',
                        timeout: 300,
                    });
                    setupFlags.metadata = true;
                    logger.debug('Metadata setup flag set');
                }
            });
        }

        if (options.mocks) {
            tasks.push({
                name: 'Mock Services', fn: async () => {
                    if (!setupFlags.rbac) {
                        throw new Error('RBAC setup is required before mocks setup');
                    }
                    if (!setupFlags.dns) {
                        throw new Error('DNS setup is required before mocks setup');
                    }
                    await setupMocks({
                        namespace: options.namespace || 'default',
                        subdomain: options.subdomain || 'zenko.local',
                    });
                    setupFlags.mocks = true;
                }
            });
        }

        if (options.accounts) {
            tasks.push({
                name: 'Accounts', fn: async () => {
                    if (!setupFlags.dns) {
                        throw new Error('DNS setup is required before accounts setup');
                    }
                    await setupAccounts({
                        namespace: options.namespace || 'default',
                        accounts: options.accounts === true ? undefined : options.accounts, // Allow array of account names
                    });
                    setupFlags.accounts = true;
                }
            });
        }

        if (options.locations) {
            tasks.push({
                name: 'Storage Locations', fn: async () => {
                    if (!setupFlags.dns) {
                        throw new Error('DNS setup is required before locations setup');
                    }
                    if (!setupFlags.accounts) {
                        throw new Error('Accounts setup is required before locations setup');
                    }
                    await setupLocations({
                        namespace: options.namespace || 'default',
                        subdomain: options.subdomain || 'zenko.local',
                        configFile: options.locationsConfig,
                        zenkoName: options.zenkoName || 'end2end',
                    });
                    setupFlags.locations = true;
                }
            });
        }

        if (options.workflows) {
            const instanceId = await getInstanceId();
            if (!instanceId) {
                throw new Error('instance ID is required for workflow setup. Ensure UUID environment variable is set or Zenko CR exists');
            }
            tasks.push({
                name: 'Workflows', fn: async () => {
                    if (!setupFlags.locations) {
                        throw new Error('Locations setup is required before workflows setup');
                    }
                    await setupWorkflows({
                        namespace: options.namespace || 'default',
                        configFile: options.workflowsConfig,
                        instanceId,
                        zenkoName: options.zenkoName || 'end2end',
                    });
                }
            });
        }

        if (options.notifications) {
            const instanceId = await getInstanceId();
            if (!instanceId) {
                throw new Error('instance ID is required for notification setup. Ensure UUID environment variable is set or Zenko CR exists');
            }
            tasks.push({
                name: 'Notifications', fn: async () => {
                    if (!setupFlags.locations) {
                        throw new Error('Locations setup is required before notifications setup');
                    }
                    await setupNotifications({
                        namespace: options.namespace || 'default',
                        configFile: options.notificationsConfig,
                    });
                }
            });
        }

        for (const task of tasks) {
            logger.info(`Setting up ${task.name}...`);

            try {
                await task.fn();
                logger.info(`${task.name} setup completed`);
            } catch (error) {
                logger.error(`${task.name} setup failed`, { error: error instanceof Error ? error.message : String(error) });
                throw error;
            }
        }

        logger.info('Zenko test environment setup completed successfully!');
    } catch (error) {
        logger.error('Setup failed', { error: error instanceof Error ? error.message : String(error) });
        process.exit(1);
    }
}

program.parse();