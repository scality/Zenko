import * as k8s from './utils/k8s';
import { logger } from './utils/logger';
import notificationDestinationsConfig from '../configs/notification-destinations.json';
import { getInstanceId } from './utils/management';
import { resolveEnvValues } from './utils/resource-creation';
import KubernetesHelper from 'cli-testing/utils/KubernetesHelper';

export interface NotificationOptions {
    namespace: string;
    configFile?: string;
    zenkoName: string;
}

interface BackbeatConfig {
    kafka: {
        hosts: string;
    };
}

/**
 * Setup notification destinations (ZenkoNotificationTarget CRs)
 * This creates Kafka-based notification targets that can be used for bucket/object notifications.
 * 
 * Note: This does NOT create Kafka topics. Use kafka-topics.ts for that.
 * 
 * @param options - Notification options
 * @returns Promise that resolves when notification destinations are configured
 */
export async function setupNotifications(options: NotificationOptions): Promise<void> {
    logger.info('Setting up notification destinations');
    k8s.initKubernetes();

    const instanceId = await getInstanceId(options.zenkoName, options.namespace);
    if (!instanceId) {
        throw new Error('Instance ID is required for notification setup. Ensure UUID environment variable is set or Zenko CR exists');
    }

    const namespace = options.namespace || 'default';

    await checkBackbeatConfigAvailability(namespace, instanceId, options.zenkoName);

    const kafkaHosts = await getKafkaHosts(namespace, options.zenkoName);
    const [host, port] = kafkaHosts.split(':');

    const createdCount = await applyNotificationDestinations(namespace, options.zenkoName, host, port);

    if (createdCount > 0) {
        logger.info('Waiting for Zenko operator to reconcile notification destinations...');
        const { waitForZenkoToStabilize } = await import('./utils/zenko-status');
        await waitForZenkoToStabilize({
            namespace,
            zenkoName: options.zenkoName,
            timeout: 25 * 60 * 1000,
            waitForReconciliationToStart: true,
        });
    } else {
        logger.info('No new notification destinations created, skipping reconciliation wait');
    }
}

/**
 * Check if backbeat config is available
 */
async function checkBackbeatConfigAvailability(namespace: string, instanceId: string, zenkoName: string): Promise<void> {
    const secrets = await KubernetesHelper.getSecretsByLabels(
        namespace,
        `app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=${zenkoName}`
    );

    if (!secrets.length) {
        throw new Error(`No backbeat config secret found with Zenko name ${zenkoName} (instanceId: ${instanceId}) in namespace ${namespace}`);
    }
}

/**
 * Get Kafka hosts from backbeat config
 */
async function getKafkaHosts(namespace: string, zenkoName: string): Promise<string> {
    logger.info('Getting Kafka hosts from backbeat config');

    const instanceId = await getInstanceId(zenkoName, namespace);
    const secrets = await KubernetesHelper.getSecretsByLabels(
        namespace,
        `app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=${zenkoName}`
    );

    if (!secrets.length) {
        throw new Error(`No backbeat config secret found with Zenko name ${zenkoName} (instanceId: ${instanceId}) in namespace ${namespace}`);
    }

    const configJson = KubernetesHelper.getSecretData(secrets[0], 'config.json');
    const config: BackbeatConfig = JSON.parse(configJson);

    const kafkaHosts = config.kafka.hosts.replace(/"/g, '');
    logger.debug('Kafka hosts retrieved', { kafkaHosts });

    return kafkaHosts;
}

/**
 * Apply notification destinations configuration
 * @returns Number of destinations that were actually created (not skipped)
 */
async function applyNotificationDestinations(namespace: string, zenkoName: string, kafkaHost: string, kafkaPort: string): Promise<number> {
    logger.debug('Applying notification destinations configuration');

    const group = 'zenko.io';
    const version = 'v1alpha2';
    const plural = 'zenkonotificationtargets';
    let createdCount = 0;

    try {
        for (const destination of notificationDestinationsConfig.destinations) {
            const destinationName = resolveEnvValues(destination.name);
            const destinationTopic = resolveEnvValues(destination.topic);

            const notificationTarget = {
                apiVersion: 'zenko.io/v1alpha2',
                kind: 'ZenkoNotificationTarget',
                metadata: {
                    name: destinationName,
                    namespace,
                    labels: {
                        'app.kubernetes.io/instance': zenkoName
                    }
                },
                spec: {
                    type: 'kafka',
                    host: kafkaHost,
                    port: parseInt(kafkaPort, 10),
                    destinationTopic: destinationTopic
                }
            };

            logger.debug('Applying notification destination', { name: destinationName, topic: destinationTopic });
            try {
                await KubernetesHelper.applyCustomResource(notificationTarget, namespace, group, version, plural);
                createdCount++;
            } catch (error: any) {
                if (error.code === 409) {
                    logger.debug(`Notification destination ${destinationName} already exists, skipping`);
                } else {
                    throw error;
                }
            }
        }

        logger.info('Notification destinations applied successfully', {
            total: notificationDestinationsConfig.destinations.length,
            created: createdCount,
            skipped: notificationDestinationsConfig.destinations.length - createdCount
        });

        return createdCount;
    } catch (error) {
        logger.error('Failed to apply notification destinations', { error });
        throw error;
    }
}
