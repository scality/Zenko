import fs from 'fs';
import * as path from 'path';
import { KubernetesHelper, Utils } from 'cli-testing';
import Zenko from 'world/Zenko';
import {
    V1Job,
    V1ObjectMeta,
    V1Pod,
} from '@kubernetes/client-node';
import { ZenkoCR } from 'world/ZenkoCR';

type ZenkoStatusValue = {
    lastTransitionTime: string,
    message: string,
    status: 'True' | 'False',
    reason?: string,
    type: 'DeploymentFailure' | 'DeploymentInProgress' | 'Available',
};

type ZenkoStatus = ZenkoStatusValue[];

type ZenkoVersion = {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
    };
    spec: ZenkoVersionSpec;
};

type ZenkoVersionSpec = {
    versions: {
        s3utils: {
            image: string;
            tag: string;
        };
    };
};

export function initKubernetes(world: Zenko): void {
    KubernetesHelper.init(world.parameters);
}

export async function createJobAndWaitForCompletion(
    world: Zenko,
    jobName: string,
    customMetadata?: string
) {
    initKubernetes(world);

    const lockFilePath = path.join('/tmp', `${jobName}.lock`);

    let lockAquired = false;
    let tries = 600;
    while (!lockAquired && tries > 0) {
        try {
            fs.writeFileSync(lockFilePath, 'lock', {
                flag: 'wx',
            });
            lockAquired = true;
        } catch {
            world.logger.debug(`Failed to acquire lock for job: ${jobName}`, {
                tries,
            });
        }
        tries--;
        if (!lockAquired) {
            await Utils.sleep(1000);
        }
    }

    try {
        world.logger.debug(`Acquired lock for job: ${jobName}`);

        // Read the cron job and prepare the job spec
        const cronJob = await KubernetesHelper.getClientBatch()!.readNamespacedCronJob({
            name: jobName,
            namespace: 'default',
        });
        const cronJobSpec = cronJob.spec?.jobTemplate.spec;

        const job = new V1Job();
        const metadata = new V1ObjectMeta();
        job.apiVersion = 'batch/v1';
        job.kind = 'Job';
        job.spec = cronJobSpec;
        metadata.name = `${jobName}-${Utils.randomString().toLowerCase()}`;
        metadata.annotations = {
            'cronjob.kubernetes.io/instantiate': 'ctst',
        };
        if (customMetadata) {
            metadata.annotations.custom = customMetadata;
        }
        job.metadata = metadata;

        // Create the job
        const response = await KubernetesHelper.getClientBatch()!.createNamespacedJob({
            namespace: 'default',
            body: job,
        });
        world.logger.debug('Job created', { job: response.metadata });

        const expectedJobName = response.metadata?.name;

        // Watch for job completion
        await new Promise<void>((resolve, reject) => {
            void KubernetesHelper.getClientWatch()!.watch(
                '/apis/batch/v1/namespaces/default/jobs',
                {},
                (type: string, apiObj, watchObj) => {
                    if (
                        expectedJobName &&
                        (watchObj.object?.metadata?.name as string)?.startsWith?.(expectedJobName)
                    ) {
                        if (watchObj.object?.status?.succeeded) {
                            world.logger.debug('Job succeeded', { job: job.metadata });
                            resolve();
                        } else if (watchObj.object?.status?.failed) {
                            world.logger.debug('Job failed', {
                                job: job.metadata,
                                object: watchObj.object,
                            });
                            reject(new Error('Job failed'));
                        }
                    }
                },
                reject
            );
        });
    } catch (err: unknown) {
        world.logger.debug('Error creating or waiting for job completion', {
            jobName,
            err,
        });
        throw err;
    } finally {
        fs.unlinkSync(lockFilePath);
    }
}

export async function createAndRunPod(
    world: Zenko,
    podManifest: V1Pod,
    waitForCompletion = true,
    cleanup = false, // The pod will be visible in the artifacts is set to false
    timeout = 300000,
) {
    initKubernetes(world);
    KubernetesHelper.logger = world.logger;
    return await KubernetesHelper.createAndRunPod(podManifest, 'default', waitForCompletion, cleanup, timeout);
}

