import Werelogs from 'werelogs';
import { BeforeAll } from '@cucumber/cucumber';
import { CacheHelper } from 'cli-testing';
import lockFile from 'proper-lockfile';
import * as fs from 'fs';
import {
    KubeConfig,
    CoreV1Api,
    CustomObjectsApi,
    AppsV1Api,
    RbacAuthorizationV1Api,
    V1Pod,
    V1Service,
    V1ClusterRoleBinding,
} from '@kubernetes/client-node';
import Zenko, { ZenkoWorldParameters } from 'world/Zenko';
import { getZenkoCR, waitForDeploymentRollout, waitForZenkoToStabilize } from 'steps/utils/kubernetes';

type AdminCredentials = {
    AdminAccessKey: string;
    AdminSecretKey: string;
    AccountAccessKey: string;
    AccountSecretKey: string;
};

type PRACredentials = {
    DRAdminAccessKey?: string;
    DRAdminSecretKey?: string;
    DRSubdomain?: string;
};

type ServiceUserCredentials = {
    accessKey: string;
    secretKey: string;
};

type ZenkoInstanceInfo = {
    TimeProgressionFactor: number;
    InstanceID?: string;
    KafkaCleanerInterval?: string;
    SorbetdRestoreTimeout?: string;
    UtilizationServiceHost?: string;
};

const logger = new Werelogs.Logger('CTST').newRequestLogger();

const SETUP_COMPLETED_FILE = '/tmp/ctst-setup-completed';
const SETUP_TIMEOUT = 60_000;

function initializeKubernetesClients() {
    const kc = new KubeConfig();
    kc.loadFromDefault();

    return {
        coreClient: kc.makeApiClient(CoreV1Api),
        customObjectClient: kc.makeApiClient(CustomObjectsApi),
        appsClient: kc.makeApiClient(AppsV1Api),
        rbacClient: kc.makeApiClient(RbacAuthorizationV1Api),
    };
}

/**
 * Thread-safe setup coordinator using file locks
 * Ensures only one worker performs setup while others wait
 */
