#!/usr/bin/env node

import { Command } from 'commander';
import { setupMocks } from './mocks';
import { setupBuckets } from './buckets';
import { setupLocations } from './locations';
import { setupDNS } from './dns';
import { setupRBAC } from './rbac';
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
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Enable verbose logging');

program
    .command('all')
    .description('Run all setup tasks')
    .option('--skip-mocks', 'Skip mock services setup')
    .option('--skip-buckets', 'Skip bucket creation')
    .option('--skip-locations', 'Skip storage locations setup')
    .option('--skip-keycloak', 'Skip Keycloak realm/users setup')
    .option('--skip-dns', 'Skip DNS configuration')
    .option('--skip-rbac', 'Skip RBAC permissions setup')
    .action(async (options) => {
        const globalOptions = program.opts();
        await runSetup({
            ...globalOptions,
            mocks: !options.skipMocks,
            buckets: !options.skipBuckets,
            locations: !options.skipLocations,
            keycloak: !options.skipKeycloak,
            dns: !options.skipDns,
            rbac: !options.skipRbac,
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
            dryRun: globalOptions.dryRun,
        });
    });

program
    .command('buckets')
    .description('Create test buckets across all providers')
    .option('--provider <provider>', 'Specific provider (aws|azure|ring)')
    .action(async (options) => {
        const globalOptions = program.opts();
        await setupBuckets({
            namespace: globalOptions.namespace || 'default',
            provider: options.provider,
            dryRun: globalOptions.dryRun,
        });
    });

program
    .command('locations')
    .description('Setup storage locations via Management API')
    .action(async () => {
        const globalOptions = program.opts();
        await setupLocations({
            namespace: globalOptions.namespace || 'default',
            instanceId: globalOptions.instanceId,
            dryRun: globalOptions.dryRun,
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
            dryRun: globalOptions.dryRun,
        });
    });

program
    .command('rbac')
    .description('Setup RBAC permissions for service accounts')
    .action(async () => {
        const globalOptions = program.opts();
        await setupRBAC({
            namespace: globalOptions.namespace || 'default',
            dryRun: globalOptions.dryRun,
        });
    });

async function runSetup(options: any) {
    try {
        logger.info('🚀 Starting Zenko test environment setup');

        const tasks = [];

        if (options.rbac) {
            tasks.push({
                name: 'RBAC', fn: () => setupRBAC({
                    namespace: options.namespace || 'default',
                    dryRun: options.dryRun,
                })
            });
        }

        if (options.dns) {
            tasks.push({
                name: 'DNS', fn: () => setupDNS({
                    namespace: options.namespace || 'default',
                    subdomain: options.subdomain || 'zenko.local',
                    dryRun: options.dryRun,
                })
            });
        }

        if (options.mocks) {
            tasks.push({
                name: 'Mock Services', fn: () => setupMocks({
                    namespace: options.namespace || 'default',
                    subdomain: options.subdomain || 'zenko.local',
                    instanceId: options.instanceId,
                    dryRun: options.dryRun,
                })
            });
        }

        if (options.locations) {
            tasks.push({
                name: 'Storage Locations', fn: () => setupLocations({
                    namespace: options.namespace || 'default',
                    instanceId: options.instanceId,
                    dryRun: options.dryRun,
                })
            });
        }

        if (options.buckets) {
            tasks.push({
                name: 'Test Buckets', fn: () => setupBuckets({
                    namespace: options.namespace || 'default',
                    dryRun: options.dryRun,
                })
            });
        }

        for (const task of tasks) {
            logger.info(`📝 Setting up ${task.name}...`);

            if (options.dryRun) {
                logger.info(`  [DRY RUN] Would execute ${task.name} setup`);
                continue;
            }

            try {
                await task.fn();
                logger.info(`  ✅ ${task.name} setup completed`);
            } catch (error) {
                logger.error(`  ❌ ${task.name} setup failed`, { error: error instanceof Error ? error.message : String(error) });
                throw error;
            }
        }

        logger.info('🎉 Zenko test environment setup completed successfully!');

    } catch (error) {
        logger.error('💥 Setup failed', { error: error instanceof Error ? error.message : String(error) });
        process.exit(1);
    }
}

program.parse();