export async function waitForZenkoToStabilize(
    world: Zenko, needsReconciliation = false, timeout = 15 * 60 * 1000, namespace = 'default') {
    initKubernetes(world);
    // ZKOP pulls the overlay configuration from Pensieve every 5 seconds
    // So the status might not be updated immediately after the overlay is applied.
    // So, this function will first wait till we detect a reconciliation
    // (deploymentInProgress = true), and then wait for the status to be available
    const startTime = Date.now();
    let status = false;
    let deploymentFailure: ZenkoStatusValue = {
        lastTransitionTime: '',
        message: '',
        status: 'False',
        type: 'DeploymentFailure',
    };
    let deploymentInProgress: ZenkoStatusValue = {
        lastTransitionTime: '',
        message: '',
        status: 'False',
        type: 'DeploymentInProgress',
    };
    let available: ZenkoStatusValue = {
        lastTransitionTime: '',
        message: '',
        status: 'False',
        type: 'Available',
    };
    // If needsReconciliation is true, we expect a reconciliation
    // otherwise, we can use the function as a sanity check of the
    // zenko status.
    let reconciliationDetected = !needsReconciliation;

    world.logger.info('Waiting for Zenko to stabilize');

    while (!status && Date.now() - startTime < timeout) {
        const zenkoCR = await KubernetesHelper.getCustomObject()!.getNamespacedCustomObject({
            group: 'zenko.io',
            version: 'v1alpha2',
            namespace,
            plural: 'zenkos',
            name: 'end2end'
        }).catch(err => {
            world.logger.info('Error getting Zenko CR', {
                err: err as unknown,
            });
            return null;
        });

        if (!zenkoCR) {
            await Utils.sleep(1000);
            continue;
        }

        const conditions: ZenkoStatus = (zenkoCR as {
            status: {
                conditions: ZenkoStatus,
            },
        })?.status?.conditions || [];

        conditions.forEach(condition => {
            if (condition.type === 'DeploymentFailure') {
                deploymentFailure = condition;
            } else if (condition.type === 'DeploymentInProgress') {
                deploymentInProgress = condition;
            } else if (condition.type === 'Available') {
                available = condition;
            }
        });

        world.logger.info('Checking Zenko CR status', {
            conditions,
            deploymentFailure,
            deploymentInProgress,
            available,
        });

        if (!reconciliationDetected &&
            deploymentInProgress.status === 'True' &&
            deploymentInProgress.reason === 'Reconciling'
        ) {
            reconciliationDetected = true;
            continue;
        }

        if (reconciliationDetected &&
            deploymentFailure.status === 'False' &&
            deploymentInProgress.status === 'False' &&
            available.status === 'True'
        ) {
            status = true;
        }

        await Utils.sleep(1000);
    }

    if (!status) {
        throw new Error('Zenko did not stabilize');
    }
}

export async function waitForDataServicesToStabilize(world: Zenko, timeout = 15 * 60 * 1000, namespace = 'default') {
    initKubernetes(world);
    const annotationKey = 'operator.zenko.io/dependencies';
    const dataServices = ['connector-cloudserver-config', 'backbeat-config'];

    world.logger.debug('Waiting for data services to stabilize', { namespace });

    // First list all deployments, and then filter the ones with an annotation that matches the data services
    const serviceDeployments = await KubernetesHelper.getClientAppsV1()!.listNamespacedDeployment({ namespace });
    const deployments = serviceDeployments.items.filter(deployment => {
        const annotations = deployment.metadata?.annotations;
        return annotations && dataServices.some(service => annotations[annotationKey]?.includes(service));
    });

    world.logger.debug('Got the list of deployments to check for stabilization', {
        deployments: deployments.map(deployment => deployment.metadata?.name),
    });

    // Wait for each deployment to be ready using KubernetesHelper
    for (const deployment of deployments) {
        const deploymentName = deployment.metadata?.name;
        if (!deploymentName) {
            throw new Error('Deployment name not found');
        }

        world.logger.debug('Waiting for deployment to be ready', { deployment: deploymentName });
        await KubernetesHelper.waitForDeployment(deploymentName, namespace, timeout);
    }

    world.logger.debug('All data services are stable');
    return true;
}