async function coordinateSetup(parameters: ZenkoWorldParameters): Promise<void> {
    const workerId = `worker-${process.pid}`;

    if (!fs.existsSync(SETUP_COMPLETED_FILE)) {
        fs.writeFileSync(SETUP_COMPLETED_FILE, JSON.stringify({
            ready: false,
        }));
    }

    let releaseLock: (() => Promise<void>) | null = null;
    try {
        releaseLock = await lockFile.lock(SETUP_COMPLETED_FILE, {
            stale: SETUP_TIMEOUT,
            retries: {
                retries: 5,
                factor: 3,
                minTimeout: 1000,
                maxTimeout: 5000,
            }
        });

        const setupData = JSON.parse(fs.readFileSync(SETUP_COMPLETED_FILE, 'utf8'));
        if (setupData.ready) {
            logger.info(`${workerId} found setup already completed by ${setupData.completedBy || 'unknown'}`);
            await extractAndCacheParameters(parameters);
        } else {
            logger.info(`${workerId} performing CTST cluster setup...`);
            await setupClusterConfiguration(parameters);
            logger.info(`${workerId} setup configuration completed, writing completion file...`);
            fs.writeFileSync(SETUP_COMPLETED_FILE, JSON.stringify({
                ready: true,
                completedBy: workerId,
                completedAt: new Date().toISOString(),
                pid: process.pid
            }));
            logger.info(`${workerId} extracting and caching parameters...`);
            await extractAndCacheParameters(parameters);
            logger.info(`CTST cluster setup completed by ${workerId}`);
        }
    } catch (error) {
        // Only handle lock-related errors with fallback behavior
        if ((error as { code?: string }).code === 'ELOCKED') {
            logger.warn(`${workerId} could not acquire lock, waiting
                for setup completion`, { error: (error as { message?: string }).message });
            
            // Poll for completion since another worker is doing the setup
            let attempts = 0;
            const maxAttempts = 450; // Wait up to 15 minutes (10min stabilization + 5min buffer)
            const pollInterval = 2000; // 2 seconds
            
            while (attempts < maxAttempts) {
                try {
                    const setupData = JSON.parse(fs.readFileSync(SETUP_COMPLETED_FILE, 'utf8'));
                    if (setupData.ready) {
                        logger.info(`${workerId} detected setup completion by ${setupData.completedBy},
                            proceeding with parameter extraction`);
                        await extractAndCacheParameters(parameters);
                        return;
                    }
                } catch (readError) {
                    logger.info(`${workerId} could not read setup file, retrying...`, { readError });
                }
                
                attempts++;
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
            
            // If we've waited long enough, try to proceed anyway
            logger.error(`${workerId} timed out waiting for setup completion,
                attempting parameter extraction anyway`);
            try {
                await extractAndCacheParameters(parameters);
                return;
            } catch (fallbackError) {
                logger.error(`${workerId} fallback parameter extraction also failed`, { fallbackError });
                throw new Error(`Setup coordination failed: could not acquire lock
                    and fallback failed. Original lock error: ${(error as { message?: string }).message}`);
            }
        } else {
            // For non-lock errors (actual setup failures), re-throw immediately
            logger.error(`${workerId} setup failed with non-lock error`, { error });
            throw error;
        }
    } finally {
        if (releaseLock) {
            await releaseLock();
        }
    }
}

/**
 * Extract admin credentials from environment or Kubernetes
 */
async function extractAdminCredentials(coreClient: CoreV1Api, parameters: ZenkoWorldParameters):
    Promise<AdminCredentials> {
    let adminAccessKey = parameters.AdminAccessKey;
    let adminSecretKey = parameters.AdminSecretKey;

    if (!adminAccessKey || !adminSecretKey) {
        const adminSecret = await coreClient
            .readNamespacedSecret('end2end-management-vault-admin-creds.v1', parameters.Namespace);
        adminAccessKey = Buffer.from(adminSecret.body.data?.accessKey || '', 'base64').toString();
        adminSecretKey = Buffer.from(adminSecret.body.data?.secretKey || '', 'base64').toString();
    }

    const finalAdminAccessKey = adminAccessKey || parameters.AdminAccessKey || 'admin';
    const finalAdminSecretKey = adminSecretKey || parameters.AdminSecretKey || 'password';

    logger.info('Extracted admin credentials', {
        finalAdminAccessKey,
        finalAdminSecretKey,
    });
    return {
        AdminAccessKey: finalAdminAccessKey,
        AdminSecretKey: finalAdminSecretKey,
        AccountAccessKey: parameters.AccountAccessKey || finalAdminAccessKey,
        AccountSecretKey: parameters.AccountSecretKey || finalAdminSecretKey,
    };
}

/**
 * Extract PRA admin credentials from environment or Kubernetes
 * Only attempts to fetch PRA credentials if DR subdomain is configured and PRA secret exists
 */
async function extractPRACredentials(coreClient: CoreV1Api, parameters: ZenkoWorldParameters): Promise<PRACredentials> {
    let praAdminAccessKey = parameters.DRAdminAccessKey;
    let praAdminSecretKey = parameters.DRAdminSecretKey;

    if (parameters.DRSubdomain) {
        // Check if PRA secret exists and extract credentials in one call
        try {
            const praAdminSecret = await coreClient
                .readNamespacedSecret('end2end-pra-management-vault-admin-creds.v1', parameters.Namespace);
            
            praAdminAccessKey = Buffer.from(praAdminSecret.body.data?.accessKey || '', 'base64').toString();
            praAdminSecretKey = Buffer.from(praAdminSecret.body.data?.secretKey || '', 'base64').toString();
            logger.info('PRA credentials extracted from Kubernetes secret');
        } catch (error) {
            if ((error as { response?: { statusCode?: number } }).response?.statusCode === 404) {
                logger.info('PRA secret not found, no PRA setup detected - skipping PRA credential extraction');
                // PRA is not set up, skip entirely and use parameters/defaults
            } else {
                logger.warn('Error reading PRA secret, skipping PRA credential extraction', {
                    error: (error as { message?: string }).message,
                });
            }
        }
    } else {
        logger.info('DRSubdomain not configured, skipping PRA credential extraction');
    }

    logger.info('Extracted PRA credentials', {
        praAdminAccessKey,
        praAdminSecretKey,
    });

    return {
        DRAdminAccessKey: praAdminAccessKey || parameters.DRAdminAccessKey,
        DRAdminSecretKey: praAdminSecretKey || parameters.DRAdminSecretKey,
        DRSubdomain: parameters.DRSubdomain,
    };
}

/**
 * Extract service user credentials from Kubernetes
 */
async function extractServiceCredentials(coreClient: CoreV1Api, parameters: ZenkoWorldParameters) {
    if (parameters.ServiceUsersCredentials) {
        return { accessKey: parameters.ServiceUsersCredentials, secretKey: parameters.ServiceUsersCredentials };
    }

    const serviceUserSecrets = await Promise.allSettled([
        coreClient.listNamespacedSecret(parameters.Namespace, undefined, undefined, undefined, undefined,
            'app.kubernetes.io/name=backbeat-lcbp-user-creds,app.kubernetes.io/instance=end2end'),
        coreClient.listNamespacedSecret(parameters.Namespace, undefined, undefined, undefined, undefined,
            'app.kubernetes.io/name=backbeat-lcc-user-creds,app.kubernetes.io/instance=end2end'),
        coreClient.listNamespacedSecret(parameters.Namespace, undefined, undefined, undefined, undefined,
            'app.kubernetes.io/name=backbeat-lcop-user-creds,app.kubernetes.io/instance=end2end'),
        coreClient.listNamespacedSecret(parameters.Namespace, undefined, undefined, undefined, undefined,
            'app.kubernetes.io/name=backbeat-qp-user-creds,app.kubernetes.io/instance=end2end'),
        coreClient.listNamespacedSecret(parameters.Namespace, undefined, undefined, undefined, undefined,
            'app.kubernetes.io/name=sorbet-fwd-creds,app.kubernetes.io/instance=end2end'),
    ]);

    const credentials: Record<string, ServiceUserCredentials> = {};

    const serviceCredentialHandlers = [
        { index: 0, key: 'backbeat-lifecycle-bp-1.json', name: 'backbeat-lifecycle-bp-1' },
        { index: 1, key: 'backbeat-lifecycle-conductor-1.json', name: 'backbeat-lifecycle-conductor-1' },
        { index: 2, key: 'backbeat-lifecycle-op-1.json', name: 'backbeat-lifecycle-op-1' },
        { index: 3, key: 'backbeat-qp-1.json', name: 'backbeat-qp-1' },
    ];

    serviceCredentialHandlers.forEach(({ index, key, name }) => {
        if (serviceUserSecrets[index].status === 'fulfilled' && serviceUserSecrets[index].value.body.items.length > 0) {
            const data =
                Buffer.from(serviceUserSecrets[index].value.body.items[0].data?.[key] || '', 'base64').toString();
            credentials[name] = JSON.parse(data) as ServiceUserCredentials;
        }
    });

    if (serviceUserSecrets[4].status === 'fulfilled' && serviceUserSecrets[4].value.body.items.length > 0) {
        const sorbetAccessKey =
            Buffer.from(serviceUserSecrets[4].value.body.items[0].data?.accessKey || '', 'base64').toString();
        const sorbetSecretKey =
            Buffer.from(serviceUserSecrets[4].value.body.items[0].data?.secretKey || '', 'base64').toString();
        credentials['sorbet-fwd-2'] = {
            accessKey: sorbetAccessKey,
            secretKey: sorbetSecretKey,
        };
    }

    logger.info('Extracted service user credentials', {
        credentials,
    });

    return credentials;
}

/**
 * Extract Kafka configuration from Kubernetes secrets
 */
async function extractKafkaConfiguration(coreClient: CoreV1Api, parameters: ZenkoWorldParameters) {
    let kafkaHosts = parameters.KafkaHosts;
    let kafkaDeadLetterTopic = parameters.KafkaDeadLetterQueueTopic;
    let kafkaObjectTaskTopic = parameters.KafkaObjectTaskTopic;
    let kafkaGCRequestTopic = parameters.KafkaGCRequestTopic;
    let backbeatApiHost = parameters.BackbeatApiHost;
    let backbeatApiPort = parameters.BackbeatApiPort;

    const configExtractionTasks = [];

    if (!kafkaHosts || !backbeatApiHost) {
        configExtractionTasks.push(
            coreClient.listNamespacedSecret(
                parameters.Namespace, undefined, undefined, undefined, undefined,
                'app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=end2end'
            ).then(backbeatConfigSecrets => {
                if (backbeatConfigSecrets.body.items.length > 0) {
                    const configData = Buffer.from(
                        backbeatConfigSecrets.body.items[0].data?.['config.json'] || '',
                        'base64',
                    ).toString();
                    const config = JSON.parse(configData);
                    kafkaHosts = kafkaHosts || config.kafka?.hosts || '';
                }
            })
        );

        configExtractionTasks.push(
            coreClient.listNamespacedSecret(
                parameters.Namespace, undefined, undefined, undefined, undefined,
                'app.kubernetes.io/name=connector-cloudserver-config,app.kubernetes.io/instance=end2end'
            ).then(cloudserverConfigSecrets => {
                if (cloudserverConfigSecrets.body.items.length > 0) {
                    const cloudserverConfigData = Buffer.from(
                        cloudserverConfigSecrets.body.items[0].data?.['config.json'] || '',
                        'base64',
                    ).toString();
                    const cloudserverConfig = JSON.parse(cloudserverConfigData);
                    backbeatApiHost = backbeatApiHost || cloudserverConfig.backbeat?.host?.replace(/"/g, '') || '';
                    backbeatApiPort = backbeatApiPort || cloudserverConfig.backbeat?.port || '';
                }
            })
        );
    }

    if (!kafkaDeadLetterTopic || !kafkaObjectTaskTopic || !kafkaGCRequestTopic) {
        configExtractionTasks.push(
            coreClient.listNamespacedSecret(
                parameters.Namespace, undefined, undefined, undefined, undefined,
                'app.kubernetes.io/name=cold-sorbet-config-e2e-azure-archive,app.kubernetes.io/instance=end2end'
            ).then(sorbetConfigSecrets => {
                if (sorbetConfigSecrets.body.items.length > 0) {
                    const sorbetConfigData =
                        Buffer.from(sorbetConfigSecrets.body.items[0].data?.['config.json'] || '', 'base64').toString();
                    const sorbetConfig = JSON.parse(sorbetConfigData);
                    kafkaDeadLetterTopic = kafkaDeadLetterTopic || sorbetConfig['kafka-dead-letter-topic'] || '';
                    kafkaObjectTaskTopic = kafkaObjectTaskTopic || sorbetConfig['kafka-object-task-topic'] || '';
                    kafkaGCRequestTopic = kafkaGCRequestTopic || sorbetConfig['kafka-gc-request-topic'] || '';
                }
            })
        );
    }

    await Promise.allSettled(configExtractionTasks);

    logger.info('Extracted Kafka configuration', {
        kafkaHosts,
        kafkaDeadLetterTopic,
        kafkaObjectTaskTopic,
        kafkaGCRequestTopic,
        backbeatApiHost,
        backbeatApiPort,
    });

    return {
        KafkaHosts: kafkaHosts || 'kafka.default.svc.cluster.local:9092',
        KafkaDeadLetterQueueTopic: kafkaDeadLetterTopic,
        KafkaObjectTaskTopic: kafkaObjectTaskTopic,
        KafkaGCRequestTopic: kafkaGCRequestTopic,
        BackbeatApiHost: backbeatApiHost,
        BackbeatApiPort: backbeatApiPort,
    };
}

/**
 * Extract Zenko Custom Resource information
 */
async function extractZenkoCRInfo(parameters: ZenkoWorldParameters): Promise<ZenkoInstanceInfo> {
    let timeProgressionFactor = parameters.TimeProgressionFactor;
    let instanceId = parameters.InstanceID;
    let kafkaCleanerInterval = parameters.KafkaCleanerInterval;
    let sorbetdRestoreTimeout = parameters.SorbetdRestoreTimeout;
    let utilizationServiceHost = parameters.UtilizationServiceHost;

    if (!instanceId || !timeProgressionFactor) {
        // Zenko world is not yet created in global hooks.
        const zenkoBody = await getZenkoCR({
            parameters,
            logger,
        } as Zenko, parameters.Namespace, 'end2end');

        if (zenkoBody) {
            timeProgressionFactor = timeProgressionFactor ||
                parseInt(zenkoBody.metadata?.annotations?.['zenko.io/time-progression-factor'] || '1', 10);
            instanceId = instanceId || zenkoBody.status?.instanceID || '';
            kafkaCleanerInterval = kafkaCleanerInterval || zenkoBody.spec?.kafkaCleaner?.interval || '';
            sorbetdRestoreTimeout = sorbetdRestoreTimeout ||
                zenkoBody.spec?.sorbet?.server?.azure?.restoreTimeout || '';
            utilizationServiceHost = utilizationServiceHost || zenkoBody.spec?.scuba?.api?.ingress?.hostname || '';
        }
    }

    logger.info('Extracted Zenko Custom Resource information', {
        timeProgressionFactor,
        instanceId,
        kafkaCleanerInterval,
        sorbetdRestoreTimeout,
        utilizationServiceHost,
    });

    return {
        TimeProgressionFactor: timeProgressionFactor || 1,
        InstanceID: instanceId,
        KafkaCleanerInterval: kafkaCleanerInterval,
        SorbetdRestoreTimeout: sorbetdRestoreTimeout,
        UtilizationServiceHost: utilizationServiceHost,
    };
}

/**
 * Setup cluster configuration (done only by first worker who gets the lock)
 */
async function setupClusterConfiguration(parameters: ZenkoWorldParameters): Promise<void> {
    logger.info('Configuring Kubernetes cluster for CTST...');

    const { coreClient, customObjectClient, appsClient, rbacClient } = initializeKubernetesClients();

    const setupTasks = [
        setupClusterRBAC(rbacClient),
        setupKafkaTopics(coreClient, parameters),
        setupMockServices(coreClient, parameters),
        setupNotificationTargets(customObjectClient, parameters),
        applyDeploymentModifications(appsClient, parameters),
    ];

    await Promise.allSettled(setupTasks);

    // Setup storage locations after infrastructure is ready
    logger.info('Infrastructure setup completed, creating storage locations...');
    await setupStorageLocations();

    logger.info('Setup tasks completed, waiting for Zenko to stabilize (up to 10 minutes)...');
    
    // Wait for Zenko deployment to stabilize with proper timeout
    const stabilizationTimeout = 10 * 60 * 1000; // 10 minutes
    const stabilizationPromise = waitForZenkoToStabilize({ parameters, logger } as Zenko, true);
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Zenko stabilization timed out after 10 minutes')), stabilizationTimeout);
    });
    
    try {
        await Promise.race([stabilizationPromise, timeoutPromise]);
        logger.info('Zenko stabilization completed successfully');
    } catch (error) {
        logger.error('Zenko stabilization failed or timed out', { error });
        throw error; // Let the setup fail if stabilization fails
    }
}

