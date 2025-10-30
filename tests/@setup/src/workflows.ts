import { logger } from './utils/logger';
import {
    createIngestionWorkflow,
    createLifecycleWorkflow,
    createReplicationWorkflow,
    getManagementEndpoint,
    getManagementToken
} from './utils/management';
import config from '../configs/workflows.json';
import { IngestionWorkflow, LifecycleWorkflow, ReplicationWorkflow, WorkflowsOptions } from './utils/types';
import * as k8s from './utils/k8s';

export interface Workflow {
    name: string;
    enabled: boolean;
    schedule: string;
    sourceBucket: string;
    sourceLocation: string;
    targetBucket: string;
    targetLocation: string;
};

/**
 * Setup workflows
 * @param options - Workflows options
 * @returns Promise that resolves when the workflows are setup
 */
export async function setupWorkflows(options: WorkflowsOptions): Promise<void> {
    logger.info('Setting up workflows via Management API');

    const managementEndpoint = await getManagementEndpoint();
    const authToken = await getManagementToken();

    const instanceId = options.instanceId;

    let totalCreated = 0;

    if (!options.workflowType || options.workflowType === 'replication') {
        for (const workflow of config.replication as ReplicationWorkflow[]) {
            try {
                await createReplicationWorkflow(managementEndpoint, authToken, instanceId, workflow);
                logger.info(`Created replication workflow: ${workflow.name}`);
                totalCreated++;
            } catch (error) {
                logger.error(`Failed to create replication workflow ${workflow.name}: ${error instanceof Error ? error.message : String(error)}`);
                throw error;
            }
        }
    }

    if (!options.workflowType || options.workflowType === 'lifecycle') {
        for (const workflow of config.lifecycle as LifecycleWorkflow[]) {
            try {
                await createLifecycleWorkflow(managementEndpoint, authToken, instanceId, workflow as LifecycleWorkflow);
                logger.info(`Created lifecycle workflow: ${workflow.name}`);
                totalCreated++;
            } catch (error) {
                logger.error(`Failed to create lifecycle workflow ${workflow.name}: ${error instanceof Error ? error.message : String(error)}`);
                throw error;
            }
        }
    }

    if (!options.workflowType || options.workflowType === 'ingestion') {
        for (const workflow of config.ingestion as IngestionWorkflow[]) {
            try {
                await createIngestionWorkflow(managementEndpoint, authToken, instanceId, workflow);
                logger.info(`Created ingestion workflow: ${workflow.name}`);
                totalCreated++;
            } catch (error) {
                logger.error(`Failed to create ingestion workflow ${workflow.name}: ${error instanceof Error ? error.message : String(error)}`);
                throw error;
            }
        }

        // Wait for ingestion processor consumer group to be ready
        // This ensures the ingestion processor has started consuming from Kafka before tests run
        if (config.ingestion.length > 0) {
            logger.info('Waiting for ingestion processor consumer group to be ready...');
            await k8s.waitForIngestionConsumerGroup(
                options.namespace || 'default',
                instanceId,
                options.zenkoName || 'end2end',
                300000,
            );
            logger.info('Ingestion processor consumer group is ready');
        }
    }

    logger.info(`Successfully created ${totalCreated} workflows`);
}
