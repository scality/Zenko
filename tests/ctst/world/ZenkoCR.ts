export type ZenkoConditionType = 'Available' | 'DeploymentInProgress' | 'DeploymentFailure';

export type ZenkoCondition = {
    type: ZenkoConditionType;
    status: 'True' | 'False' | 'Unknown';
    lastTransitionTime?: string;
    reason?: string;
    message?: string;
};

export type ZenkoComponentIngress = {
    hostname?: string;
    annotations?: Record<string, string>;
};

export type ZenkoSpecKafkaCleaner = {
    logLevel?: string;
    interval?: string;
    kafkaErrorsWarningThreshold?: number;
};

export type ZenkoSpecSorbetServerAzureConfig = {
    archiveTier?: string;
    rehydrationTier?: string;
    rehydrationPrefix?: string;
    restoreTimeout?: string;
    blockSize?: string;
    pollingDelay?: string;
};

export type ZenkoSpecSorbetServerConfig = {
    jobTimeout?: string;
    azure?: ZenkoSpecSorbetServerAzureConfig;
};

export type ZenkoSpecSorbet = {
    enable?: boolean;
    jobStoreCollection?: string;
    expirationJobStoreCollection?: string;
    server?: ZenkoSpecSorbetServerConfig;
};

export type ZenkoSpecScubaExternalAPI = {
    replicas?: number;
    ingress?: ZenkoComponentIngress;
};

export type ZenkoSpecScuba = {
    replicas?: number;
    api?: ZenkoSpecScubaExternalAPI;
};

export type ZenkoSpecManagementOIDC = {
    provider?: string;
    federatedProviders?: string[];
    uiClientId?: string;
    uiControlPlaneClientId?: string;
    uiWorkloadPlaneProviderUrl?: string;
    uiControlPlaneProviderUrl?: string;
    vaultClientId?: string;
    ingress?: ZenkoComponentIngress;
};

export type ZenkoSpecManagement = {
    provider?: 'InCluster' | 'Orbit';
    endpoint?: string;
    pushEndpoint?: string;
    oidc?: ZenkoSpecManagementOIDC;
};

export type ZenkoSpecPersistence = {
    resources?: ZenkoSpecResourcesSpec;
};

// v1alpha1 types that are extended in v1alpha2
export type ZenkoSpecResourcesSpec = {
    requestCPU?: string;
    requestMemory?: string;
    limitCPU?: string;
    limitMemory?: string;
};

export type ZenkoSpecAffinity = {
    nodeAffinity?: Record<string, unknown>;
    podAffinity?: Record<string, unknown>;
    podAntiAffinity?: Record<string, unknown>;
};

export type ZenkoSpecComponentSpec = {
    replicas?: number;
    resources?: ZenkoSpecResourcesSpec;
};

export type ZenkoSpecMongoDB = {
    provider?: 'External';
    persistence?: ZenkoSpecPersistence;
    endpoints?: string[];
    userSecretName?: string;
    usernameKey?: string;
    passwordKey?: string;
    replicaSetName?: string;
    writeConcern?: string;
    readPreference?: 'primary' | 'primaryPreferred' | 'secondary' | 'secondaryPreferred' | 'nearest';
    databaseName?: string;
    enableSharding?: boolean;
    metricsJobName?: string;
    metricsShardJobName?: string;
};

export type ZenkoSpecZookeeperProvider = 'Managed' | 'External';

export type ZenkoSpecZookeeper = {
    provider?: ZenkoSpecZookeeperProvider;
    persistence?: ZenkoSpecPersistence;
    endpoints?: string[];
};

export type ZenkoSpecKafkaProvider = 'Managed' | 'External';

// v1alpha2 enhanced Kafka types
export type ZenkoSpecKafkaManagedClusterUser = {
    name?: string;
    secretName?: string;
};

export type ZenkoSpecKafkaManagedClusterExternalListener = {
    type?: 'haproxy';
    tls?: boolean;
    port?: number;
    brokerIpAddresses?: Record<string, string>;
};

