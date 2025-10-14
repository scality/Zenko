import * as k8s from './utils/k8s';
import { logger } from './utils/logger';
import kafkaTopicsConfig from '../configs/kafka-topics.json';
import { getInstanceId } from './utils/management';
import KubernetesHelper from 'cli-testing/utils/KubernetesHelper';

export interface NotificationOptions {
    namespace: string;
    configFile?: string;
}

export interface TopicInfo {
    name: string;
    partitions: number;
    description: string;
}

interface KafkaConfig {
    hosts: string;
    port: string;
    image: string;
}

interface BackbeatConfig {
    kafka: {
        hosts: string;
    };
    extensions: {
        replication: {
            topic: string;
        };
    };
}

/**
 * Setup notifications
 * @param options - Notification options
 * @returns Promise that resolves when the notifications are setup
 */
export async function setupNotifications(options: NotificationOptions): Promise<void> {
    // Initialize KubernetesHelper
    k8s.initKubernetes();

    const instanceId = await getInstanceId();
    if (!instanceId) {
        throw new Error('instance ID is required for notification setup. Ensure UUID environment variable is set or Zenko CR exists');
    }

    const namespace = options.namespace || 'default';

    // Check if backbeat config secret exists before proceeding
    await checkBackbeatConfigAvailability(namespace, instanceId);

    const kafkaConfig = await getKafkaConfig(namespace);
    const uuid = await getUUIDFromBackbeat(namespace, instanceId);
    await applyNotificationDestinations(namespace, kafkaConfig.hosts, kafkaConfig.port);
    await createKafkaTopics(kafkaConfig, uuid, namespace);
}

/**
 * Get all topic names that would be created for a given UUID.
 * This function can be used by test suites to get the exact topic names.
 * @param uuid - UUID
 * @returns Topic info
 */
export function getTopicNames(uuid: string): TopicInfo[] {
    const topics: TopicInfo[] = [];

    // Add notification topics
    for (const notifTopic of kafkaTopicsConfig.notificationTopics) {
        const topicName = process.env[notifTopic.envVar] || notifTopic.default;
        topics.push({
            name: topicName,
            partitions: notifTopic.partitions,
            description: notifTopic.description
        });
    }

    // Add Azure archive topics with UUID prefix
    for (const azureTopic of kafkaTopicsConfig.azureArchiveTopics) {
        topics.push({
            name: `${uuid}.${azureTopic.suffix}`,
            partitions: azureTopic.partitions,
            description: azureTopic.description
        });
    }

    return topics;
}

/**
 * Get environment variables mapping for notification topics.
 * This can be used by test suites to set up the right environment variables.
 * @returns Topic environment variables
 */
export function getTopicEnvVars(): Record<string, string> {
    const envVars: Record<string, string> = {};

    // Only notification topic environment variables (which have actual envVar definitions)
    for (const notifTopic of kafkaTopicsConfig.notificationTopics) {
        const topicName = process.env[notifTopic.envVar] || notifTopic.default;
        envVars[notifTopic.envVar] = topicName;
    }

    return envVars;
}

/**
 * Check if backbeat config is available
 * @param namespace - Namespace
 * @param instanceId - Instance ID
 * @returns Promise that resolves when the backbeat config is available
 */
async function checkBackbeatConfigAvailability(namespace: string, instanceId: string): Promise<void> {
    const zenkoName = process.env.ZENKO_NAME || 'end2end';

    // Use enhanced utility to get secrets by labels
    const secrets = await KubernetesHelper.getSecretsByLabels(
        namespace,
        `app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=${zenkoName}`
    );

    if (!secrets.length) {
        throw new Error(`No backbeat config secret found with Zenko name ${zenkoName} (instanceId: ${instanceId}) in namespace ${namespace}`);
    }
}

/**
 * Get Kafka configuration from backbeat config
 * @param namespace - Namespace
 * @returns Kafka configuration
 */