/**
 * Extract and cache parameters from the configured cluster (done by all workers)
 */
async function extractAndCacheParameters(parameters: ZenkoWorldParameters): Promise<void> {
    const { coreClient } = initializeKubernetesClients();

    const [adminCreds, praCreds, serviceCredentials, kafkaConfig, zenkoInfo] = await Promise.all([
        extractAdminCredentials(coreClient, parameters),
        extractPRACredentials(coreClient, parameters),
        extractServiceCredentials(coreClient, parameters),
        extractKafkaConfiguration(coreClient, parameters),
        extractZenkoCRInfo(parameters),
    ]);

    const setupParameters = {
        ...parameters,
        ...adminCreds,
        ...praCreds,
        ...serviceCredentials,
        ...kafkaConfig,
        ...zenkoInfo,
        AccountName: Zenko.ACCOUNT_NAME,
        ssl: Zenko.SSL_ENABLED,
        port: Zenko.PORT,
        VaultAuthHost: parameters.VaultAuthHost || 'end2end-connector-vault-auth-api.default.svc.cluster.local',
        UtilizationServicePort: parameters.UtilizationServicePort || '80',
        NotificationDestination: parameters.NotificationDestination || 'ctst-notif-dest',
        NotificationDestinationTopic: parameters.NotificationDestinationTopic || 'ctst-notif-topic',
        NotificationDestinationAlt: parameters.NotificationDestinationAlt || 'ctst-notif-dest-alt',
        NotificationDestinationTopicAlt: parameters.NotificationDestinationTopicAlt || 'ctst-notif-topic-alt',
        KafkaExternalIps: parameters.KafkaExternalIps || '',
        PrometheusService: parameters.PrometheusService || 'prometheus-operated.default.svc.cluster.local',
        StorageManagerUsername: parameters.StorageManagerUsername || 'ctst_storage_manager',
        StorageAccountOwnerUsername: parameters.StorageAccountOwnerUsername || 'ctst_storage_account_owner',
        DataConsumerUsername: parameters.DataConsumerUsername || 'ctst_data_consumer',
        DataAccessorUsername: parameters.DataAccessorUsername || 'ctst_data_accessor',
        AzureArchiveAccessTier: parameters.AzureArchiveAccessTier || 'Hot',
        AzureArchiveManifestTier: parameters.AzureArchiveManifestTier || 'Hot',

        KeycloakUsername: parameters.KeycloakUsername || 'testuser',
        KeycloakPassword: parameters.KeycloakPassword || 'testpass',
        KeycloakPort: parameters.KeycloakPort || '80',
        KeycloakGrantType: parameters.KeycloakGrantType || 'password',
        KeycloakHost: parameters.KeycloakHost || 'keycloak.zenko.local',
        KeycloakRealm: parameters.KeycloakRealm || 'zenko',
        KeycloakClientId: parameters.KeycloakClientId || 'zenko-ui',

        AzureAccountName: parameters.AzureAccountName || 'devstoreaccount1',
        AzureAccountKey: parameters.AzureAccountKey ||
            'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==',
        AzureArchiveContainer: parameters.AzureArchiveContainer || 'archive-container',
        AzureArchiveContainer2: parameters.AzureArchiveContainer2 || 'archive-container-2',
        AzureArchiveQueue: parameters.AzureArchiveQueue || 'archive-queue',

        subdomain: parameters.subdomain || 'zenko.local',
    };

    CacheHelper.cacheParameters(setupParameters);

    logger.info('CTST parameters extracted and cached');
}

