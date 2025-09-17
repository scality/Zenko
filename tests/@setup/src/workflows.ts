import { logger } from './utils/logger';
import {
    createIngestionWorkflow,
    createLifecycleWorkflow,
    createReplicationWorkflow,
    getInstanceId,
    getManagementEndpoint,
    getManagementToken,
} from './utils/management';
import config from '../configs/workflows.json';
import { LifecycleWorkflow, WorkflowsOptions } from './utils/types';

export async function setupWorkflows(options: WorkflowsOptions): Promise<void> {
    logger.info('Setting up workflows via Management API');

    const managementEndpoint = await getManagementEndpoint();
    const authToken = await getManagementToken();

    const instanceId = options.instanceId || await getInstanceId();

    if (!instanceId) {
        throw new Error('Instance ID is required for workflow creation. Either provide --instance-id or ensure Zenko CR exists');
    }

    let totalCreated = 0;

    if (!options.workflowType || options.workflowType === 'replication') {
        for (const workflow of config.replication) {
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
        for (const workflow of config.lifecycle) {
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
        for (const workflow of config.ingestion) {
            try {
                await createIngestionWorkflow(managementEndpoint, authToken, instanceId, workflow);
                logger.info(`Created ingestion workflow: ${workflow.name}`);
                totalCreated++;
            } catch (error) {
                logger.error(`Failed to create ingestion workflow ${workflow.name}: ${error instanceof Error ? error.message : String(error)}`);
                throw error;
            }
        }
    }

    logger.info(`Successfully created ${totalCreated} workflows`);
}