export type ZenkoSpecKafkaManagedCluster = {
    persistence?: ZenkoSpecPersistence;
    zkAddresses?: string[];
    jmxJarPath?: string;
    kafkaConfigFilesCM?: string;
    resources?: ZenkoSpecResourcesSpec;
    externalListener?: ZenkoSpecKafkaManagedClusterExternalListener;
    users?: ZenkoSpecKafkaManagedClusterUser[];
    defaultBrokerAffinity?: ZenkoSpecAffinity;
};

export type ZenkoSpecKafkaExternalClusterTLSCA = {
    secretName?: string;
};

export type ZenkoSpecKafkaExternalClusterTLSAuth = {
    secretName?: string;
};

export type ZenkoSpecKafkaExternalClusterTLS = {
    enable?: boolean;
    auth?: ZenkoSpecKafkaExternalClusterTLSAuth;
    ca?: ZenkoSpecKafkaExternalClusterTLSCA;
    hostAliases?: Record<string, unknown>[];
};

export type ZenkoSpecKafkaExternalCluster = {
    brokers?: string[];
    tls?: ZenkoSpecKafkaExternalClusterTLS;
};

export type ZenkoSpecKafkaCluster = {
    replicas?: number;
    managed?: ZenkoSpecKafkaManagedCluster;
    external?: ZenkoSpecKafkaExternalCluster;
    connect?: ZenkoSpecKafkaConnect;
    maxMessageBytes?: string;
    versions?: Record<string, unknown>;
    remainingDiskSpaceWarningThreshold?: number;
    maxConsumerLagMessagesWarningThreshold?: number;
    maxConsumerLagSecondsWarningThreshold?: number;
};

// v1alpha1 Kafka (simpler version)
export type ZenkoSpecKafka = {
    provider?: ZenkoSpecKafkaProvider;
    persistence?: ZenkoSpecPersistence;
    brokers?: string[];
    jmxJarPath?: string;
    kafkaConfigFiles?: string;
    
    // v1alpha2 extensions
    cluster?: ZenkoSpecKafkaCluster;
};

export type ZenkoSpecRedisProvider = 'Zenko';

export type ZenkoSpecRedis = {
    provider?: ZenkoSpecRedisProvider;
    persistence?: ZenkoSpecPersistence;
};

export type ZenkoSpecLocalData = {
    persistence?: ZenkoSpecPersistence;
};

export type ZenkoSpecBlobserver = {
    replicas?: number;
    enable?: boolean;
};

export type ZenkoSpecJabba = {
    replicas?: number;
    ingress?: ZenkoComponentIngress;
};

// v1alpha2 enhanced component types
export type ZenkoSpecMetrics = {
    scrapePath?: string;
    scrapePort?: string;
    scrapeInterval?: string;
};

export type ZenkoSpecLogging = {
    logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
    dumpLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
};

export type ZenkoSpecComponentSpecV2 = {
    replicas?: number;
    metrics?: ZenkoSpecMetrics;
    logging?: ZenkoSpecLogging;
    // resources.SchedulingSpec inline
    nodeSelector?: Record<string, string>;
    tolerations?: Record<string, unknown>[];
    affinity?: ZenkoSpecAffinity;
};

export type ZenkoSpecCloudserver = {
    replicas?: number;
    ingress?: ZenkoComponentIngress;
    
    // v1alpha2 enhancements
    metrics?: ZenkoSpecMetrics;
    logging?: ZenkoSpecLogging;
    systemErrorsWarningThreshold?: number;
    systemErrorsCriticalThreshold?: number;
    listingLatencyWarningThreshold?: number;
    listingLatencyCriticalThreshold?: number;
    deleteLatencyWarningThreshold?: number;
    deleteLatencyCriticalThreshold?: number;
    quotaUnavailabilityThreshold?: number;
};

export type ZenkoSpecInternalCloudserver = {
    enable?: boolean;
    replicas?: number;
    ingress?: ZenkoComponentIngress;
    metrics?: ZenkoSpecMetrics;
    logging?: ZenkoSpecLogging;
};

// v1alpha2 enhanced Backbeat types
export type ZenkoSpecBackbeatRetryBackoff = {
    minMs?: number;
    maxMs?: number;
    jitterPercent?: number;
    factorPercent?: number;
};

export type ZenkoSpecBackbeatRetry = {
    maxRetries?: number;
    timeoutSeconds?: number;
    backoff?: ZenkoSpecBackbeatRetryBackoff;
};

