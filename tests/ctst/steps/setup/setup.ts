import Werelogs from 'werelogs';
import { BeforeAll } from '@cucumber/cucumber';
import { CacheHelper, coordinate } from 'cli-testing';
import fs from 'fs';
import path from 'path';
import {
    KubeConfig,
    CoreV1Api,
    CustomObjectsApi,
    AppsV1Api,
    RbacAuthorizationV1Api,
    V1Pod,
    V1Service,
    V1ClusterRoleBinding,
    V1ConfigMap,
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
 * Extract admin credentials from environment or Kubernetes
 */
async function extractAdminCredentials(coreClient: CoreV1Api, parameters: ZenkoWorldParameters):
    Promise<AdminCredentials> {
    let adminAccessKey = parameters.AdminAccessKey;
    let adminSecretKey = parameters.AdminSecretKey;

    if (!adminAccessKey || !adminSecretKey) {
        const adminSecret = await coreClient
            .readNamespacedSecret({
                name: 'end2end-management-vault-admin-creds.v1',
                namespace: parameters.Namespace
            });
        adminAccessKey = Buffer.from(adminSecret.data?.accessKey || '', 'base64').toString();
        adminSecretKey = Buffer.from(adminSecret.data?.secretKey || '', 'base64').toString();
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
        try {
            const praAdminSecret = await coreClient
                .readNamespacedSecret({
                    name: 'end2end-pra-management-vault-admin-creds.v1',
                    namespace: parameters.Namespace
                });
            
            praAdminAccessKey = Buffer.from(praAdminSecret.data?.accessKey || '', 'base64').toString();
            praAdminSecretKey = Buffer.from(praAdminSecret.data?.secretKey || '', 'base64').toString();
            logger.info('PRA credentials extracted from Kubernetes secret');
        } catch (error) {
            if ((error as { response?: { statusCode?: number } }).response?.statusCode === 404) {
                logger.info('PRA secret not found, no PRA setup detected - skipping PRA credential extraction');
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
        coreClient.listNamespacedSecret({
            namespace: parameters.Namespace,
            labelSelector: 'app.kubernetes.io/name=backbeat-lcbp-user-creds,app.kubernetes.io/instance=end2end'
        }),
        coreClient.listNamespacedSecret({
            namespace: parameters.Namespace,
            labelSelector: 'app.kubernetes.io/name=backbeat-lcc-user-creds,app.kubernetes.io/instance=end2end'
        }),
        coreClient.listNamespacedSecret({
            namespace: parameters.Namespace,
            labelSelector: 'app.kubernetes.io/name=backbeat-lcop-user-creds,app.kubernetes.io/instance=end2end'
        }),
        coreClient.listNamespacedSecret({
            namespace: parameters.Namespace,
            labelSelector: 'app.kubernetes.io/name=backbeat-qp-user-creds,app.kubernetes.io/instance=end2end'
        }),
        coreClient.listNamespacedSecret({
            namespace: parameters.Namespace,
            labelSelector: 'app.kubernetes.io/name=sorbet-fwd-creds,app.kubernetes.io/instance=end2end'
        }),
    ]);

    const credentials: Record<string, ServiceUserCredentials> = {};

    const serviceCredentialHandlers = [
        { index: 0, key: 'backbeat-lifecycle-bp-1.json', name: 'backbeat-lifecycle-bp-1' },
        { index: 1, key: 'backbeat-lifecycle-conductor-1.json', name: 'backbeat-lifecycle-conductor-1' },
        { index: 2, key: 'backbeat-lifecycle-op-1.json', name: 'backbeat-lifecycle-op-1' },
        { index: 3, key: 'backbeat-qp-1.json', name: 'backbeat-qp-1' },
    ];

    serviceCredentialHandlers.forEach(({ index, key, name }) => {
        if (serviceUserSecrets[index].status === 'fulfilled' && serviceUserSecrets[index].value.items.length > 0) {
            const data =
                Buffer.from(serviceUserSecrets[index].value.items[0].data?.[key] || '', 'base64').toString();
            credentials[name] = JSON.parse(data) as ServiceUserCredentials;
        }
    });

    if (serviceUserSecrets[4].status === 'fulfilled' && serviceUserSecrets[4].value.items.length > 0) {
        const sorbetAccessKey =
            Buffer.from(serviceUserSecrets[4].value.items[0].data?.accessKey || '', 'base64').toString();
        const sorbetSecretKey =
            Buffer.from(serviceUserSecrets[4].value.items[0].data?.secretKey || '', 'base64').toString();
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
            coreClient.listNamespacedSecret({
                namespace: parameters.Namespace,
                labelSelector: 'app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=end2end'
            }).then(backbeatConfigSecrets => {
                if (backbeatConfigSecrets.items.length > 0) {
                    const configData = Buffer.from(
                        backbeatConfigSecrets.items[0].data?.['config.json'] || '',
                        'base64',
                    ).toString();
                    const config = JSON.parse(configData);
                    kafkaHosts = kafkaHosts || config.kafka?.hosts || '';
                }
            })
        );

        configExtractionTasks.push(
            coreClient.listNamespacedSecret({
                namespace: parameters.Namespace,
                labelSelector: 'app.kubernetes.io/name=connector-cloudserver-config,app.kubernetes.io/instance=end2end'
            }).then(cloudserverConfigSecrets => {
                if (cloudserverConfigSecrets.items.length > 0) {
                    const cloudserverConfigData = Buffer.from(
                        cloudserverConfigSecrets.items[0].data?.['config.json'] || '',
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
            coreClient.listNamespacedSecret({
                namespace: parameters.Namespace,
                // eslint-disable-next-line max-len
                labelSelector: 'app.kubernetes.io/name=cold-sorbet-config-e2e-azure-archive,app.kubernetes.io/instance=end2end'
            }).then(sorbetConfigSecrets => {
                if (sorbetConfigSecrets.items.length > 0) {
                    const sorbetConfigData =
                        Buffer.from(sorbetConfigSecrets.items[0].data?.['config.json'] || '', 'base64').toString();
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
        setupStorageLocations(parameters),
    ];

    await Promise.allSettled(setupTasks);

    logger.info('Setup tasks completed, waiting for Zenko to stabilize (up to 10 minutes)...');

    await waitForZenkoToStabilize({ parameters, logger } as Zenko, true, 10 * 60 * 1000, parameters.Namespace);
    
    logger.info('Zenko stabilization completed successfully');
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
        const backbeatConfigSecrets = await coreClient.listNamespacedSecret({
            namespace: parameters.Namespace,
            labelSelector: 'app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=end2end'
        });
        if (backbeatConfigSecrets.items.length > 0) {
            const configData = Buffer.from(
                backbeatConfigSecrets.items[0].data?.['config.json'] || '',
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

    await coreClient.createNamespacedPod({ namespace: parameters.Namespace, body: kafkaTopicsPod });
    logger.info('Kafka topics setup initiated', {
        kafkaTopicsPod,
    });
}

/**
 * Create AWS mock configmap with metadata
 */
async function createAwsMockConfigMap(coreClient: CoreV1Api, parameters: ZenkoWorldParameters): Promise<void> {
    try {
        // Try to find the tar.gz file in possible locations:
        // Docker container path (from GitHub workflow copy) is prioritized
        const possiblePaths = [
            '/ctst/mock-metadata.tar.gz', // Docker container location
            path.join(__dirname, '../../../..', '.github/scripts/mocks/aws/mock-metadata.tar.gz'),
            path.join(process.cwd(), '.github/scripts/mocks/aws/mock-metadata.tar.gz'),
        ];

        let tarGzPath: string | null = null;
        for (const tarPath of possiblePaths) {
            if (fs.existsSync(tarPath)) {
                tarGzPath = tarPath;
                break;
            }
        }

        if (!tarGzPath) {
            throw new Error(`AWS mock metadata file not found. Searched paths: ${possiblePaths.join(', ')}`);
        }

        // Read the tar.gz file and create configmap with it
        const tarGzContent = fs.readFileSync(tarGzPath);
        const configMapData = {
            'mock-metadata.tar.gz': tarGzContent.toString('base64'),
        };
        logger.info('Using mock-metadata.tar.gz file', { tarGzPath });

        const awsMockConfigMap: V1ConfigMap = {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
                name: 'aws-mock',
                namespace: parameters.Namespace,
            },
            binaryData: configMapData,
        };

        await coreClient.createNamespacedConfigMap({ namespace: parameters.Namespace, body: awsMockConfigMap });
        logger.info('AWS mock configmap created successfully');
    } catch (error) {
        if ((error as { response?: { statusCode: number } }).response?.statusCode === 409) {
            logger.info('AWS mock configmap already exists');
        } else {
            logger.error('Failed to create AWS mock configmap', { error });
            throw error;
        }
    }
}

/**
 * Setup mock services
 */
async function setupMockServices(coreClient: CoreV1Api, parameters: ZenkoWorldParameters): Promise<void> {
    const existingPods = await coreClient.listNamespacedPod({
        namespace: parameters.Namespace,
        labelSelector: 'component=mock'
    });

    if (existingPods.items.length > 0) {
        logger.info('Mock services already deployed', {
            existingPods,
        });
        return;
    }

    await createAwsMockConfigMap(coreClient, parameters);

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

    const awsMockService: V1Service = {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
            name: 'aws-mock',
            namespace: parameters.Namespace,
        },
        spec: {
            selector: { name: 'aws-mock' },
            type: 'ClusterIP',
            ports: [
                { name: 'http', port: 80, targetPort: 'http' },
            ],
        },
    };

    const awsMockPod: V1Pod = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
            name: 'aws-mock-pod',
            namespace: parameters.Namespace,
            labels: { name: 'aws-mock', component: 'mock' },
        },
        spec: {
            initContainers: [
                {
                    name: 'setup',
                    image: 'zenko/cloudserver:latest',
                    imagePullPolicy: 'Always',
                    command: ['tar', '-xvf', '/static-config/mock-metadata.tar.gz', '-C', '/usr/src/app'],
                    volumeMounts: [
                        {
                            name: 'configmap',
                            mountPath: '/static-config',
                        },
                        {
                            name: 'metadata',
                            mountPath: '/usr/src/app/localMetadata',
                        },
                    ],
                },
            ],
            containers: [
                {
                    name: 'aws-mock',
                    image: 'zenko/cloudserver:latest',
                    ports: [
                        { name: 'http', containerPort: 8000 },
                    ],
                    env: [
                        { name: 'LOG_LEVEL', value: 'trace' },
                        { name: 'REMOTE_MANAGEMENT_DISABLE', value: '1' },
                        { name: 'ENDPOINT', value: 'aws-mock.zenko.local' },
                        { name: 'S3BACKEND', value: 'file' },
                    ],
                    volumeMounts: [
                        {
                            name: 'metadata',
                            mountPath: '/usr/src/app/localMetadata',
                        },
                    ],
                    resources: {
                        limits: { cpu: '1', memory: '2Gi' },
                        requests: { cpu: '1', memory: '2Gi' },
                    },
                },
            ],
            volumes: [
                {
                    name: 'metadata',
                    emptyDir: {},
                },
                {
                    name: 'configmap',
                    configMap: {
                        name: 'aws-mock',
                    },
                },
            ],
        },
    };

    await Promise.allSettled([
        coreClient.createNamespacedService({ namespace: parameters.Namespace, body: azureMockService }),
        coreClient.createNamespacedPod({ namespace: parameters.Namespace, body: azureMockPod }),
        coreClient.createNamespacedService({ namespace: parameters.Namespace, body: awsMockService }),
        coreClient.createNamespacedPod({ namespace: parameters.Namespace, body: awsMockPod }),
    ]);

    logger.info('Mock services deployment initiated', {
        azureMockService,
        azureMockPod,
        awsMockService,
        awsMockPod,
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

        await customObjectClient.createNamespacedCustomObject({
            group: 'zenko.io',
            version: 'v1alpha2',
            namespace: parameters.Namespace,
            plural: 'zenkonotificationtargets',
            body: notificationTarget
        }).catch(err => {
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

    // eslint-disable-next-line max-len
    const deployment = await appsClient.readNamespacedDeployment({ name: deploymentName, namespace: parameters.Namespace });

    const containers = deployment.spec?.template?.spec?.containers || [];
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

    await appsClient.patchNamespacedDeployment({
        name: deploymentName,
        namespace: parameters.Namespace,
        body: deployment
    });

    await waitForDeploymentRollout(appsClient, deploymentName, parameters.Namespace);

    logger.info('Deployment modifications applied', {
        deploymentName,
        parameters,
    });
}

/**
 * Setup storage locations via Management API
 */
async function setupStorageLocations(parameters: ZenkoWorldParameters): Promise<void> {
    if (!parameters.InstanceID) {
        logger.info('InstanceID not available, skipping storage location setup');
        return;
    }

    logger.info('Setting up storage locations...');

    // Create a minimal Zenko instance for Management API calls
    const zenkoInstance = {
        parameters,
        managementAPIRequest: async (
            method: string,
            path: string,
            headers: Record<string, string> = {},
            body?: unknown,
        ) => {
            const axios = (await import('axios')).default;
            const baseURL = `http://management.${parameters.subdomain}`;
            
            try {
                const response = await axios({
                    method,
                    url: `${baseURL}${path}`,
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers,
                    },
                    data: body,
                });
                return { statusCode: response.status, data: response.data };
            } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                if (error.response) {
                    return { statusCode: error.response.status, err: error.response.data };
                }
                return { statusCode: 500, err: error.message };
            }
        },
        logger,
    };

    const locations = [
        // AWS Backend Source Location
        {
            name: 'awsbackend',
            locationType: 'location-aws-s3-v1',
            details: {
                bucketName: 'ci-zenko-aws-target-bucket',
                endpoint: `aws-mock.${parameters.Namespace}.svc.cluster.local`,
                accessKey: 'accessKey1',
                secretKey: 'verySecretKey1',
                bucketMatch: true,
                repoId: [],
            },
        },
        // AWS Backend Destination Location (for replication)
        {
            name: 'awsbackendmismatch',
            locationType: 'location-aws-s3-v1',
            legacyAwsBehavior: true,
            details: {
                bucketName: 'ci-zenko-aws-crr-target-bucket',
                endpoint: `aws-mock.${parameters.Namespace}.svc.cluster.local`,
                accessKey: 'accessKey1',
                secretKey: 'verySecretKey1',
                bucketMatch: false,
                repoId: [],
            },
        },
        // AWS Backend Fail Location (for failure testing)
        {
            name: 'awsbackendfail',
            locationType: 'location-aws-s3-v1',
            details: {
                bucketName: 'ci-zenko-aws-fail-target-bucket',
                endpoint: `aws-mock.${parameters.Namespace}.svc.cluster.local`,
                accessKey: 'accessKey1',
                secretKey: 'verySecretKey1',
                bucketMatch: true,
                repoId: [],
            },
        },
        // AWS Backend Replication Fail CTST Location
        {
            name: 'awsbackendreplicationctstfail',
            locationType: 'location-aws-s3-v1',
            details: {
                bucketName: 'ci-zenko-aws-replication-fail-ctst-bucket',
                endpoint: `aws-mock.${parameters.Namespace}.svc.cluster.local`,
                accessKey: 'accessKey1',
                secretKey: 'verySecretKey1',
                bucketMatch: false,
                repoId: [],
            },
        },
        // Cold Storage Location (used in dmf.feature, quotas.feature, pra.feature)
        {
            name: 'e2e-cold',
            locationType: 'location-dmf-v1',
            isCold: true,
            details: {
                endpoint: 'ws://mock-sorbet:5001/session',
                username: 'user1',
                password: 'pass1',
                repoId: [
                    '233aead6-1d7b-4647-a7cf-0d3280b5d1d7',
                    '81e78de8-df11-4acd-8ad1-577ff05a68db',
                ],
                nsId: '65f9fd61-42fe-4a68-9ac0-6ba25311cc85',
            },
        },
        // Azure Archive Location (used extensively in azureArchive.feature with hardcoded name)
        {
            name: 'e2e-azure-archive',
            locationType: 'location-azure-archive-v1',
            isCold: true,
            details: {
                // eslint-disable-next-line max-len
                endpoint: `https://${parameters.AzureAccountName}.blob.azure-mock.${parameters.Namespace}.svc.cluster.local`,
                bucketName: parameters.AzureArchiveContainer,
                queue: {
                    type: 'location-azure-storage-queue-v1',
                    queueName: parameters.AzureArchiveQueue,
                    // eslint-disable-next-line max-len
                    endpoint: `https://${parameters.AzureAccountName}.queue.azure-mock.${parameters.Namespace}.svc.cluster.local`,
                },
                auth: {
                    type: 'location-azure-shared-key',
                    accountName: parameters.AzureAccountName,
                    accountKey: parameters.AzureAccountKey,
                },
                repoId: ['233aead6-1d7b-4647-a7cf-0d3280b5d1d7'],
            },
        },
    ];

    const creationResults = await Promise.allSettled(
        locations.map(async location => {
            try {
                const result = await zenkoInstance.managementAPIRequest(
                    'POST',
                    `/config/${parameters.InstanceID}/location`,
                    {},
                    location
                );

                if (result.statusCode === 201) {
                    logger.info(`Successfully created location: ${location.name}`);
                    return { location: location.name, success: true };
                } else if (result.statusCode === 409) {
                    logger.info(`Location already exists: ${location.name}`);
                    return { location: location.name, success: true, existed: true };
                } else {
                    logger.error(`Failed to create location ${location.name}`, {
                        statusCode: result.statusCode,
                        error: result.err || result.data,
                    });
                    return { location: location.name, success: false, error: result.err || result.data };
                }
            } catch (error) {
                logger.error(`Exception creating location ${location.name}`, { error });
                return { location: location.name, success: false, error };
            }
        })
    );

    // Log results
    const successful = creationResults.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = creationResults.filter(r => r.status === 'rejected' || !r.value?.success);

    logger.info(`Storage location setup completed: ${successful.length} successful, ${failed.length} failed`);

    if (failed.length > 0) {
        const failedNames = failed.map(r => 
            r.status === 'fulfilled' ? r.value.location : 'unknown'
        );
        logger.warn(`Failed to create locations: ${failedNames.join(', ')}`);
    }
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
        await rbacClient.createClusterRoleBinding({ body: clusterRoleBinding });
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
    await coordinate(
        {
            lockName: 'ctst-setup',
            timeout: 15 * 60 * 1000,
            logger,
        },
        async () => {
            logger.info('Performing CTST cluster setup...');
            await setupClusterConfiguration(this.parameters as ZenkoWorldParameters);
        },
        async () => {
            await extractAndCacheParameters(this.parameters as ZenkoWorldParameters);
        }
    );
    logger.info('Final parameters:', { parameters: this.parameters, cachedParameters: CacheHelper.parameters });
});
