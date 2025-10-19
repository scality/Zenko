import Werelogs from 'werelogs';
import { BeforeAll } from '@cucumber/cucumber';
import { CacheHelper, KubernetesHelper, WorkCoordination } from 'cli-testing';
import {
    CoreV1Api,
} from '@kubernetes/client-node';
import Zenko, { ZenkoWorldParameters } from 'world/Zenko';
import { getZenkoCR, waitForDeploymentRollout } from 'steps/utils/kubernetes';

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
CacheHelper.logger = logger;

async function waitForServiceEndpoints(
    serviceName: string,
    namespace: string,
    timeoutMs: number,
): Promise<void> {
    KubernetesHelper.init({ Namespace: namespace } as ZenkoWorldParameters);
    const core = KubernetesHelper.getClientCore();
    const start = Date.now();
    const poll = 2000;
    // small delay to allow endpoints controller to catch up
    await new Promise(r => setTimeout(r, 3000));
     
    while (true) {
        const ep = await core!.readNamespacedEndpoints({ name: serviceName, namespace });
        const addresses = ep.subsets?.flatMap(s => s.addresses || []) || [];
        if (addresses.length > 0) {
            logger.info('Service endpoints ready', { serviceName, namespace, addresses: addresses.length });
            return;
        }
        if (Date.now() - start > timeoutMs) {
            throw new Error(`Timeout waiting for Service ${serviceName} endpoints in namespace ${namespace}`);
        }
        await new Promise(r => setTimeout(r, poll));
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
    
    // Note: AccountAccessKey/AccountSecretKey will be generated later for the zenko-ctst account
    // Using admin credentials as account credentials would fail since they're different accounts
    return {
        AdminAccessKey: finalAdminAccessKey,
        AdminSecretKey: finalAdminSecretKey,
        AccountAccessKey: parameters.AccountAccessKey || '',
        AccountSecretKey: parameters.AccountSecretKey || '',
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
 * Setup CTST-specific cluster configuration
 */
async function setupCTST(parameters: ZenkoWorldParameters): Promise<void> {
    logger.info('Applying CTST-specific cluster configuration...');

    await applyDeploymentModifications(parameters);

    logger.info('CTST-specific configuration completed, waiting for services to be ready...');

    // Ensure S3 API service endpoints are ready
    await waitForServiceEndpoints(
        'end2end-connector-s3api',
        parameters.Namespace || 'default',
        2 * 60 * 1000,
    );

    // Ensure Vault Auth service endpoints are ready before tests begin
    await waitForServiceEndpoints(
        'end2end-connector-vault-auth-api',
        parameters.Namespace || 'default',
        2 * 60 * 1000,
    );

    logger.info('CTST setup completed successfully');
}

/**
 * Extract and cache parameters from the configured cluster (done by all workers)
 */
async function extractAndCacheParameters(parameters: ZenkoWorldParameters): Promise<void> {
    KubernetesHelper.init(parameters);

    const [adminCreds, praCreds, serviceCredentials, kafkaConfig, zenkoInfo] = await Promise.all([
        extractAdminCredentials(KubernetesHelper.getClientCore()!, parameters),
        extractPRACredentials(KubernetesHelper.getClientCore()!, parameters),
        extractServiceCredentials(KubernetesHelper.getClientCore()!, parameters),
        extractKafkaConfiguration(KubernetesHelper.getClientCore()!, parameters),
        extractZenkoCRInfo(parameters),
    ]);

    const subdomain = parameters.subdomain || 'zenko.local';

    const setupParameters = {
        // Parameters from the environment
        ...parameters,
        // Parameters dynamically extracted from the cluster
        ...adminCreds,
        ...praCreds,
        ...serviceCredentials,
        ...kafkaConfig,
        ...zenkoInfo,
        // Constants, CTST-specific
        UtilizationServicePort: '80',
        VaultAuthHost: 'end2end-connector-vault-auth-api.default.svc.cluster.local',
        PrometheusService: `${parameters.PrometheusName}-operated.default.svc.cluster.local`,
        StorageManagerUsername: 'ctst_storage_manager',
        StorageAccountOwnerUsername: 'ctst_storage_account_owner',
        DataConsumerUsername: 'ctst_data_consumer',
        DataAccessorUsername: 'ctst_data_accessor',
        AzureArchiveAccessTier: 'Hot',
        AzureArchiveManifestTier: 'Hot',
        KeycloakGrantType: 'password',
        KeycloakHost: `keycloak.${subdomain}`,
        KeycloakPort: '80',
        AzureArchiveContainer: 'ci-zenko-azure-archive-target-bucket',
        AzureArchiveContainer2: 'ci-zenko-azure-archive-target-bucket-2',
        AzureArchiveQueue: 'ci-zenko-azure-archive-target-queue',
        AccountName: Zenko.ACCOUNT_NAME,
        ssl: Zenko.SSL_ENABLED,
        port: Zenko.PORT,
        // Passed and required parameters
        subdomain,
        NotificationDestination: parameters.NotificationDestination,
        NotificationDestinationTopic: parameters.NotificationDestinationTopic,
        NotificationDestinationAlt: parameters.NotificationDestinationAlt,
        NotificationDestinationTopicAlt: parameters.NotificationDestinationTopicAlt,
        KafkaExternalIps: parameters.KafkaExternalIps,
        KeycloakUsername: parameters.KeycloakUsername,
        KeycloakPassword: parameters.KeycloakPassword,
        KeycloakTestPassword: parameters.KeycloakPassword,
        KeycloakRealm: parameters.KeycloakRealm,
        KeycloakClientId: parameters.KeycloakClientId,
        AzureAccountName: parameters.AzureAccountName,
        AzureAccountKey: parameters.AzureAccountKey,
    };

    CacheHelper.cacheParameters(setupParameters);

    logger.info('CTST parameters extracted and cached');
}

/**
 * Apply deployment modifications
 */
async function applyDeploymentModifications(parameters: ZenkoWorldParameters): Promise<void> {
    const deploymentName = 'end2end-connector-cloudserver';
    KubernetesHelper.init(parameters);

    // eslint-disable-next-line max-len
    const deployment = await KubernetesHelper.getClientAppsV1()!.readNamespacedDeployment({ name: deploymentName, namespace: parameters.Namespace });

    const containers = deployment.spec?.template?.spec?.containers || [];
    const cloudserverContainer = containers.find(c => c.name.includes('cloudserver'));

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

    await KubernetesHelper.getClientAppsV1()!.replaceNamespacedDeployment({
        name: deploymentName,
        namespace: parameters.Namespace,
        body: deployment
    });

    await waitForDeploymentRollout({ parameters, logger } as Zenko, deploymentName, parameters.Namespace);

    logger.info('Deployment modifications applied', {
        deploymentName,
        parameters,
    });
}

BeforeAll({ timeout: 15 * 60 * 1000 }, async function () {
    const parameters = this.parameters as ZenkoWorldParameters;
    await WorkCoordination.runOnceAcrossWorkers(
        {
            lockName: 'ctst-setup',
            timeout: 15 * 60 * 1000,
            logger,
        },
        async () => {
            logger.info('Performing CTST cluster setup...');
            await setupCTST(parameters);
        }
    );

    await extractAndCacheParameters(parameters);
    logger.info('Final parameters:', { parameters, cachedParameters: CacheHelper.parameters });
});
