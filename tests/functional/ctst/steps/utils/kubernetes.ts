import fs from 'fs';
import * as path from 'path';
import { KubernetesHelper, Utils } from 'cli-testing';
import Zenko from 'world/Zenko';
import {
    V1Job,
    Watch,
    V1ObjectMeta,
    AppsV1Api,
    V1Deployment,
    AppsApi,
    CustomObjectsApi,
    V1PersistentVolumeClaim,
    CoreV1Api,
    BatchV1Api,
    V1Pod,
} from '@kubernetes/client-node';

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

export function createKubeBatchClient(world: Zenko): BatchV1Api {
    if (!KubernetesHelper.clientBatch) {
        KubernetesHelper.init(world.parameters);
    }
    // @ts-expect-error kube client class is not stable yet
    return KubernetesHelper.clientBatch;
}

export function createKubeCoreClient(world: Zenko): CoreV1Api {
    if (!KubernetesHelper.clientBatch) {
        KubernetesHelper.init(world.parameters);
    }
    // @ts-expect-error kube client class is not stable yet
    return KubernetesHelper.clientCore;
}

export function createKubeWatchClient(world: Zenko): Watch {
    if (!KubernetesHelper.clientWatch) {
        KubernetesHelper.init(world.parameters);
    }
    // @ts-expect-error kube client class is not stable yet
    return KubernetesHelper.clientWatch;
}

export function createKubeAppsV1Client(world: Zenko): AppsV1Api {
    if (!KubernetesHelper.clientAppsV1) {
        KubernetesHelper.init(world.parameters);
    }
    // @ts-expect-error kube client class is not stable yet
    return KubernetesHelper.clientAppsV1;
}

export function createKubeAppsClient(world: Zenko): AppsApi {
    if (!KubernetesHelper.clientApps) {
        KubernetesHelper.init(world.parameters);
    }
    // @ts-expect-error kube client class is not stable yet
    return KubernetesHelper.clientApps;
}

export function createKubeCustomObjectClient(world: Zenko): CustomObjectsApi {
    if (!KubernetesHelper.customObject) {
        KubernetesHelper.init(world.parameters);
    }
    // @ts-expect-error kube client class is not stable yet
    return KubernetesHelper.customObject;
}