export type ZenkoSpecBackbeatConcurrency = {
    concurrency?: number;
};

export type ZenkoSpecCircuitBreakerProbe = {
    noop?: boolean;
    kafkaLag?: boolean;
    prometheus?: boolean;
};

export type ZenkoSpecCircuitBreaker = {
    probes?: ZenkoSpecCircuitBreakerProbe[];
    nominalEvaluateInterval?: string;
    trippedEvaluateInterval?: string;
    stabilizingEvaluateInterval?: string;
    stabilizeAfterNSuccesses?: number;
};

export type ZenkoSpecBackbeatComponentSpec = {
    replicas?: number;
    concurrency?: number;
    retry?: ZenkoSpecBackbeatRetry;
    circuitBreaker?: ZenkoSpecCircuitBreaker;
};

export type ZenkoSpecBackbeatLifecycleConductor = {
    concurrency?: number;
    cronRule?: string;
    circuitBreaker?: ZenkoSpecCircuitBreaker;
    concurrentIndexBuildLimit?: number;
};

export type ZenkoSpecBackbeatLifecycleBucketProcessor = {
    replicas?: number;
    concurrency?: number;
    triggerTransitionsOneDayEarlierForTesting?: boolean;
};

export type ZenkoSpecBackbeatReplicationRetry = {
    aws?: ZenkoSpecBackbeatRetry;
    azure?: ZenkoSpecBackbeatRetry;
    gcp?: ZenkoSpecBackbeatRetry;
    scality?: ZenkoSpecBackbeatRetry;
};

export type ZenkoSpecBackbeatReplicationDataProcessor = {
    replicas?: number;
    concurrency?: number;
    mpuPartsConcurrency?: number;
    retry?: ZenkoSpecBackbeatReplicationRetry;
    circuitBreaker?: ZenkoSpecCircuitBreaker;
};

export type ZenkoSpecBackbeatBucketNotification = {
    replicas?: number;
    concurrency?: number;
    backbeatTopic?: string;
    useDedicatedTopicsByDefault?: boolean;
    enable?: boolean;
    failedNotificationWarningThreshold?: number;
    failedNotificationCriticalThreshold?: number;
};

export type ZenkoSpecBackbeat = {
    replicas?: number;
    triggerExpirationsOneDayEarlierForTesting?: boolean;
    replicationErrorsWarningThreshold?: number;
    replicationErrorsCriticalThreshold?: number;
    rpoWarningThreshold?: string;
    rpoCriticalThreshold?: string;
    latencyWarningThreshold?: string;
    latencyCriticalThreshold?: string;
    lifecycleLatencyWarningThreshold?: string;
    lifecycleLatencyCriticalThreshold?: string;
    
    // v1alpha2 component specifications
    lifecyclePopulator?: ZenkoSpecBackbeatComponentSpec;
    lifecycleConductor?: ZenkoSpecBackbeatLifecycleConductor;
    lifecycleBucketProcessor?: ZenkoSpecBackbeatLifecycleBucketProcessor;
    lifecycleObjectProcessor?: ZenkoSpecBackbeatComponentSpec;
    lifecycleTransitionProcessor?: ZenkoSpecBackbeatComponentSpec;
    replicationProducer?: ZenkoSpecBackbeatComponentSpec;
    replicationDataProcessor?: ZenkoSpecBackbeatReplicationDataProcessor;
    replicationStatusProcessor?: ZenkoSpecBackbeatComponentSpec;
    garbageCollector?: ZenkoSpecBackbeatComponentSpec;
    ingestionProducer?: ZenkoSpecBackbeatComponentSpec;
    ingestionProcessor?: ZenkoSpecBackbeatComponentSpec;
    oplogPopulator?: ZenkoSpecBackbeatComponentSpec;
    notificationProducer?: ZenkoSpecBackbeatComponentSpec;
    bucketNotification?: ZenkoSpecBackbeatBucketNotification;
};

export type ZenkoSpecUtapi = {
    replicas?: number;
    enable?: boolean;
    controlPlaneIngress?: ZenkoComponentIngress;
    workloadPlaneIngress?: ZenkoComponentIngress;
};