/**
 * Setup Kafka topics
 */
async function setupKafkaTopics(coreClient: CoreV1Api, parameters: ZenkoWorldParameters): Promise<void> {
    const kafkaConfig = await extractKafkaConfiguration(coreClient, parameters);
    if (!kafkaConfig.KafkaHosts) {
        logger.info('Kafka hosts not found, skipping Kafka topics setup');
        return;
    }

    // Extract UUID from backbeat config like the old script
    let uuid = parameters.Namespace;
    try {
        const backbeatConfigSecrets = await coreClient.listNamespacedSecret(
            parameters.Namespace, undefined, undefined, undefined, undefined,
            'app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=end2end'
        );
        if (backbeatConfigSecrets.body.items.length > 0) {
            const configData = Buffer.from(
                backbeatConfigSecrets.body.items[0].data?.['config.json'] || '',
                'base64',
            ).toString();
            const config = JSON.parse(configData);
            const replicationTopic = config.extensions?.replication?.topic;
            if (replicationTopic) {
                // Extract UUID from topic like "uuid.backbeat-replication"
                uuid = replicationTopic.split('.')[0];
            }
        }
    } catch (error) {
        logger.info('Failed to extract UUID from backbeat config, using namespace', { error });
    }

    const topics = [
        parameters.NotificationDestinationTopic || 'ctst-notif-topic',
        parameters.NotificationDestinationTopicAlt || 'ctst-notif-topic-alt',
        `${uuid}.cold-status-e2e-azure-archive`,
        `${uuid}.cold-status-e2e-azure-archive-2-non-versioned`,
        `${uuid}.cold-status-e2e-azure-archive-2-versioned`,
        `${uuid}.cold-status-e2e-azure-archive-2-suspended`,
    ];

    const topicCommands = topics.map(topic =>
        // eslint-disable-next-line max-len
        `kafka-topics.sh --create --topic ${topic} --partitions 10 --bootstrap-server ${kafkaConfig.KafkaHosts} --if-not-exists`
    ).join(' ; ');

    const kafkaTopicsPod: V1Pod = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
            name: `kafka-topics-setup-${Date.now()}`,
            namespace: parameters.Namespace,
        },
        spec: {
            restartPolicy: 'Never',
            containers: [
                {
                    name: 'kafka-topics',
                    image: 'confluentinc/cp-kafka:latest',
                    command: ['bash'],
                    args: ['-c', topicCommands],
                },
            ],
        },
    };

    await coreClient.createNamespacedPod(parameters.Namespace, kafkaTopicsPod);
    logger.info('Kafka topics setup initiated', {
        kafkaTopicsPod,
    });
}