export async function getDRSource(world: Zenko, namespace = 'default') {
    initKubernetes(world);
    const zenkoCR = await KubernetesHelper.getCustomObject()!.getNamespacedCustomObject({
        group: 'zenko.io',
        version: 'v1alpha1',
        namespace,
        plural: 'zenkodrsources',
        name: 'end2end-source'
    }).catch(err => {
        world.logger.debug('Error getting Zenko CR', {
            err: err as unknown,
        });
    });

    return zenkoCR;
}

export async function getDRSink(world: Zenko, namespace = 'default') {
    initKubernetes(world);
    const zenkoCR = await KubernetesHelper.getCustomObject()!.getNamespacedCustomObject({
        group: 'zenko.io',
        version: 'v1alpha1',
        namespace,
        plural: 'zenkodrsinks',
        name: 'end2end-pra-sink'
    }).catch(err => {
        world.logger.debug('Error getting Zenko CR', {
            err: err as unknown,
        });
    });

    return zenkoCR;
}

export async function getPVCFromLabel(world: Zenko, label: string, value: string, namespace = 'default') {
    initKubernetes(world);
    return await KubernetesHelper.getPVCFromLabel(label, value, namespace);
}

export async function createSecret(
    world: Zenko,
    secretName: string,
    data: Record<string, string>,
    namespace = 'default',
) {
    initKubernetes(world);

    KubernetesHelper.logger = world.logger;
    return await KubernetesHelper.createSecret(secretName, data, namespace);
}

