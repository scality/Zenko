#!/usr/bin/env node

import { Command } from 'commander';
import { setupMocks } from './mocks';
import { setupBuckets } from './buckets';
import { setupLocations } from './locations';
import { setupAccounts } from './accounts';
import { setupEndpoints } from './endpoints';
import { setupWorkflows } from './workflows';
import { setupTLSWithOpenSSL } from './tls';
import { setupDNS } from './dns';
import { setupRBAC } from './rbac';
import { setupMetadata } from './metadata';
import { setupCTSTLocal } from './ctst-local';
import { waitForZenkoToStabilize } from './utils/zenko-status';
import { logger } from './utils/logger';

const program = new Command();

program
    .name('zenko-setup')
    .description('Unified CLI tool for Zenko test environment setup')
    .version('1.0.0');

program
    .option('-n, --namespace <namespace>', 'Kubernetes namespace', 'default')
    .option('-d, --subdomain <subdomain>', 'DNS subdomain', 'zenko.local')
    .option('-i, --instance-id <id>', 'Zenko instance ID')
    .option('-k, --kubeconfig <path>', 'Path to kubeconfig file')
    .option('-v, --verbose', 'Enable verbose logging');

program
    .command('all')
    .description('Run complete setup (all tasks, use --no-<task> to exclude specific tasks)')
    .option('--config <path>', 'Path to setup configuration file')
    .option('--buckets-config <path>', 'Path to buckets configuration file')
    .option('--accounts-config <path>', 'Path to accounts configuration file')
    .option('--endpoints-config <path>', 'Path to endpoints configuration file')
    .option('--workflows-config <path>', 'Path to workflows configuration file')
    .option('--locations-config <path>', 'Path to locations configuration file')
    .option('--git-access-token <token>', 'Git access token for metadata repository')
    .option('--metadata-namespace <namespace>', 'Metadata service namespace', 'metadata')
    .option('--no-rbac', 'Skip RBAC setup')
    .option('--no-dns', 'Skip DNS setup')
    .option('--no-mocks', 'Skip mock services setup')
    .option('--no-locations', 'Skip storage locations setup')
    .option('--no-accounts', 'Skip test accounts setup')
    .option('--no-endpoints', 'Skip S3 endpoints setup')
    .option('--no-workflows', 'Skip workflows setup')
    .option('--no-buckets', 'Skip test buckets setup')
    .option('--no-metadata', 'Skip metadata service setup')
    .option('--no-ctst-local', 'Skip CTST local environment setup')
    .option('--no-tls', 'Skip TLS certificates setup')
    .action(async (options) => {
        const globalOptions = program.opts();
        await runSetup({
            ...globalOptions,
            // Run everything for 'all' command, unless specifically excluded
            rbac: !options.noRbac,
            dns: !options.noDns,
            mocks: !options.noMocks,
            locations: !options.noLocations,
            accounts: !options.noAccounts,
            endpoints: !options.noEndpoints,
            workflows: !options.noWorkflows,
            buckets: !options.noBuckets,
            metadata: !options.noMetadata,
            ctstLocal: !options.noCtstLocal,
            tls: !options.noTls,
            configFile: options.config,
            bucketsConfig: options.bucketsConfig,
            accountsConfig: options.accountsConfig,
            endpointsConfig: options.endpointsConfig,
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
    .option('--endpoints', 'Create S3 endpoints')
    .option('--workflows', 'Create workflows')
    .option('--buckets', 'Create test buckets')
    .option('--metadata', 'Deploy metadata service')
    .option('--ctst-local', 'Setup CTST local development environment')
    .option('--tls', 'Setup TLS certificates')
    .option('--config <path>', 'Path to setup configuration file')
    .option('--buckets-config <path>', 'Path to buckets configuration file')
    .option('--accounts-config <path>', 'Path to accounts configuration file')
    .option('--endpoints-config <path>', 'Path to endpoints configuration file')
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
            accounts: options.accounts || false,
            endpoints: options.endpoints || false,
            workflows: options.workflows || false,
            buckets: options.buckets || false,
            metadata: options.metadata || false,
            ctstLocal: options['ctst-local'] || false,
            tls: options.tls || false,
            configFile: options.config,
            bucketsConfig: options.bucketsConfig,
            accountsConfig: options.accountsConfig,
            endpointsConfig: options.endpointsConfig,
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
        const globalOptions = program.opts();
        await setupMocks({
            namespace: globalOptions.namespace || 'default',
            subdomain: globalOptions.subdomain || 'zenko.local',
            instanceId: globalOptions.instanceId,
            awsOnly: options.awsOnly,
            azureOnly: options.azureOnly,
        });
    });

program
    .command('buckets')
    .description('Create test buckets across all providers')
    .option('--provider <provider>', 'Specific provider (aws|azure|ring)')
    .option('--config <path>', 'Path to buckets configuration file')
    .action(async (options) => {
        const globalOptions = program.opts();
        await setupBuckets({
            namespace: globalOptions.namespace || 'default',
            provider: options.provider,
            configFile: options.config,
        });
    });

program
    .command('locations')
    .description('Setup storage locations via Management API')
    .option('--config <path>', 'Path to locations configuration file')
    .action(async (options) => {
        const globalOptions = program.opts();
        await setupLocations({
            namespace: globalOptions.namespace || 'default',
            instanceId: globalOptions.instanceId,
            configFile: options.config,
        });
    });

program
    .command('accounts')
    .description('Create test accounts via Management API')
    .option('--config <path>', 'Path to accounts configuration file')
    .action(async (options) => {
        const globalOptions = program.opts();
        await setupAccounts({
            namespace: globalOptions.namespace || 'default',
            instanceId: globalOptions.instanceId,
            configFile: options.config,
        });
    });

program
    .command('endpoints')
    .description('Create S3 endpoints via Management API')
    .option('--config <path>', 'Path to endpoints configuration file')
    .action(async (options) => {
        const globalOptions = program.opts();
        await setupEndpoints({
            namespace: globalOptions.namespace || 'default',
            instanceId: globalOptions.instanceId,
            configFile: options.config,
        });
    });

program
    .command('workflows')
    .description('Create replication/lifecycle/ingestion workflows')
    .option('--config <path>', 'Path to workflows configuration file')
    .option('--type <type>', 'Specific workflow type (replication|lifecycle|ingestion)')
    .action(async (options) => {
        const globalOptions = program.opts();
        await setupWorkflows({
            namespace: globalOptions.namespace || 'default',
            instanceId: globalOptions.instanceId,
            configFile: options.config,
            workflowType: options.type,
        });
    });


program
    .command('tls')
    .description('Setup TLS certificates for HTTPS testing')
    .option('--domains <domains>', 'Comma-separated list of domains to include in certificate')
    .action(async (options) => {
        const globalOptions = program.opts();
        await setupTLSWithOpenSSL({
            namespace: globalOptions.namespace || 'default',
            domains: options.domains ? options.domains.split(',') : undefined,
        });
    });

program
    .command('dns')
    .description('Configure CoreDNS for test domains')
    .action(async () => {
        const globalOptions = program.opts();
        await setupDNS({
            namespace: globalOptions.namespace || 'default',
            subdomain: globalOptions.subdomain || 'zenko.local',
        });
    });

program
    .command('rbac')
    .description('Setup RBAC permissions for service accounts')
    .action(async () => {
        const globalOptions = program.opts();
        await setupRBAC({
            namespace: globalOptions.namespace || 'default',
        });
    });

program
    .command('metadata')
    .description('Deploy metadata service (S3C)')
    .option('--git-access-token <token>', 'Git access token for metadata repository')
    .option('--metadata-namespace <namespace>', 'Metadata service namespace', 'metadata')
    .option('--timeout <seconds>', 'Timeout in seconds for deployment', '300')
    .action(async (options) => {
        const globalOptions = program.opts();
        await setupMetadata({
            gitAccessToken: options.gitAccessToken || process.env.GIT_ACCESS_TOKEN,
            namespace: options.metadataNamespace || 'metadata',
            timeout: parseInt(options.timeout || '300'),
        });
    });

program
    .command('ctst-local')
    .description('Setup CTST local development environment')
    .option('--skip-hosts-file', 'Skip /etc/hosts file setup')
    .option('--skip-rbac', 'Skip RBAC permissions setup')
    .option('--skip-dns', 'Skip DNS configuration')
    .option('--skip-zenko-wait', 'Skip waiting for Zenko to be ready')
    .action(async (options) => {
        const globalOptions = program.opts();
        await setupCTSTLocal({
            namespace: globalOptions.namespace || 'default',
            instanceId: globalOptions.instanceId,
            subdomain: globalOptions.subdomain || 'zenko.local',
            skipHostsFile: options.skipHostsFile,
            skipRBAC: options.skipRbac,
            skipDNS: options.skipDns,
            skipZenkoWait: options.skipZenkoWait,
        });
    });

async function runSetup(options: any) {
    try {
        logger.info('Starting Zenko test environment setup');

        // First, wait for Zenko to be ready
        logger.info('Checking Zenko readiness...');
        await waitForZenkoToStabilize({
            namespace: options.namespace || 'default',
            instanceId: options.instanceId || 'end2end',
            timeout: 10 * 60 * 1000, // 10 minutes
        });

        const tasks = [];

        if (options.rbac) {
            tasks.push({
                name: 'RBAC', fn: () => setupRBAC({
                    namespace: options.namespace || 'default',
                })
            });
        }

        if (options.dns) {
            tasks.push({
                name: 'DNS', fn: () => setupDNS({
                    namespace: options.namespace || 'default',
                    subdomain: options.subdomain || 'zenko.local',
                })
            });
        }

        if (options.mocks) {
            tasks.push({
                name: 'Mock Services', fn: () => setupMocks({
                    namespace: options.namespace || 'default',
                    subdomain: options.subdomain || 'zenko.local',
                    instanceId: options.instanceId,
                })
            });
        }

        if (options.locations) {
            tasks.push({
                name: 'Storage Locations', fn: () => setupLocations({
                    namespace: options.namespace || 'default',
                    instanceId: options.instanceId,
                    configFile: options.locationsConfig,
                })
            });
        }

        if (options.accounts) {
            tasks.push({
                name: 'Test Accounts', fn: () => setupAccounts({
                    namespace: options.namespace || 'default',
                    instanceId: options.instanceId,
                    configFile: options.accountsConfig,
                })
            });
        }

        if (options.endpoints) {
            tasks.push({
                name: 'S3 Endpoints', fn: () => setupEndpoints({
                    namespace: options.namespace || 'default',
                    instanceId: options.instanceId,
                    configFile: options.endpointsConfig,
                })
            });
        }

        if (options.workflows) {
            tasks.push({
                name: 'Workflows', fn: () => setupWorkflows({
                    namespace: options.namespace || 'default',
                    instanceId: options.instanceId,
                    configFile: options.workflowsConfig,
                })
            });
        }

        if (options.buckets) {
            tasks.push({
                name: 'Test Buckets', fn: () => setupBuckets({
                    namespace: options.namespace || 'default',
                    configFile: options.bucketsConfig,
                })
            });
        }

        if (options.metadata) {
            tasks.push({
                name: 'Metadata Service', fn: () => setupMetadata({
                    gitAccessToken: options.gitAccessToken || process.env.GIT_ACCESS_TOKEN,
                    namespace: options.metadataNamespace || 'metadata',
                    timeout: 300,
                })
            });
        }

        if (options.ctstLocal) {
            tasks.push({
                name: 'CTST Local Environment', fn: () => setupCTSTLocal({
                    namespace: options.namespace || 'default',
                    instanceId: options.instanceId,
                    subdomain: options.subdomain || 'zenko.local',
                })
            });
        }

        if (options.tls) {
            tasks.push({
                name: 'TLS Certificates', fn: () => setupTLSWithOpenSSL({
                    namespace: options.namespace || 'default',
                    domains: ['*.zenko.local'],
                })
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