/**
 * Setup mock services
 */
async function setupMockServices(coreClient: CoreV1Api, parameters: ZenkoWorldParameters): Promise<void> {
    const existingPods = await coreClient.listNamespacedPod(
        parameters.Namespace, undefined, undefined, undefined, undefined, 'component=mock'
    );

    if (existingPods.body.items.length > 0) {
        logger.info('Mock services already deployed', {
            existingPods,
        });
        return;
    }

    const azureMockService: V1Service = {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
            name: 'azure-mock',
            namespace: parameters.Namespace,
        },
        spec: {
            selector: { name: 'azure-mock' },
            type: 'ClusterIP',
            ports: [
                { name: 'blob', port: 80, targetPort: 'blob' },
                { name: 'queue', port: 81, targetPort: 'queue' },
            ],
        },
    };

    const azureMockPod: V1Pod = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
            name: 'azure-mock-pod',
            namespace: parameters.Namespace,
            labels: { name: 'azure-mock', component: 'mock' },
        },
        spec: {
            hostname: 'devstoreaccount1',
            subdomain: 'azure-mock',
            containers: [
                {
                    name: 'azurite',
                    image: 'mcr.microsoft.com/azure-storage/azurite:3.35.0',
                    command: [
                        'azurite', '-l', '/data',
                        '--blobHost', '0.0.0.0', '--blobPort', '80',
                        '--queueHost', '0.0.0.0', '--queuePort', '81',
                    ],
                    ports: [
                        { name: 'blob', containerPort: 80 },
                        { name: 'queue', containerPort: 81 },
                    ],
                },
            ],
        },
    };

    await Promise.allSettled([
        coreClient.createNamespacedService(parameters.Namespace, azureMockService),
        coreClient.createNamespacedPod(parameters.Namespace, azureMockPod),
    ]);

    logger.info('Mock services deployment initiated', {
        azureMockService,
        azureMockPod,
    });
}