export async function getMongoDBConfig(
    world: Zenko,
    namespace = 'default',
): Promise<{ replicaSetHosts: string[] }> {
    const customObjectClient = KubernetesHelper.getCustomObject();
    try {
        // Get replicaSetHosts from Zenko CR
        const zenkoCR = await customObjectClient!.getNamespacedCustomObject({
            group: 'zenko.io',
            version: 'v1alpha2',
            namespace,
            plural: 'zenkos',
            name: 'end2end'
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mongodbSpec = (zenkoCR as any)?.spec?.mongodb;
        const mongodbConfig = {
            replicaSetHosts: mongodbSpec?.endpoints || [],
        };

        return mongodbConfig;
    } catch (err) {
        world.logger.debug('Error getting MongoDB config from secret and CR', { namespace, err });
        throw err;
    }
}

export async function getLocationConfigs(
    world: Zenko,
    namespace = 'default',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>> {
    initKubernetes(world);

    try {
        // Get location configurations from connector-cloudserver-config secret
        const secrets = await KubernetesHelper.getSecretsByLabels(
            namespace,
            'app.kubernetes.io/name=connector-cloudserver-config'
        );

        if (!secrets || secrets.length === 0) {
            throw new Error('connector-cloudserver-config secret not found');
        }

        const secret = secrets[0];
        const locationConfigData = KubernetesHelper.getSecretData(secret, 'locationConfig.json');
        return JSON.parse(locationConfigData);
    } catch (err) {
        world.logger.debug('Error getting location configs from secret', { namespace, err });
        throw err;
    }
}

export async function getZenkoVersion(
    world: Zenko,
    namespace = 'default',
): Promise<ZenkoVersion> {
    initKubernetes(world);
    try {
        const zenkoVersionList = await KubernetesHelper.getCustomObject()!.listNamespacedCustomObject({
            group: 'zenko.io',
            version: 'v1alpha1',
            namespace,
            plural: 'zenkoversions'
        });
        const zenkoVersionItems = (zenkoVersionList as { items: ZenkoVersion[] })?.items;
        if (!zenkoVersionItems || zenkoVersionItems.length === 0) {
            throw new Error('No ZenkoVersion resources found');
        }

        return zenkoVersionItems[0];
    } catch (err) {
        world.logger.debug('Error getting ZenkoVersion resource', { namespace, err });
        throw err;
    }
}

/**
 * Execute a shell command in a pod with host volume access
 * Simplified to only support host path mounting for system volumes
 * @param world - The Zenko world object
 * @param command - The command to execute
 * @param options - The options for the command execution
 * @returns The output of the command
 */
export async function execCommandWithVolumeAccess(
    world: Zenko,
    command: string,
    options: {
        volumeMountPath?: string;
        hostPath?: string;
        image?: string;
        namespace?: string;
        timeout?: number;
        cleanup?: boolean;
    } = {}
): Promise<string> {
    initKubernetes(world);
    const {
        volumeMountPath = '/cold-data',
        hostPath = '/cold-data',
        image = 'alpine:3.22',
        namespace = 'default',
        timeout = 30000,
        cleanup = true,
    } = options;

    // Generate unique pod name to prevent conflicts between concurrent tests
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const testContext = world.getSaved?.('bucketName') || 'test';
    const podName = `ctst-exec-${testContext}-${timestamp}-${randomId}`.toLowerCase();

    const podManifest: V1Pod = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
            name: podName,
            namespace,
            labels: {
                'app.kubernetes.io/name': 'ctst-command-executor',
                'app.kubernetes.io/component': 'test-utility',
                'ctst.test/execution-id': `${timestamp}-${randomId}`
            }
        },
        spec: {
            restartPolicy: 'Never',
            securityContext: {
                runAsNonRoot: false,
                fsGroup: 0
            },
            containers: [{
                name: 'executor',
                image,
                command: ['/bin/sh', '-c', command],
                securityContext: {
                    runAsUser: 0,
                    allowPrivilegeEscalation: false,
                    readOnlyRootFilesystem: false,
                    capabilities: {
                        drop: ['ALL']
                    }
                },
                volumeMounts: [{
                    name: 'host-volume',
                    mountPath: volumeMountPath
                }]
            }],
            volumes: [{
                name: 'host-volume',
                hostPath: {
                    path: hostPath,
                    type: 'DirectoryOrCreate'
                }
            }]
        }
    };

    try {
        await createAndRunPod(world, podManifest, true, false, timeout);

        const coreClient = KubernetesHelper.getClientCore();
        const logs = await coreClient!.readNamespacedPodLog({ name: podName, namespace });

        if (cleanup) {
            try {
                await coreClient!.deleteNamespacedPod({ name: podName, namespace });
                world.logger.debug('Pod cleaned up after log retrieval', { podName });
            } catch (cleanupErr) {
                world.logger.warn('Failed to cleanup pod after log retrieval', { podName, err: cleanupErr });
            }
        }

        return logs.trim();
    } catch (error) {
        world.logger.debug('Command execution failed', {
            command,
            podName,
            error: error instanceof Error ? error.message : String(error)
        });

        if (cleanup) {
            const coreClient = KubernetesHelper.getClientCore();
            await coreClient!.deleteNamespacedPod({ name: podName, namespace });
        }

        throw error;
    }
}

/**
 * Execute command in Kubernetes cluster with host volume access
 * Designed for concurrent test execution without conflicts
 * Uses unique pod names and labels for isolation
 */
export async function execInCluster(
    world: Zenko,
    command: string,
    volumeOptions?: Parameters<typeof execCommandWithVolumeAccess>[2]
): Promise<string> {
    world.logger.debug('Executing command in cluster', { command });

    try {
        return await execCommandWithVolumeAccess(world, command, volumeOptions);
    } catch (error) {
        world.logger.debug('Kubernetes command execution failed', {
            command,
            error,
        });
        throw error;
    }
}

/**
 * Wait for deployment rollout to complete
 * Uses KubernetesHelper method for consistent polling logic
 */
export async function waitForDeploymentRollout(
    world: Zenko,
    deploymentName: string,
    namespace: string,
    timeoutMs = 120000,
) {
    initKubernetes(world);

    await KubernetesHelper.waitForDeploymentRollout(deploymentName, namespace, timeoutMs);
}

/**
 * Get Zenko Custom Resource
 */
export async function getZenkoCR(world: Zenko, namespace = 'default', name = 'end2end'): Promise<ZenkoCR | undefined> {
    initKubernetes(world);
    const zenkoClient = KubernetesHelper.getCustomObject();

    const zenkoCR = await zenkoClient!.getNamespacedCustomObject({
        group: 'zenko.io',
        version: 'v1alpha2',
        namespace,
        plural: 'zenkos',
        name
    }).catch(err => {
        world.logger.debug('Error getting Zenko CR', {
            err: err as unknown,
        });
        return;
    });

    return zenkoCR as ZenkoCR;
}

