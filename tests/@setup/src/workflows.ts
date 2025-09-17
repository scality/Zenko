import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';
import { getManagementEndpoint, getManagementToken } from './utils/management';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export interface ReplicationWorkflow {
    name: string;
    sourceBucket: string;
    sourceLocation: string;
    targetBucket: string;
    targetLocation: string;
    enabled: boolean;
    description?: string;
}

export interface LifecycleRule {
    id: string;
    status: 'Enabled' | 'Disabled';
    filter: {
        prefix?: string;
        tags?: { [key: string]: string };
    };
    transitions?: Array<{
        days: number;
        storageClass: string;
    }>;
    expiration?: {
        days: number;
    };
}

export interface LifecycleWorkflow {
    name: string;
    bucketName: string;
    rules: LifecycleRule[];
}

export interface IngestionWorkflow {
    name: string;
    sourceBucket: string;
    sourceLocation: string;
    targetBucket: string;
    targetLocation: string;
    schedule: string;
    enabled: boolean;
    description?: string;
}

export interface WorkflowsConfig {
    replication: ReplicationWorkflow[];
    lifecycle: LifecycleWorkflow[];
    ingestion: IngestionWorkflow[];
}

export interface WorkflowsOptions {
    namespace: string;
    instanceId?: string;
    configFile?: string;
    workflowType?: 'replication' | 'lifecycle' | 'ingestion';
}

function loadWorkflowsConfig(configFile?: string): WorkflowsConfig {
    const defaultConfigPath = path.join(__dirname, '..', 'configs', 'workflows.json');
    const configPath = configFile ? path.resolve(configFile) : defaultConfigPath;
    
    if (!fs.existsSync(configPath)) {
        throw new Error(`Workflows configuration file not found: ${configPath}`);
    }
    
    try {
        const configData = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(configData) as WorkflowsConfig;
    } catch (error) {
        throw new Error(`Failed to parse workflows configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function setupWorkflows(options: WorkflowsOptions): Promise<void> {
    const k8s = new KubernetesClient();
    const config = loadWorkflowsConfig(options.configFile);
    
    logger.info('Setting up workflows via Management API');

    // Get management API endpoint and credentials
    const managementEndpoint = await getManagementEndpoint(options.namespace);
    const authToken = await getManagementToken();
    
    // Get instance ID from Zenko CR if not provided
    const instanceId = options.instanceId || await getInstanceId(k8s, options);
    
    if (!instanceId) {
        throw new Error('Instance ID is required for workflow creation. Either provide --instance-id or ensure Zenko CR exists');
    }

    let totalCreated = 0;

    // Create replication workflows
    if (!options.workflowType || options.workflowType === 'replication') {
        for (const workflow of config.replication) {
            try {
                await createReplicationWorkflow(managementEndpoint, authToken, instanceId, workflow, options);
                logger.info(`Created replication workflow: ${workflow.name}`);
                totalCreated++;
            } catch (error) {
                logger.error(`Failed to create replication workflow ${workflow.name}: ${error instanceof Error ? error.message : String(error)}`);
                throw error;
            }
        }
    }

    // Create lifecycle workflows
    if (!options.workflowType || options.workflowType === 'lifecycle') {
        for (const workflow of config.lifecycle) {
            try {
                await createLifecycleWorkflow(managementEndpoint, authToken, instanceId, workflow, options);
                logger.info(`Created lifecycle workflow: ${workflow.name}`);
                totalCreated++;
            } catch (error) {
                logger.error(`Failed to create lifecycle workflow ${workflow.name}: ${error instanceof Error ? error.message : String(error)}`);
                throw error;
            }
        }
    }

    // Create ingestion workflows
    if (!options.workflowType || options.workflowType === 'ingestion') {
        for (const workflow of config.ingestion) {
            try {
                await createIngestionWorkflow(managementEndpoint, authToken, instanceId, workflow, options);
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


async function getInstanceId(k8s: KubernetesClient, options: WorkflowsOptions): Promise<string | null> {
    try {
        // Try to get instance ID from Zenko CR
        const customObjects = k8s.customObjectsApi;
        const zenkoList = await customObjects.listNamespacedCustomObject({
            group: 'zenko.io',
            version: 'v1alpha1',
            namespace: options.namespace,
            plural: 'zenkos',
        });
        
        const zenkos = zenkoList.body as any;
        if (zenkos.items && zenkos.items.length > 0) {
            return zenkos.items[0].spec?.instanceId || zenkos.items[0].metadata?.name;
        }
        
        return null;
    } catch (error) {
        logger.debug(`Failed to retrieve instance ID from Zenko CR: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

async function createReplicationWorkflow(
    managementEndpoint: string,
    authToken: string,
    instanceId: string,
    workflow: ReplicationWorkflow,
    options: WorkflowsOptions
): Promise<void> {

    const workflowPayload = {
        workflowId: workflow.name,
        type: 'replication',
        enabled: workflow.enabled,
        source: {
            bucket: workflow.sourceBucket,
            location: workflow.sourceLocation,
        },
        destination: {
            bucket: workflow.targetBucket,
            location: workflow.targetLocation,
        },
    };

    const response = await axios.post(
        `${managementEndpoint}/api/v1/config/${instanceId}/workflow`,
        workflowPayload,
        {
            headers: {
                'X-Authentication-Token': authToken,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        }
    );

    if (response.status !== 201 && response.status !== 200) {
        throw new Error(`Management API returned status ${response.status}: ${JSON.stringify(response.data)}`);
    }
}

async function createLifecycleWorkflow(
    managementEndpoint: string,
    authToken: string,
    instanceId: string,
    workflow: LifecycleWorkflow,
    options: WorkflowsOptions
): Promise<void> {

    const workflowPayload = {
        workflowId: workflow.name,
        type: 'lifecycle',
        bucketName: workflow.bucketName,
        rules: workflow.rules,
    };

    const response = await axios.post(
        `${managementEndpoint}/api/v1/config/${instanceId}/lifecycle`,
        workflowPayload,
        {
            headers: {
                'X-Authentication-Token': authToken,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        }
    );

    if (response.status !== 201 && response.status !== 200) {
        throw new Error(`Management API returned status ${response.status}: ${JSON.stringify(response.data)}`);
    }
}

async function createIngestionWorkflow(
    managementEndpoint: string,
    authToken: string,
    instanceId: string,
    workflow: IngestionWorkflow,
    options: WorkflowsOptions
): Promise<void> {

    const workflowPayload = {
        workflowId: workflow.name,
        type: 'ingestion',
        enabled: workflow.enabled,
        schedule: workflow.schedule,
        source: {
            bucket: workflow.sourceBucket,
            location: workflow.sourceLocation,
        },
        destination: {
            bucket: workflow.targetBucket,
            location: workflow.targetLocation,
        },
    };

    const response = await axios.post(
        `${managementEndpoint}/api/v1/config/${instanceId}/workflow`,
        workflowPayload,
        {
            headers: {
                'X-Authentication-Token': authToken,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        }
    );

    if (response.status !== 201 && response.status !== 200) {
        throw new Error(`Management API returned status ${response.status}: ${JSON.stringify(response.data)}`);
    }
}