/**
 * Setup notification targets
 */
async function setupNotificationTargets(customObjectClient: CustomObjectsApi, parameters: ZenkoWorldParameters) {
    const { coreClient } = initializeKubernetesClients();
    const kafkaConfig = await extractKafkaConfiguration(coreClient, parameters);
    if (!kafkaConfig.KafkaHosts) {
        return;
    }

    const [kafkaHost, kafkaPort] = kafkaConfig.KafkaHosts.split(':');

    const targets = [
        { 
            name: parameters.NotificationDestination || 'ctst-notif-dest', 
            topic: parameters.NotificationDestinationTopic || 'ctst-notif-topic' 
        },
        { 
            name: parameters.NotificationDestinationAlt || 'ctst-notif-dest-alt', 
            topic: parameters.NotificationDestinationTopicAlt || 'ctst-notif-topic-alt' 
        },
    ];

    for (const target of targets) {
        const notificationTarget = {
            apiVersion: 'zenko.io/v1alpha2',
            kind: 'ZenkoNotificationTarget',
            metadata: {
                name: target.name,
                namespace: parameters.Namespace,
                labels: { 'app.kubernetes.io/instance': 'end2end' },
            },
            spec: {
                type: 'kafka',
                host: kafkaHost,
                port: parseInt(kafkaPort || '9092', 10),
                destinationTopic: target.topic,
            },
        };

        await customObjectClient.createNamespacedCustomObject(
            'zenko.io', 'v1alpha2', parameters.Namespace, 'zenkonotificationtargets', notificationTarget
        ).catch(err => {
            if (err.response?.statusCode !== 409) {
                throw err;
            }
        });
    }

    logger.info('Notification targets configured', {
        targets,
    });
}

