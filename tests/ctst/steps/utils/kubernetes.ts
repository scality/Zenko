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
        const cronJob = await batchClient.readNamespacedCronJob(jobName, 'default');
        const cronJobSpec = cronJob.body.spec?.jobTemplate.spec;

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
        const response = await batchClient.createNamespacedJob('default', job);
        world.logger.debug('Job created', { job: response.body.metadata });

        const expectedJobName = response.body.metadata?.name;

        // Watch for job completion
        await new Promise<void>((resolve, reject) => {
            void watchClient.watch(
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
        world.logger.error('Error creating or waiting for job completion', {
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
    const clientCore = createKubeCoreClient(world);
    const watchClient = createKubeWatchClient(world);

    try {
        const response = await clientCore.createNamespacedPod('default', podManifest);
        const podName = response.body.metadata?.name;
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
                await clientCore.deleteNamespacedPod(podName, 'default');
            } catch (cleanupErr) {
                world.logger.warn('Failed to cleanup pod', { podName, err: cleanupErr });
            }
        }

        return response.body;
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

    world.logger.debug('Waiting for Zenko to stabilize');
    const zenkoClient = createKubeCustomObjectClient(world);

    while (!status && Date.now() - startTime < timeout) {
        const zenkoCR = await zenkoClient.getNamespacedCustomObject(
            'zenko.io',
            'v1alpha2',
            namespace,
            'zenkos',
            'end2end',
        ).catch(err => {
            world.logger.error('Error getting Zenko CR', {
                err: err as unknown,
            });
            return null;
        });

        if (!zenkoCR) {
            await Utils.sleep(1000);
            continue;
        }

        const conditions: ZenkoStatus = (zenkoCR.body as {
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
            status = true;
        }

        await Utils.sleep(1000);
    }

    if (!status) {
        throw new Error('Zenko did not stabilize');
    }
}

export async function waitForDataServicesToStabilize(world: Zenko, timeout = 15 * 60 * 1000, namespace = 'default') {
    let allRunning = false;
    const startTime = Date.now();
    const annotationKey = 'operator.zenko.io/dependencies';
    const dataServices = ['connector-cloudserver-config', 'backbeat-config'];

    const appsClient = createKubeAppsV1Client(world);

    world.logger.debug('Waiting for data services to stabilize', {
        namespace,
    });

    // First list all deployments, and then filter the ones with an annotation that matches the data services
    const deployments: V1Deployment[] = [];
    const serviceDeployments = await appsClient.listNamespacedDeployment(namespace);
    for (const deployment of serviceDeployments.body.items) {
        const annotations = deployment.metadata?.annotations;
        if (annotations && dataServices.some(service => annotations[annotationKey]?.includes(service))) {
            deployments.push(deployment);
        }
    }

    world.logger.debug('Got the list of deployments to check for stabilization', {
        deployments: deployments.map(deployment => deployment.metadata?.name),
    });

    while (!allRunning && Date.now() - startTime < timeout) {
        allRunning = true;

        // get the deployments in the array, and check in loop if they are ready
        for (const deployment of deployments) {
            const deploymentName = deployment.metadata?.name;
            if (!deploymentName) {
                throw new Error('Deployment name not found');
            }

            const deploymentStatus = await appsClient.readNamespacedDeploymentStatus(deploymentName, namespace);
            const replicas = deploymentStatus.body.status?.replicas;
            const readyReplicas = deploymentStatus.body.status?.readyReplicas;
            const updatedReplicas = deploymentStatus.body.status?.updatedReplicas;
            const availableReplicas = deploymentStatus.body.status?.availableReplicas;

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

        await Utils.sleep(1000);
    }

    if (!allRunning) {
        throw new Error('Data services did not stabilize');
    }

    return allRunning;
}

export async function displayCRStatus(world: Zenko, namespace = 'default') {
    const zenkoClient = createKubeCustomObjectClient(world);

    const zenkoCR = await zenkoClient.getNamespacedCustomObject(
        'zenko.io',
        'v1alpha2',
        namespace,
        'zenkos',
        'end2end',
    ).catch(err => {
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

    const zenkoCR = await zenkoClient.getNamespacedCustomObject(
        'zenko.io',
        'v1alpha1',
        namespace,
        'zenkodrsources',
        'end2end-source',
    ).catch(err => {
        world.logger.debug('Error getting Zenko CR', {
            err: err as unknown,
        });
    });

    return zenkoCR?.body;
}

export async function getDRSink(world: Zenko, namespace = 'default') {
    const zenkoClient = createKubeCustomObjectClient(world);

    const zenkoCR = await zenkoClient.getNamespacedCustomObject(
        'zenko.io',
        'v1alpha1',
        namespace,
        'zenkodrsinks',
        'end2end-pra-sink',
    ).catch(err => {
        world.logger.debug('Error getting Zenko CR', {
            err: err as unknown,
        });
    });
    
    return zenkoCR?.body;
}

export async function getPVCFromLabel(world: Zenko, label: string, value: string, namespace = 'default') {
    const coreClient = createKubeCoreClient(world);

    const pvcList = await coreClient.listNamespacedPersistentVolumeClaim(namespace);
    const pvc = pvcList.body.items.find((pvc: V1PersistentVolumeClaim) => pvc.metadata?.labels?.[label] === value);

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
        await coreClient.deleteNamespacedSecret(secretName, namespace);
    } catch (err) {
        world.logger.debug('Secret does not exist, creating new', {
            secretName,
            namespace,
            err,
        });
    }

    try {
        const response = await coreClient.createNamespacedSecret(namespace, secret);
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
        const zenkoCR = await customObjectClient.getNamespacedCustomObject(
            'zenko.io',
            'v1alpha2',
            namespace,
            'zenkos',
            'end2end'
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mongodbSpec = (zenkoCR.body as any)?.spec?.mongodb;
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
        const secretList = await coreClient.listNamespacedSecret(
            namespace,
            undefined,
            undefined,
            undefined,
            undefined,
            'app.kubernetes.io/name=connector-cloudserver-config'
        );

        const secret = secretList.body.items[0];
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
        const zenkoVersionList = await customObjectClient.listNamespacedCustomObject(
            'zenko.io',
            'v1alpha1',
            namespace,
            'zenkoversions'
        );
        const zenkoVersionItems = (zenkoVersionList.body as { items: ZenkoVersion[] })?.items;
        if (!zenkoVersionItems || zenkoVersionItems.length === 0) {
            throw new Error('No ZenkoVersion resources found');
        }

        return zenkoVersionItems[0];
    } catch (err) {
        world.logger.debug('Error getting ZenkoVersion resource', { namespace, err });
        throw err;
    }
}

