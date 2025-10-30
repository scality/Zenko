import * as k8s from './utils/k8s';
import { logger } from './utils/logger';
import kafkaTopicsConfig from '../configs/kafka-topics.json';
import { getInstanceId } from './utils/management';
import { resolveEnvValues } from './utils/resource-creation';
import KubernetesHelper from 'cli-testing/utils/KubernetesHelper';

export interface KafkaTopicsOptions {
    namespace: string;
    zenkoName: string;
}

export interface TopicInfo {
    name: string;
    partitions: number;
    description: string;
    category: 'notification' | 'backbeat' | 'lifecycle';
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
 * Setup Kafka topics for Backbeat operations
 * This includes:
 * - Notification topics (for bucket/object notifications)
 * - Backbeat topics (for replication and data mover)
 * - Lifecycle/Archive topics (for cold storage transitions)
 * 
 * @param options - Kafka topics setup options
 * @returns Promise that resolves when all topics are created
 */
export async function setupKafkaTopics(options: KafkaTopicsOptions): Promise<void> {
    logger.info('Setting up Kafka topics for Backbeat operations');
    k8s.initKubernetes();

    const instanceId = await getInstanceId();
    if (!instanceId) {
        throw new Error('Instance ID is required for Kafka topics setup. Ensure UUID environment variable is set or Zenko CR exists');
    }

    const namespace = options.namespace || 'default';

    // Check if backbeat config secret exists before proceeding
    await checkBackbeatConfigAvailability(namespace, instanceId, options.zenkoName);

    const kafkaConfig = await getKafkaConfig(namespace, options.zenkoName);
    const uuid = await getUUIDFromBackbeat(namespace, instanceId, options.zenkoName);
    
    await createAllKafkaTopics(kafkaConfig, uuid, namespace);
}

/**
 * Get all topic names that would be created for a given UUID.
 * Useful for tests and verification.
 * @param uuid - Zenko instance UUID
 * @returns Array of topic information
 */
export function getAllTopicNames(uuid: string): TopicInfo[] {
    const topics: TopicInfo[] = [];

    // Notification topics (no UUID prefix)
    for (const notifTopic of kafkaTopicsConfig.notificationTopics) {
        const topicName = resolveEnvValues(notifTopic.name);
        topics.push({
            name: topicName,
            partitions: notifTopic.partitions,
            description: notifTopic.description,
            category: 'notification'
        });
    }

    // Backbeat topics (replication and data mover) - with UUID prefix
    if ('backbeatTopics' in kafkaTopicsConfig && Array.isArray(kafkaTopicsConfig.backbeatTopics)) {
        for (const backbeatTopic of kafkaTopicsConfig.backbeatTopics) {
            topics.push({
                name: `${uuid}.${backbeatTopic.suffix}`,
                partitions: backbeatTopic.partitions,
                description: backbeatTopic.description,
                category: 'backbeat'
            });
        }
    }

    // Lifecycle/Archive topics (Azure cold storage) - with UUID prefix
    if ('lifecycleTopics' in kafkaTopicsConfig && Array.isArray(kafkaTopicsConfig.lifecycleTopics)) {
        for (const lifecycleTopic of kafkaTopicsConfig.lifecycleTopics) {
            topics.push({
                name: `${uuid}.${lifecycleTopic.suffix}`,
                partitions: lifecycleTopic.partitions,
                description: lifecycleTopic.description,
                category: 'lifecycle'
            });
        }
    }

    return topics;
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
 * Get Kafka configuration from backbeat config secret
 */
async function getKafkaConfig(namespace: string, zenkoName: string): Promise<KafkaConfig> {
    logger.info('Getting Kafka configuration from backbeat config');

    const instanceId = await getInstanceId();
    const secrets = await KubernetesHelper.getSecretsByLabels(
        namespace,
        `app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=${zenkoName}`
    );

    if (!secrets.length) {
        throw new Error(`No backbeat config secret found with Zenko name ${zenkoName} (instanceId: ${instanceId}) in namespace ${namespace}`);
    }

    logger.debug('Attempting to read config.json from secret', { secretName: secrets[0].metadata?.name });
    const configJson = KubernetesHelper.getSecretData(secrets[0], 'config.json');
    const config: BackbeatConfig = JSON.parse(configJson);

    const kafkaHosts = config.kafka.hosts.replace(/"/g, '');
    const [host, port] = kafkaHosts.split(':');

    // Get Kafka image from environment or use fallback
    const kafkaImage = process.env.KAFKA_IMAGE && process.env.KAFKA_TAG
        ? `${process.env.KAFKA_IMAGE}:${process.env.KAFKA_TAG}`
        : 'ghcr.io/scality/zenko/kafka:2.13-3.1.2';

    logger.debug('Kafka configuration retrieved', { host, port, image: kafkaImage });

    return {
        hosts: kafkaHosts,
        port,
        image: kafkaImage
    };
}

/**
 * Extract UUID from backbeat config
 */
async function getUUIDFromBackbeat(namespace: string, instanceId: string, zenkoName: string): Promise<string> {
    logger.info('Getting UUID from backbeat config');

    const secrets = await KubernetesHelper.getSecretsByLabels(
        namespace,
        `app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=${zenkoName}`
    );

    if (!secrets.length) {
        throw new Error(`No backbeat config secret found with Zenko name ${zenkoName} (instanceId: ${instanceId}) in namespace ${namespace}`);
    }

    const configJson = KubernetesHelper.getSecretData(secrets[0], 'config.json');
    const config: BackbeatConfig = JSON.parse(configJson);

    // Extract UUID from replication topic
    let uuid = config.extensions.replication.topic.replace(/"/g, '');
    logger.debug('UUID before processing', { rawUuid: uuid });

    // Remove extension suffix and leading quote
    const dotIndex = uuid.indexOf('.');
    if (dotIndex > 0) {
        uuid = uuid.substring(0, dotIndex);
    }
    if (uuid.startsWith('"')) {
        uuid = uuid.substring(1);
    }

    logger.info('UUID extracted from backbeat config', { uuid });
    return uuid;
}

/**
 * Create all Kafka topics required for Zenko operations
 */
async function createAllKafkaTopics(kafkaConfig: KafkaConfig, uuid: string, namespace: string): Promise<void> {
    logger.info('Creating Kafka topics for all Zenko operations');

    const topics: Array<{ name: string, partitions: number, category: string }> = [];

    // 1. Notification topics (no UUID prefix)
    logger.debug('Adding notification topics');
    for (const notifTopic of kafkaTopicsConfig.notificationTopics) {
        const topicName = resolveEnvValues(notifTopic.name);
        topics.push({ 
            name: topicName, 
            partitions: notifTopic.partitions,
            category: 'notification'
        });
    }

    // 2. Backbeat topics (replication and data mover) - with UUID prefix
    logger.debug('Adding backbeat topics for replication and transitions');
    if ('backbeatTopics' in kafkaTopicsConfig && Array.isArray(kafkaTopicsConfig.backbeatTopics)) {
        for (const backbeatTopic of kafkaTopicsConfig.backbeatTopics) {
            topics.push({
                name: `${uuid}.${backbeatTopic.suffix}`,
                partitions: backbeatTopic.partitions,
                category: 'backbeat'
            });
        }
    }

    // 3. Lifecycle topics (cold storage / archive) - with UUID prefix
    logger.debug('Adding lifecycle topics for cold storage');
    if ('lifecycleTopics' in kafkaTopicsConfig && Array.isArray(kafkaTopicsConfig.lifecycleTopics)) {
        for (const lifecycleTopic of kafkaTopicsConfig.lifecycleTopics) {
            topics.push({
                name: `${uuid}.${lifecycleTopic.suffix}`,
                partitions: lifecycleTopic.partitions,
                category: 'lifecycle'
            });
        }
    }

    // Create topic commands
    const topicCommands = topics.map(topic => {
        return `kafka-topics.sh --create --topic ${topic.name} --partitions ${topic.partitions} --bootstrap-server ${kafkaConfig.hosts} --if-not-exists`;
    }).join(' && ');

    logger.info('Creating Kafka topics', { 
        totalTopics: topics.length,
        byCategory: {
            notification: topics.filter(t => t.category === 'notification').length,
            backbeat: topics.filter(t => t.category === 'backbeat').length,
            lifecycle: topics.filter(t => t.category === 'lifecycle').length
        }
    });

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
                    env: [
                        {
                            name: 'JAVA_TOOL_OPTIONS',
                            value: 'JAVA_TOOL_OPTIONS=-XX:-UseContainerSupport -Xmx512m -XX:ActiveProcessorCount=1'
                        }
                    ],
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

    logger.info('All Kafka topics created successfully', { topics: topics.map(t => ({ name: t.name, partitions: t.partitions, category: t.category })) });
}