/**
 * Apply deployment modifications
 */
async function applyDeploymentModifications(appsClient: AppsV1Api, parameters: ZenkoWorldParameters): Promise<void> {
    const deploymentName = 'end2end-connector-cloudserver';

    const deployment = await appsClient.readNamespacedDeployment(deploymentName, parameters.Namespace);

    const containers = deployment.body.spec?.template?.spec?.containers || [];
    const cloudserverContainer = containers.find(c => c.name === 'cloudserver');

    if (!cloudserverContainer) {
        throw new Error(`CloudServer container not found in deployment ${deploymentName}`);
    }

    if (!cloudserverContainer.env) {
        cloudserverContainer.env = [];
    }

    // We need to set the healthcheck frequency to 100 to speed up the testing of quota-related features.
    const existingEnvIndex = cloudserverContainer.env.findIndex(e => e.name === 'SCUBA_HEALTHCHECK_FREQUENCY');
    if (existingEnvIndex >= 0) {
        cloudserverContainer.env[existingEnvIndex].value = '100';
    } else {
        cloudserverContainer.env.push({
            name: 'SCUBA_HEALTHCHECK_FREQUENCY',
            value: '100',
        });
    }

    await appsClient.patchNamespacedDeployment(
        deploymentName,
        parameters.Namespace,
        deployment.body,
        undefined, undefined, undefined, undefined, undefined,
        { headers: { 'Content-Type': 'application/merge-patch+json' } }
    );

    await waitForDeploymentRollout(appsClient, deploymentName, parameters.Namespace);

    logger.info('Deployment modifications applied', {
        deploymentName,
        parameters,
    });
}