async function getKafkaConfig(namespace: string): Promise<KafkaConfig> {
    logger.info('Getting Kafka configuration from backbeat config');

    const instanceId = await getInstanceId();
    const zenkoName = process.env.ZENKO_NAME || 'end2end';

    // Use enhanced utility to get secrets by labels
    const secrets = await KubernetesHelper.getSecretsByLabels(
        namespace,
        `app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=${zenkoName}`
    );

    if (!secrets.length) {
        throw new Error(`No backbeat config secret found with Zenko name ${zenkoName} (instanceId: ${instanceId}) in namespace ${namespace}`);
    }

    logger.debug('Attempting to read config.json from secret', { secretName: secrets[0].metadata?.name });
    const configJson = KubernetesHelper.getSecretData(secrets[0], 'config.json');
    logger.debug('Raw config JSON from secret', { configJson: configJson.substring(0, 200) + '...' });

    const config: BackbeatConfig = JSON.parse(configJson);

    const kafkaHosts = config.kafka.hosts.replace(/"/g, '');
    const [host, port] = kafkaHosts.split(':');

    // Get Kafka image details from environment variables or use fallback from deps.yaml
    const kafkaImage = process.env.KAFKA_IMAGE && process.env.KAFKA_TAG
        ? `${process.env.KAFKA_IMAGE}:${process.env.KAFKA_TAG}`
        : 'ghcr.io/scality/zenko/kafka:2.13-3.1.2'; // Fallback matching deps.yaml

    logger.debug('Kafka configuration retrieved', { host, port, image: kafkaImage });

    return {
        hosts: kafkaHosts,
        port,
        image: kafkaImage
    };
}

/**
 * Get UUID from backbeat config
 * @param namespace - Namespace
 * @param instanceId - Instance ID
 * @returns UUID
 */
async function getUUIDFromBackbeat(namespace: string, instanceId: string): Promise<string> {
    logger.info('Getting UUID from backbeat config');

    const zenkoName = process.env.ZENKO_NAME || 'end2end';

    // Use enhanced utility to get secrets by labels
    const secrets = await KubernetesHelper.getSecretsByLabels(
        namespace,
        `app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=${zenkoName}`
    );

    if (!secrets.length) {
        throw new Error(`No backbeat config secret found with Zenko name ${zenkoName} (instanceId: ${instanceId}) in namespace ${namespace}`);
    }

    // Use enhanced utility to get decoded secret data
    const configJson = KubernetesHelper.getSecretData(secrets[0], 'config.json');
    const config: BackbeatConfig = JSON.parse(configJson);

    // Extract UUID from replication topic
    let uuid = config.extensions.replication.topic.replace(/"/g, ''); // Remove quotes
    logger.debug('UUID before processing', { rawUuid: uuid });

    // Remove extension (.cold-status, etc.) and leading quote
    const dotIndex = uuid.indexOf('.');
    if (dotIndex > 0) {
        uuid = uuid.substring(0, dotIndex);
    }

    // Remove leading quote if present
    if (uuid.startsWith('"')) {
        uuid = uuid.substring(1);
    }

    logger.info('UUID extracted from backbeat config', { uuid, originalTopic: config.extensions.replication.topic });
    return uuid;
}

/**
 * Apply notification destinations configuration
 * @param namespace - Namespace
 * @param kafkaHost - Kafka host
 * @param kafkaPort - Kafka port
 * @returns Promise that resolves when the notification destinations are applied
 */
async function applyNotificationDestinations(namespace: string, kafkaHost: string, kafkaPort: string): Promise<void> {
    logger.debug('Applying notification destinations configuration');

    // Get topic names from environment or use defaults from config
    const notifDestTopic = process.env[kafkaTopicsConfig.notificationTopics[0].envVar] || kafkaTopicsConfig.notificationTopics[0].default;
    const notifAltDestTopic = process.env[kafkaTopicsConfig.notificationTopics[1].envVar] || kafkaTopicsConfig.notificationTopics[1].default;

    // Create ZenkoNotificationTarget resources (the correct CRD that actually exists)
    const zenkoName = process.env.ZENKO_NAME || 'end2end';
    const [kafkaHostOnly, kafkaPortOnly] = kafkaHost.split(':');

    const primaryNotificationTarget = {
        apiVersion: 'zenko.io/v1alpha2',
        kind: 'ZenkoNotificationTarget',
        metadata: {
            name: 'kafka-destination',
            namespace,
            labels: {
                'app.kubernetes.io/instance': zenkoName
            }
        },
        spec: {
            type: 'kafka',
            host: kafkaHostOnly,
            port: parseInt(kafkaPortOnly || kafkaPort, 10),
            destinationTopic: notifDestTopic
        }
    };

    const altNotificationTarget = {
        apiVersion: 'zenko.io/v1alpha2',
        kind: 'ZenkoNotificationTarget',
        metadata: {
            name: 'kafka-alt-destination',
            namespace,
            labels: {
                'app.kubernetes.io/instance': zenkoName
            }
        },
        spec: {
            type: 'kafka',
            host: kafkaHostOnly,
            port: parseInt(kafkaPortOnly || kafkaPort, 10),
            destinationTopic: notifAltDestTopic
        }
    };

    try {
        const group = 'zenko.io';
        const version = 'v1alpha2';
        const plural = 'zenkonotificationtargets';

        await KubernetesHelper.applyCustomResource(primaryNotificationTarget, namespace, group, version, plural);
        await KubernetesHelper.applyCustomResource(altNotificationTarget, namespace, group, version, plural);

        logger.info('Notification destinations applied successfully');
    } catch (error) {
        logger.error('Failed to apply notification destinations', { error });
        throw error;
    }
}

/**
 * Create Kafka topics
 * @param kafkaConfig - Kafka configuration
 * @param uuid - UUID
 * @param namespace - Namespace
 * @returns Promise that resolves when the Kafka topics are created
 */
async function createKafkaTopics(kafkaConfig: KafkaConfig, uuid: string, namespace: string): Promise<void> {
    logger.debug('Creating Kafka topics');

    // Build topic list from configuration
    const topics: Array<{ name: string, partitions: number }> = [];

    // Add notification topics
    for (const notifTopic of kafkaTopicsConfig.notificationTopics) {
        const topicName = process.env[notifTopic.envVar] || notifTopic.default;
        topics.push({ name: topicName, partitions: notifTopic.partitions });
    }

    // Add Azure archive topics with UUID prefix
    for (const azureTopic of kafkaTopicsConfig.azureArchiveTopics) {
        topics.push({
            name: `${uuid}.${azureTopic.suffix}`,
            partitions: azureTopic.partitions
        });
    }

    // Create topic commands
    const topicCommands = topics.map(topic => {
        return `kafka-topics.sh --create --topic ${topic.name} --partitions ${topic.partitions} --bootstrap-server ${kafkaConfig.hosts} --if-not-exists`;
    }).join(' && ');

    logger.debug('Creating Kafka topics', { topics: topics.map(t => ({ name: t.name, partitions: t.partitions })) });

    const kafkaTopicsJob = {
        apiVersion: 'batch/v1',
        kind: 'Job',
        metadata: {
            name: 'kafka-topics-setup',
            namespace
        },
        spec: {
            template: {
                spec: {
                    containers: [{
                        name: 'kafka-topics',
                        image: kafkaConfig.image,
                        command: ['bash', '-c'],
                        args: [topicCommands]
                    }],
                    restartPolicy: 'Never'
                }
            },
            backoffLimit: 3,
            ttlSecondsAfterFinished: 100
        }
    };

    logger.info('Creating Kafka topics job...');
    await KubernetesHelper.createJobAndWaitForCompletion(kafkaTopicsJob, namespace, 5 * 60 * 1000);

    logger.info('Kafka topics created successfully');
}
