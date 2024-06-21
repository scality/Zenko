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

export function createKubeBatchClient(world: Zenko) {
    if (!KubernetesHelper.clientBatch) {
        KubernetesHelper.init(world.parameters);
    }
    return KubernetesHelper.clientBatch;
}

export function createKubeCoreClient(world: Zenko) {
    if (!KubernetesHelper.clientBatch) {
        KubernetesHelper.init(world.parameters);
    }
    return KubernetesHelper.clientCore;
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
        const cronJob = await batchClient!.readNamespacedCronJob(jobName, 'default');
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

        const response = await batchClient!.createNamespacedJob('default', job);
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

export async function waitForZenkoToStabilize(world: Zenko, namespace = 'default') {
    // Look at Zenko CR status, and wait for the .status.conditions[i].DeploymentFailure .status to be false,
    // same for DeploymentInProgress, and true for Available
    const timeout = 15 * 60 * 1000;
    const startTime = Date.now();
    let status = false;
    let deploymentFailure = false;
    let deploymentInProgress = false;
    let available = false;

    world.logger.info('Waiting for Zenko to stabilize');
    // use kube client to look at the cr named "zenko"
    const zenkoClient = createKubeCustomObjectClient(world);

    // list all custom objects in the namespace
    const zenkoCRs = await zenkoClient.listNamespacedCustomObject(
        'zenko.io',
        'v1alpha2',
        namespace,
        'zenkos',
    ).catch((err) => {
        world.logger.error('Error listing Zenko CRs', {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            err,
        });
        return null;
    });

    world.logger.info('Got the list of Zenko CRs', {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        zenkoCRs,
    });

    while (!status && Date.now() - startTime < timeout) {
        const zenkoCR = await zenkoClient.getNamespacedCustomObject(
            'zenko.io',
            'v1alpha2',
            namespace,
            'zenkos',
            'end2end',
        ).catch((err) => {
            world.logger.error('Error getting Zenko CR', {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                err,
            });
            return null;
        });

        if (!zenkoCR) {
            await Utils.sleep(1000);
            continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const conditions: any = zenkoCR.body;

        world.logger.info('Checking Zenko CR status', {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            conditions,
        });

        if (conditions.status.DeploymentFailure) {
            deploymentFailure = true;
        }
        
        if (conditions.status.DeploymentInProgress) {
            deploymentInProgress = true;
        }

        if (conditions.status.Available) {
            available = true;
        }

        if (!deploymentFailure && !deploymentInProgress && available) {
            status = true;
        }

        await Utils.sleep(1000);        
    }

    if (!status) {
        throw new Error('Zenko did not stabilize');
    }
}

export async function waitForDataServicesToStabilize(world: Zenko, namespace = 'default') {
    let allRunning = false;
    const startTime = Date.now();
    const timeout = 15 * 60 * 1000;
    const annotationKey = 'operator.zenko.io/dependencies';
    const dataServices = ['connector-cloudserver-config', 'backbeat-config'];

    const appsClient = createKubeAppsV1Client(world);

    world.logger.info('Waiting for data services to stabilize', {
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

    world.logger.info('Got the list of deployments to check for stabilization', {
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

            world.logger.info('Checking deployment status', {
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