/**
 * Setup storage locations - placeholder for future implementation
 * TODO: Implement proper location creation via Management API with Keycloak auth
 */
async function setupStorageLocations(): Promise<void> {
    logger.info('Storage location setup placeholder - locations will be created by individual tests');
    // For now, let individual tests create their own locations as they do currently
    // This can be enhanced later to create common locations during setup
}

/**
 * Setup cluster RBAC (cluster-admin binding for service accounts)
 */
async function setupClusterRBAC(rbacClient: RbacAuthorizationV1Api): Promise<void> {
    const clusterRoleBinding: V1ClusterRoleBinding = {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'ClusterRoleBinding',
        metadata: {
            name: 'serviceaccounts-cluster-admin',
        },
        roleRef: {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'ClusterRole',
            name: 'cluster-admin',
        },
        subjects: [
            {
                apiGroup: 'rbac.authorization.k8s.io',
                kind: 'Group',
                name: 'system:serviceaccounts',
            },
        ],
    };

    try {
        await rbacClient.createClusterRoleBinding(clusterRoleBinding);
        logger.info('Cluster RBAC binding created successfully');
    } catch (error) {
        if ((error as { response?: { statusCode: number } }).response?.statusCode === 409) {
            logger.info('Cluster RBAC binding already exists');
        } else {
            logger.error('Failed to create cluster RBAC binding', { error });
            throw error;
        }
    }
}

BeforeAll({ timeout: 15 * 60 * 1000 }, async function () {
    await coordinateSetup(this.parameters as ZenkoWorldParameters);
    // print the final parameters
    logger.info('Final parameters:', { parameters: this.parameters, cachedParameters: CacheHelper.parameters });
});
