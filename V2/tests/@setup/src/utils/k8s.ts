import KubernetesHelper from 'cli-testing/utils/KubernetesHelper';
import { logger } from './logger';
import { execSync } from 'child_process';

let initialized = false;

export function initKubernetes(): void {
    if (initialized) {
        return;
    }

    KubernetesHelper.logger = logger;
    KubernetesHelper.init({});
    initialized = true;
}

/**
 * Wait for a Kubernetes resource's resourceVersion to change
 * Useful to ensure the operator has updated a resource
 * @param namespace - Namespace
 * @param resourceType - Resource type
 * @param labelSelector - Label selector
 * @param initialVersion - Initial version
 * @param timeout - Timeout
 */
export async function waitForResourceVersionChange(
    namespace: string,
    resourceType: 'secret' | 'configmap' | 'deployment',
    labelSelector: string,
    initialVersion: string | undefined,
    timeout: number = 60000
): Promise<string> {
    initKubernetes();

    const startTime = Date.now();
    const pollInterval = 2000;

    while (Date.now() - startTime < timeout) {
        try {
            const currentVersion = await getResourceVersion(resourceType, namespace, labelSelector);

            if (currentVersion && currentVersion !== initialVersion) {
                logger.info(`Resource version changed: ${resourceType}`, {
                    labelSelector,
                    oldVersion: initialVersion,
                    newVersion: currentVersion
                });
                return currentVersion;
            }
        } catch (error: any) {
            logger.debug(`Checking resource version: ${error.message}`, { error });
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(
        `Timeout waiting for ${resourceType} version to change. ` +
        `LabelSelector: ${labelSelector}, InitialVersion: ${initialVersion}`
    );
}

async function getResourceVersion(
    resourceType: string,
    namespace: string,
    labelSelector: string
): Promise<string | undefined> {
    if (resourceType === 'secret') {
        const secrets = await KubernetesHelper.getSecretsByLabels(namespace, labelSelector);
        if (!secrets || secrets.length === 0) {
            throw new Error(`Secret not found: ${labelSelector}`);
        }
        return secrets[0]?.metadata?.resourceVersion;
    }

    if (resourceType === 'configmap') {
        const core = KubernetesHelper.getClientCore();
        if (!core) {
            throw new Error('KubernetesHelper not initialized');
        }
        const configMaps = await core.listNamespacedConfigMap({ namespace, labelSelector });
        if (!configMaps.items || configMaps.items.length === 0) {
            throw new Error(`ConfigMap not found: ${labelSelector}`);
        }
        return configMaps.items[0]?.metadata?.resourceVersion;
    }

    if (resourceType === 'deployment') {
        const apps = KubernetesHelper.getClientAppsV1();
        if (!apps) {
            throw new Error('KubernetesHelper not initialized');
        }
        const deployments = await apps.listNamespacedDeployment({ namespace, labelSelector });
        if (!deployments.items || deployments.items.length === 0) {
            throw new Error(`Deployment not found: ${labelSelector}`);
        }
        return deployments.items[0]?.metadata?.resourceVersion;
    }

    throw new Error(`Unknown resource type: ${resourceType}`);
}

/**
 * Get deployment generation (observable generation from status)
 * @param namespace - Namespace
 * @param deploymentName - Deployment name
 * @returns Deployment observed generation
 */
export async function getDeploymentGeneration(namespace: string, deploymentName: string): Promise<number | undefined> {
    initKubernetes();

    const client = KubernetesHelper.getClientAppsV1();
    if (!client) {
        throw new Error('KubernetesHelper not initialized');
    }

    const deployment = await client.readNamespacedDeployment({ name: deploymentName, namespace });

    return deployment.status?.observedGeneration;
}

/**
 * Wait for deployment to restart with new generation
 * @param namespace - Namespace
 * @param deploymentName - Deployment name
 * @param initialGeneration - Initial generation
 * @param timeout - Timeout
 */
export async function waitForDeploymentRestart(
    namespace: string,
    deploymentName: string,
    initialGeneration: number | undefined,
    timeout: number = 5 * 60 * 1000
): Promise<void> {
    initKubernetes();

    const client = KubernetesHelper.getClientAppsV1();
    if (!client) {
        throw new Error('KubernetesHelper not initialized');
    }

    const startTime = Date.now();
    const pollInterval = 2000;

    logger.info('Waiting for deployment to restart with new configuration', {
        deployment: deploymentName,
        initialGeneration,
    });

    while (Date.now() - startTime < timeout) {
        const deployment = await client.readNamespacedDeployment({ name: deploymentName, namespace });
        const currentGeneration = deployment.status?.observedGeneration;

        if (currentGeneration !== undefined && currentGeneration > (initialGeneration || 0)) {
            logger.info('Deployment generation changed', {
                deployment: deploymentName,
                previousGeneration: initialGeneration,
                currentGeneration,
            });

            // Now wait for deployment to be ready with new generation
            await KubernetesHelper.waitForDeployment(deploymentName, namespace, timeout - (Date.now() - startTime));
            return;
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Timeout waiting for deployment ${deploymentName} to restart (${timeout}ms)`);
}

/**
 * Wait for data services to stabilize after configuration changes
 * @param namespace - Namespace
 * @param timeout - Timeout
 */
export async function waitForDataServicesToStabilize(
    namespace: string,
    timeout: number = 15 * 60 * 1000
): Promise<void> {
    initKubernetes();

    const client = KubernetesHelper.getClientAppsV1();
    if (!client) {
        throw new Error('KubernetesHelper not initialized');
    }

    // Find deployments that depend on config changes
    const annotationKey = 'operator.zenko.io/dependencies';
    const dataServices = ['connector-cloudserver-config', 'backbeat-config'];

    const deploymentsResponse = await client.listNamespacedDeployment({ namespace });
    const deployments = deploymentsResponse.items.filter(deployment => {
        const annotations = deployment.metadata?.annotations;
        return annotations && dataServices.some(service =>
            annotations[annotationKey]?.includes(service)
        );
    });

    if (deployments.length === 0) {
        logger.warn('No data service deployments found');
        return;
    }

    // Wait for each deployment to be ready
    for (const deployment of deployments) {
        const name = deployment.metadata?.name;
        if (name) {
            await KubernetesHelper.waitForDeployment(name, namespace, timeout);
        }
    }

    logger.info('All data service deployments are stable');
}

/**
 * Wait for deployment to be ready (generic)
 * @param deploymentName - Deployment name
 * @param namespace - Namespace
 * @param zenkoName - Zenko name (for constructing deployment name)
 * @param timeout - Timeout
 */
export async function waitForDeploymentReady(
    deploymentName: string,
    namespace: string,
    timeout: number = 120000
): Promise<void> {
    initKubernetes();

    try {
        await KubernetesHelper.waitForDeployment(deploymentName, namespace, timeout);
        logger.info(`Deployment ready: ${deploymentName}`);
    } catch (error) {
        logger.warn(`Deployment not found or not ready: ${deploymentName}`, { error });
        throw error;
    }
}

/**
 * Wait for ingestion consumer group to be stable in Kafka
 * @param namespace - Namespace
 * @param instanceId - Instance ID
 * @param zenkoName - Zenko name
 * @param timeout - Timeout
 */
export async function waitForIngestionConsumerGroup(
    namespace: string,
    instanceId: string,
    zenkoName: string,
    timeout: number = 300000
): Promise<void> {
    initKubernetes();

    const consumerGroup = `${instanceId}.backbeat-ingestion-group`;
    const deploymentName = `${zenkoName}-backbeat-ingestion-processor`;

    // Detect Kafka broker pod
    const kafkaPodName = await detectKafkaBrokerPod(namespace, zenkoName);

    // Get expected replica count
    const expectedReplicas = await getDeploymentReplicas(namespace, deploymentName);
    if (expectedReplicas === 0) {
        logger.warn('Ingestion processor has 0 replicas, skipping consumer group wait');
        return;
    }

    logger.info('Waiting for consumer group to be stable', {
        consumerGroup,
        expectedReplicas,
        kafkaPod: kafkaPodName
    });

    const startTime = Date.now();
    const pollInterval = 5000;
    let attemptCount = 0;

    while (Date.now() - startTime < timeout) {
        attemptCount++;

        try {
            const { state, memberCount } = await getConsumerGroupStatus(
                namespace,
                kafkaPodName,
                consumerGroup
            );

            logger.info(`Consumer group status (attempt ${attemptCount})`, {
                consumerGroup,
                state: state || 'NOT_FOUND',
                memberCount,
                expectedReplicas,
                isReady: state === 'Stable' && memberCount >= expectedReplicas
            });

            if (state === 'Stable' && memberCount >= expectedReplicas) {
                logger.info('✓ Consumer group is stable', {
                    consumerGroup,
                    memberCount,
                    attempts: attemptCount
                });
                return;
            }
        } catch (error: any) {
            const errorMsg = error.message || String(error);
            const stderr = error.stderr?.toString() || '';

            // Consumer group doesn't exist yet - expected during bootstrap
            if (errorMsg.includes('does not exist') || stderr.includes('does not exist')) {
                logger.debug(`Consumer group not yet created (attempt ${attemptCount})`);
            } else {
                logger.warn(`Error checking consumer group (attempt ${attemptCount}): ${errorMsg}`);
            }
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(
        'Timeout waiting for consumer group to be stable. ' +
        `Group: ${consumerGroup}, Attempts: ${attemptCount}`
    );
}

/**
 * Detect Kafka broker pod
 * @param namespace - Namespace
 * @param zenkoName - Zenko name
 * @returns Kafka broker pod name
 */
async function detectKafkaBrokerPod(namespace: string, zenkoName: string): Promise<string> {
    const defaultPodName = `${zenkoName}-base-queue-0`;

    try {
        const core = KubernetesHelper.getClientCore();
        if (!core) {
            return defaultPodName;
        }

        const labelSelector = `brokerId=0,kafka_cr=${zenkoName}-base-queue,app=kafka`;
        const pods = await core.listNamespacedPod({ namespace, labelSelector });
        const detected = pods.items.find(p => p.metadata?.name);

        if (detected?.metadata?.name) {
            logger.info(`Detected Kafka broker pod: ${detected.metadata.name}`);
            return detected.metadata.name;
        }
    } catch (error) {
        logger.debug(`Failed to detect Kafka broker pod, using default: ${defaultPodName}`, { error });
    }

    return defaultPodName;
}

/**
 * Get deployment replicas
 * @param namespace - Namespace
 * @param deploymentName - Deployment name
 * @returns Deployment replicas
 */
async function getDeploymentReplicas(namespace: string, deploymentName: string): Promise<number> {
    const client = KubernetesHelper.getClientAppsV1();
    if (!client) {
        throw new Error('KubernetesHelper not initialized');
    }

    const deployment = await client.readNamespacedDeployment({ name: deploymentName, namespace });
    return deployment.spec?.replicas || 1;
}

/**
 * Get consumer group status
 * @param namespace - Namespace
 * @param kafkaPodName - Kafka pod name
 * @param consumerGroup - Consumer group
 * @returns Consumer group status
 */
async function getConsumerGroupStatus(
    namespace: string,
    kafkaPodName: string,
    consumerGroup: string
): Promise<{ state: string; memberCount: number }> {
    const kubeconfig = process.env.KUBECONFIG || '';
    const kubeconfigArg = kubeconfig ? `--kubeconfig=${kubeconfig} ` : '';
    const command = `kubectl ${kubeconfigArg}exec -n ${namespace} ${kafkaPodName} -- ` +
        'bash -lc \'export KAFKA_OPTS="" && kafka-consumer-groups.sh --bootstrap-server ' +
        `localhost:9092 --describe --group ${consumerGroup} --state'`;

    const output = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });

    // Parse output: GROUP COORDINATOR(ID) ASSIGNMENT-STRATEGY STATE #MEMBERS
    const lines = output.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
        // Skip header
        if (line.includes('GROUP') && line.includes('COORDINATOR')) {
            continue;
        }

        // Find consumer group line
        if (line.trim().startsWith(consumerGroup)) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 5) {
                const stateIndex = parts.findIndex(p =>
                    p === 'Stable' || p === 'Empty' || p === 'PreparingRebalance'
                );
                if (stateIndex !== -1) {
                    const state = parts[stateIndex];
                    const memberCount = parseInt(parts[parts.length - 1], 10) || 0;
                    return { state, memberCount };
                }
            }
        }
    }

    return { state: '', memberCount: 0 };
}