export async function createJobAndWaitForCompletion(
    world: Zenko,
    jobName: string,
    customMetadata?: string
) {
    const batchClient = createKubeBatchClient(world);
    const watchClient = createKubeWatchClient(world);

    const lockFilePath = path.join('/tmp', `${jobName}.lock`);

    let expectedJobName: string | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let dumpedPodLogs = false;
    let watchStart = Date.now();

    // Best-effort: log the job's status plus its pods' status, and the pod logs
    // when a container has failed or restarted, so the reason a cronjob run failed
    // or hung is visible in the test step log itself rather than only in artifacts.
    const logJobDiagnostics = async (reason: string, forceLogs = false): Promise<void> => {
        if (!expectedJobName) {
            return;
        }
        try {
            const current = await batchClient.readNamespacedJob({
                name: expectedJobName,
                namespace: 'default',
            });
            world.logger.info('cronjob status', {
                jobName,
                reason,
                instance: expectedJobName,
                elapsedSec: Math.round((Date.now() - watchStart) / 1000),
                active: current.status?.active,
                succeeded: current.status?.succeeded,
                failed: current.status?.failed,
                conditions: current.status?.conditions,
            });
        } catch (e) {
            world.logger.warn('Failed to read cronjob status', { jobName, e });
        }
        try {
            const coreClient = createKubeCoreClient(world);
            const pods = await coreClient.listNamespacedPod({
                namespace: 'default',
                labelSelector: `batch.kubernetes.io/job-name=${expectedJobName}`,
            });
            for (const pod of pods.items || []) {
                const podName = pod.metadata?.name;
                const containerStatuses = pod.status?.containerStatuses || [];
                const restarted = containerStatuses.some(s => (s.restartCount || 0) > 0);
                const crashed = restarted
                    || containerStatuses.some(s => s.state?.terminated || s.lastState?.terminated);
                world.logger.warn('cronjob pod status', {
                    jobName,
                    reason,
                    podName,
                    phase: pod.status?.phase,
                    containerStatuses: containerStatuses.map(s => ({
                        name: s.name,
                        ready: s.ready,
                        restartCount: s.restartCount,
                        state: s.state,
                        lastState: s.lastState,
                    })),
                });
                if ((forceLogs || (crashed && !dumpedPodLogs)) && podName) {
                    dumpedPodLogs = true;
                    for (const previous of (restarted ? [true, false] : [false])) {
                        try {
                            const log = await coreClient.readNamespacedPodLog({
                                name: podName,
                                namespace: 'default',
                                previous,
                                tailLines: 200,
                            });
                            world.logger.warn('cronjob pod logs', { podName, previous, log });
                        } catch (logErr) {
                            world.logger.warn('Failed to read cronjob pod logs', { podName, previous, logErr });
                        }
                    }
                }
            }
        } catch (err) {
            world.logger.warn('Failed to collect cronjob pod diagnostics', { jobName, err });
        }
    };

    const lockStart = Date.now();
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
            if (tries % 15 === 0) {
                world.logger.info('Waiting to acquire lock (another worker is running this cronjob)', {
                    jobName,
                    waitedSec: Math.round((Date.now() - lockStart) / 1000),
                });
            }
            await Utils.sleep(1000);
        }
    }

    if (!lockAquired) {
        throw new Error(
            `Failed to acquire lock for job ${jobName} after `
            + `${Math.round((Date.now() - lockStart) / 1000)}s; another worker may be stuck running it`,
        );
    }
    world.logger.info('Acquired lock for job', {
        jobName,
        waitedSec: Math.round((Date.now() - lockStart) / 1000),
    });

    try {
        // Read the cron job and prepare the job spec
        const cronJob = await batchClient.readNamespacedCronJob({ name: jobName, namespace: 'default' });
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
        const response = await batchClient.createNamespacedJob({ namespace: 'default', body: job });
        world.logger.debug('Job created', { job: response.metadata });

        expectedJobName = response.metadata?.name;

        watchStart = Date.now();
        // Watch for job completion
        await new Promise<void>((resolve, reject) => {
            // Heartbeat: surface the job's real status + pod state periodically so a
            // silent stall is visible in the step log instead of dead air until the
            // hook timeout fires.
            heartbeat = setInterval(() => {
                void logJobDiagnostics('heartbeat');
            }, 30000);

            void watchClient.watch(
                '/apis/batch/v1/namespaces/default/jobs',
                {},
                (type: string, apiObj, watchObj) => {
                    if (
                        expectedJobName &&
                        (watchObj.object?.metadata?.name as string)?.startsWith?.(expectedJobName)
                    ) {
                        if (watchObj.object?.status?.succeeded) {
                            if (heartbeat) {
                                clearInterval(heartbeat);
                            }
                            world.logger.debug('Job succeeded', { job: job.metadata });
                            resolve();
                        } else if (watchObj.object?.status?.failed) {
                            if (heartbeat) {
                                clearInterval(heartbeat);
                            }
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
        world.logger.error('Error creating or waiting for job completion', {
            jobName,
            err,
        });
        await logJobDiagnostics('job failed', true);
        throw err;
    } finally {
        if (heartbeat) {
            clearInterval(heartbeat);
        }
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
    const clientCore = createKubeCoreClient(world);
    const watchClient = createKubeWatchClient(world);

    try {
        const response = await clientCore.createNamespacedPod({ namespace: 'default', body: podManifest });
        const podName = response.metadata?.name;
        if (waitForCompletion && podName) {
            world.logger.debug('Waiting for pod completion', { podName });

            await new Promise<void>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error(`Pod ${podName} did not complete within ${timeout}ms`));
                }, timeout);

                void watchClient.watch(
                    '/api/v1/namespaces/default/pods',
                    {},
                    (type: string, apiObj, watchObj) => {
                        if (watchObj.object?.metadata?.name === podName) {
                            const phase = watchObj.object?.status?.phase;
                            world.logger.debug('Pod status update', { podName, phase });
                            
                            if (phase === 'Succeeded') {
                                clearTimeout(timeoutId);
                                world.logger.debug('Pod completed successfully', { podName });
                                resolve();
                            } else if (phase === 'Failed') {
                                clearTimeout(timeoutId);
                                world.logger.error('Pod failed', { 
                                    podName, 
                                    status: watchObj.object?.status 
                                });
                                reject(new Error(`Pod ${podName} failed`));
                            }
                        }
                    },
                    err => {
                        world.logger.debug('Watch error callback triggered', { podName, err });
                        clearTimeout(timeoutId);
                        reject(err);
                    }
                );
            });
        }

        // Cleanup if requested
        if (cleanup && podName) {
            world.logger.debug('Cleaning up pod', { podName });
            try {
                await clientCore.deleteNamespacedPod({ name: podName, namespace: 'default' });
            } catch (cleanupErr) {
                world.logger.warn('Failed to cleanup pod', { podName, err: cleanupErr });
            }
        }

        return response;
    } catch (err: unknown) {
        world.logger.error('Failed to create and run pod:', { err });
        throw new Error(`Failed to create and run pod: ${err}`);
    }
}

export async function waitForZenkoToStabilize(
    world: Zenko, needsReconciliation = false, timeout = 15 * 60 * 1000, namespace = 'default') {
    // ZKOP pulls the overlay configuration from Pensieve every 5 seconds
    // So the status might not be updated immediately after the overlay is applied.
    // So, this function will first wait till we detect a reconciliation
    // (deploymentInProgress = true), and then wait for the status to be available
    const startTime = Date.now();
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

    world.logger.debug('Waiting for Zenko to stabilize');
    const zenkoClient = createKubeCustomObjectClient(world);

    while (Date.now() - startTime < timeout) {
        const zenkoCR = await zenkoClient.getNamespacedCustomObject({
            group: 'zenko.io',
            version: 'v1alpha2',
            namespace,
            plural: 'zenkos',
            name: 'end2end',
        }).catch(err => {
            world.logger.error('Error getting Zenko CR', {
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

        world.logger.debug('Checking Zenko CR status', {
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
            return;
        }

        await Utils.sleep(1000);
    }

    throw new Error('Zenko did not stabilize');
}

export async function waitForDataServicesToStabilize(world: Zenko, timeout = 15 * 60 * 1000, namespace = 'default') {
    const startTime = Date.now();
    const annotationKey = 'operator.zenko.io/dependencies';
    const dataServices = ['connector-cloudserver-config', 'backbeat-config'];

    const appsClient = createKubeAppsV1Client(world);

    world.logger.debug('Waiting for data services to stabilize', {
        namespace,
    });

    // First list all deployments, and then filter the ones with an annotation that matches the data services
    const deployments: V1Deployment[] = [];
    const serviceDeployments = await appsClient.listNamespacedDeployment({ namespace });
    for (const deployment of serviceDeployments.items) {
        const annotations = deployment.metadata?.annotations;
        if (annotations && dataServices.some(service => annotations[annotationKey]?.includes(service))) {
            deployments.push(deployment);
        }
    }

    world.logger.debug('Got the list of deployments to check for stabilization', {
        deployments: deployments.map(deployment => deployment.metadata?.name),
    });

    while (Date.now() - startTime < timeout) {
        let allRunning = true;

        // get the deployments in the array, and check in loop if they are ready
        for (const deployment of deployments) {
            const deploymentName = deployment.metadata?.name;
            if (!deploymentName) {
                throw new Error('Deployment name not found');
            }

            const deploymentStatus = await appsClient
                .readNamespacedDeploymentStatus({ name: deploymentName, namespace });
            const replicas = deploymentStatus.status?.replicas;
            const readyReplicas = deploymentStatus.status?.readyReplicas;
            const updatedReplicas = deploymentStatus.status?.updatedReplicas;
            const availableReplicas = deploymentStatus.status?.availableReplicas;

            world.logger.debug('Checking deployment status', {
                deployment: deploymentName,
                replicas,
                readyReplicas,
                updatedReplicas,
                availableReplicas,
            });

            if (replicas !== readyReplicas || replicas !== updatedReplicas || replicas !== availableReplicas) {
                allRunning = false;
                world.logger.debug('Waiting for data service to stabilize', {
                    deployment: deploymentName,
                    replicas,
                    readyReplicas,
                });
            }
        }

        if (allRunning) {
            return true;
        }
        await Utils.sleep(1000);
    }

    throw new Error('Data services did not stabilize');
}

export async function displayCRStatus(world: Zenko, namespace = 'default') {
    const zenkoClient = createKubeCustomObjectClient(world);

    const zenkoCR = await zenkoClient.getNamespacedCustomObject({
        group: 'zenko.io',
        version: 'v1alpha2',
        namespace,
        plural: 'zenkos',
        name: 'end2end',
    }).catch(err => {
        world.logger.error('Error getting Zenko CR', {
            err: err as unknown,
        });
        return null;
    });

    if (!zenkoCR) {
        return;
    }

    world.logger.debug('Checking Zenko CR status', {
        zenkoCR,
    });
}

export async function getDRSource(world: Zenko, namespace = 'default') {
    const zenkoClient = createKubeCustomObjectClient(world);

    const zenkoCR = await zenkoClient.getNamespacedCustomObject({
        group: 'zenko.io',
        version: 'v1alpha1',
        namespace,
        plural: 'zenkodrsources',
        name: 'end2end-source',
    }).catch(err => {
        world.logger.debug('Error getting Zenko CR', {
            err: err as unknown,
        });
    });

    return zenkoCR;
}

export async function getDRSink(world: Zenko, namespace = 'default') {
    const zenkoClient = createKubeCustomObjectClient(world);

    const zenkoCR = await zenkoClient.getNamespacedCustomObject({
        group: 'zenko.io',
        version: 'v1alpha1',
        namespace,
        plural: 'zenkodrsinks',
        name: 'end2end-pra-sink',
    }).catch(err => {
        world.logger.debug('Error getting Zenko CR', {
            err: err as unknown,
        });
    });
    
    return zenkoCR;
}

export async function getPVCFromLabel(world: Zenko, label: string, value: string, namespace = 'default') {
    const coreClient = createKubeCoreClient(world);

    const pvcList = await coreClient.listNamespacedPersistentVolumeClaim({ namespace });
    const pvc = pvcList.items.find((pvc: V1PersistentVolumeClaim) => pvc.metadata?.labels?.[label] === value);

    return pvc;
}

export async function createSecret(
    world: Zenko,
    secretName: string,
    data: Record<string, string>,
    namespace = 'default',
) {
    const coreClient = createKubeCoreClient(world);

    const secret = {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
            name: secretName,
        },
        data,
    };

    try {
        await coreClient.deleteNamespacedSecret({ name: secretName, namespace });
    } catch (err) {
        world.logger.debug('Secret does not exist, creating new', {
            secretName,
            namespace,
            err,
        });
    }

    try {
        const response = await coreClient.createNamespacedSecret({ namespace, body: secret });
        return response;
    } catch (err) {
        world.logger.error('Error creating secret', {
            namespace,
            secret,
            err,
        });
        throw err;
    }
}

export async function getMongoDBConfig(
    world: Zenko,
    namespace = 'default',
) : Promise<{replicaSetHosts: string[]}> {
    const customObjectClient = createKubeCustomObjectClient(world);
    try {
        // Get replicaSetHosts from Zenko CR
        const zenkoCR = await customObjectClient.getNamespacedCustomObject({
            group: 'zenko.io',
            version: 'v1alpha2',
            namespace,
            plural: 'zenkos',
            name: 'end2end',
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mongodbSpec = (zenkoCR as any)?.spec?.mongodb;
        const mongodbConfig = {
            replicaSetHosts: mongodbSpec?.endpoints || [],
        };

        return mongodbConfig;
    } catch (err) {
        world.logger.debug('Error getting MongoDB config from secret and CR', {namespace, err});
        throw err;
    }
}

export async function getLocationConfigs(
    world: Zenko,
    namespace = 'default',
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>> {
    const coreClient = createKubeCoreClient(world);
    try {
        // Get location configurations from connector-cloudserver-config secret
        const secretList = await coreClient.listNamespacedSecret({
            namespace,
            labelSelector: 'app.kubernetes.io/name=connector-cloudserver-config',
        });

        const secret = secretList.items[0];
        const locationConfigData = secret.data?.['locationConfig.json'];
        if (!locationConfigData) {
            throw new Error('locationConfig.json not found in secret');
        }

        const locationConfigJson = Buffer.from(locationConfigData, 'base64').toString('utf-8');
        return JSON.parse(locationConfigJson);
    } catch (err) {
        world.logger.debug('Error getting location configs from secret', { namespace, err });
        throw err;
    }
}

export async function getZenkoVersion(
    world: Zenko,
    namespace = 'default',
): Promise<ZenkoVersion> {
    const customObjectClient = createKubeCustomObjectClient(world);
    try {
        const zenkoVersionList = await customObjectClient.listNamespacedCustomObject({
            group: 'zenko.io',
            version: 'v1alpha1',
            namespace,
            plural: 'zenkoversions',
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