export type ZenkoSpecVault = {
    replicas?: number;
    enable?: boolean;
    iamIngress?: ZenkoComponentIngress;
    stsIngress?: ZenkoComponentIngress;
    noImplicitDeny?: boolean;
    
    // v1alpha2 enhancements
    metrics?: ZenkoSpecMetrics;
    logging?: ZenkoSpecLogging;
    systemErrorsWarningThreshold?: number;
    systemErrorsCriticalThreshold?: number;
    authenticationLatencyWarningThreshold?: number;
    authenticationLatencyCriticalThreshold?: number;
    authorizationLatencyWarningThreshold?: number;
    authorizationLatencyCriticalThreshold?: number;
};

// v1alpha2 additional component types
export type ZenkoSpecVeeamSOSApi = {
    enable?: boolean;
    cronRule?: string;
};

export type ZenkoSpecS3utils = {
    metrics?: ZenkoSpecMetrics;
    countItemsJobDurationThreshold?: string;
    updateBucketCapacityInfoJobDurationThreshold?: string;
    updateBucketCapacityInfoSuccessJobExistenceDurationThreshold?: string;
    cronRule?: string;
};

export type ZenkoSpecKafkaConnect = {
    replicas?: number;
    clusterGroupId?: string;
    configStorageTopic?: string;
    offsetStorageTopic?: string;
    statusStorageTopic?: string;
};

export type ZenkoSpecRegistry = {
    imagePullSecretNames?: string[];
};

export type ZenkoSpecIngress = {
    controlPlaneClass?: string;
    workloadPlaneClass?: string;
    certificates?: Record<string, unknown>[];
    annotations?: Record<string, string>;
};

export type ZenkoSpecEgressProxyCA = {
    'ca.crt'?: string;
    secretName?: string;
    secretAttributeName?: string;
};

export type ZenkoSpecEgressProxy = {
    https?: string;
    http?: string;
    ca?: ZenkoSpecEgressProxyCA;
    exclude?: string[];
};

export type ZenkoSpecEgress = {
    proxy?: ZenkoSpecEgressProxy;
    skipTLSVerify?: boolean;
};

export type ZenkoSpec = {
    version?: string;
    replicas?: number;
    management?: ZenkoSpecManagement;
    registry?: ZenkoSpecRegistry;
    ingress?: ZenkoSpecIngress;
    egress?: ZenkoSpecEgress;
    initialConfiguration?: Record<string, unknown>;
    
    // v1alpha1 components
    mongodb?: ZenkoSpecMongoDB;
    zookeeper?: ZenkoSpecZookeeper;
    kafka?: ZenkoSpecKafka;
    redis?: ZenkoSpecRedis;
    localData?: ZenkoSpecLocalData;
    blobserver?: ZenkoSpecBlobserver;
    jabba?: ZenkoSpecJabba;
    cloudserver?: ZenkoSpecCloudserver;
    backbeat?: ZenkoSpecBackbeat;
    utapi?: ZenkoSpecUtapi;
    vault?: ZenkoSpecVault;
    
    // v1alpha2 additions and enhancements
    kafkaCleaner?: ZenkoSpecKafkaCleaner;
    kafkaConnect?: ZenkoSpecKafkaConnect;
    sorbet?: ZenkoSpecSorbet;
    scuba?: ZenkoSpecScuba;
    internalCloudserver?: ZenkoSpecInternalCloudserver;
    
    // Additional v1alpha2 fields
    dashboardFolder?: string;
    veeamSosApi?: ZenkoSpecVeeamSOSApi;
    s3utils?: ZenkoSpecS3utils;
};

export type ZenkoStatus = {
    instanceID?: string;
    readyReplicas?: number;
    conditions?: ZenkoCondition[];
    observedGeneration?: number;
};

export type ZenkoCR = {
    apiVersion?: string;
    kind?: string;
    metadata?: {
        name?: string;
        namespace?: string;
        annotations?: {
            'zenko.io/time-progression-factor'?: string;
            'zenko.io/service-users-seq'?: string;
            [key: string]: string | undefined;
        };
        labels?: Record<string, string>;
    };
    spec?: ZenkoSpec;
    status?: ZenkoStatus;
};
