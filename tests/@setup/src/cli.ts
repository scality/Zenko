#!/usr/bin/env node

import { Command } from 'commander';
import { setupMocks } from './mocks';
import { setupLocations } from './locations';
import { setupWorkflows } from './workflows';
import { setupDNS } from './dns';
import { setupRBAC } from './rbac';
import { setupMetadata } from './metadata';
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
    .option('--workflows-config <path>', 'Path to workflows configuration file')
    .option('--locations-config <path>', 'Path to locations configuration file')
    .option('--git-access-token <token>', 'Git access token for metadata repository')
    .option('--metadata-namespace <namespace>', 'Metadata service namespace', 'metadata')
    .option('--no-rbac', 'Skip RBAC setup')
    .option('--no-dns', 'Skip DNS setup')
    .option('--no-mocks', 'Skip mock services setup')
    .option('--no-locations', 'Skip storage locations setup')
    .option('--no-workflows', 'Skip workflows setup')
    .option('--no-metadata', 'Skip Metadata service setup')
    .action(async (options) => {
        const globalOptions = program.opts();
        await runSetup({
            ...globalOptions,
            rbac: !options.noRbac,
            dns: !options.noDns,
            mocks: !options.noMocks,
            locations: !options.noLocations,
            workflows: !options.noWorkflows,
            metadata: !options.noMetadata,
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

async function runSetup(options: any) {
    try {
        logger.info('Starting Zenko test environment setup');

        logger.info('Checking Zenko readiness...');
        await waitForZenkoToStabilize({
            namespace: options.namespace || 'default',
            instanceId: options.instanceId || 'end2end',
            timeout: 10 * 60 * 1000,
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

        if (options.workflows) {
            tasks.push({
                name: 'Workflows', fn: () => setupWorkflows({
                    namespace: options.namespace || 'default',
                    instanceId: options.instanceId,
                    configFile: options.workflowsConfig,
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