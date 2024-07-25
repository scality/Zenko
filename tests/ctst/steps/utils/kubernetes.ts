/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
} from '@kubernetes/client-node';

type ZenkoStatusValue = {
    lastTransitionTime: string,
    message: string,
    status: 'True' | 'False',
    reason?: string,
    type: 'DeploymentFailure' | 'DeploymentInProgress' | 'Available',
};

type ZenkoStatus = ZenkoStatusValue[];

export function createKubeBatchClient(world: Zenko) {
    if (!KubernetesHelper.clientBatch) {
        KubernetesHelper.init(world.parameters);
    }
    return KubernetesHelper.clientBatch!;
}

export function createKubeCoreClient(world: Zenko) {
    if (!KubernetesHelper.clientBatch) {
        KubernetesHelper.init(world.parameters);
    }
    return KubernetesHelper.clientCore!;
}

export function createKubeWatchClient(world: Zenko) {
    if (!KubernetesHelper.clientWatch) {
        KubernetesHelper.init(world.parameters);
    }
    return KubernetesHelper.clientWatch as Watch;
}

export function createKubeAppsV1Client(world: Zenko) {
    if (!KubernetesHelper.clientAppsV1) {
        KubernetesHelper.init(world.parameters);
    }
    return KubernetesHelper.clientAppsV1 as AppsV1Api;
}

export function createKubeAppsClient(world: Zenko) {
    if (!KubernetesHelper.clientApps) {
        KubernetesHelper.init(world.parameters);
    }
    return KubernetesHelper.clientApps as AppsApi;
}

export function createKubeCustomObjectClient(world: Zenko) {
    if (!KubernetesHelper.customObject) {
        KubernetesHelper.init(world.parameters);
    }
    return KubernetesHelper.customObject as CustomObjectsApi;
}

export async function createJobAndWaitForCompletion(world: Zenko, jobName: string, customMetadata?: string) {
    const batchClient = createKubeBatchClient(world);
    const watchClient = createKubeWatchClient(world);
    try {
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
            metadata.annotations = {
                custom: customMetadata,
            };
        }
        job.metadata = metadata;

        const response = await batchClient.createNamespacedJob('default', job);
        world.logger.debug('job created', {
            job: response.body.metadata,
        });

        const expectedJobName = response.body.metadata?.name;

        await new Promise<void>((resolve, reject) => {
            void watchClient.watch(
                '/apis/batch/v1/namespaces/default/jobs',
                {},
                (type: string, apiObj, watchObj) => {
                    if (job.metadata?.name && expectedJobName &&
                        (watchObj.object?.metadata?.name as string)?.startsWith?.(expectedJobName)) {
                        if (watchObj.object?.status?.succeeded) {
                            world.logger.debug('job succeeded', {
                                job: job.metadata,
                            });
                            resolve();
                        } else if (watchObj.object?.status?.failed) {
                            world.logger.debug('job failed', {
                                job: job.metadata,
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                object: watchObj.object,
                            });
                            reject(new Error('job failed'));
                        }
                    }
                }, reject);
        });
    } catch (err: unknown) {
        world.logger.error('error creating job', {
            jobName,
            err,
        });
        throw err;
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

// same but for end2end-dr-source and end2end-dr-sink
export async function displayDRSourceStatus(world: Zenko, namespace = 'default') {
    const zenkoClient = createKubeCustomObjectClient(world);

    const zenkoCR = await zenkoClient.getNamespacedCustomObject(
        'zenko.io',
        'v1alpha1',
        namespace,
        'zenkodrsources',
        'end2end-source',
    ).catch(err => {
        world.logger.error('Error getting Zenko CR', {
            err: err as unknown,
        });
        return null;
    });

    if (!zenkoCR) {
        return;
    }

    world.logger.debug('Checking Zenko DR Source CR status', {
        zenkoCR,
    });
}

export async function displayDRSinkStatus(world: Zenko, namespace = 'default') {
    const zenkoClient = createKubeCustomObjectClient(world);

    const zenkoCR = await zenkoClient.getNamespacedCustomObject(
        'zenko.io',
        'v1alpha1',
        namespace,
        'zenkodrsinks',
        'end2end-pra-sink',
    ).catch(err => {
        world.logger.error('Error getting Zenko CR', {
            err: err as unknown,
        });
        return null;
    });

    if (!zenkoCR) {
        return;
    }

    world.logger.debug('Checking Zenko DR Sink CR status', {
        zenkoCR,
    });
}

export async function getPVCFromLabel(world: Zenko, label: string, value: string, namespace = 'default') {
    const coreClient = createKubeCoreClient(world);

    const pvcList = await coreClient.listNamespacedPersistentVolumeClaim(namespace);
    const pvc = pvcList.body.items.find(pvc => pvc.metadata?.labels?.[label] === value);

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

    const response = await coreClient.createNamespacedSecret(namespace, secret);

    return response;
}
