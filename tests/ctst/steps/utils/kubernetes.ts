/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { KubernetesHelper, Utils } from 'cli-testing';
import Zenko from 'world/Zenko';
import { V1Job, Watch, V1ObjectMeta } from '@kubernetes/client-node';

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
        world.parameters.logger?.debug('job created', {
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
                            world.parameters.logger?.debug('job succeeded', {
                                job: job.metadata,
                            });
                            resolve();
                        } else if (watchObj.object?.status?.failed) {
                            world.parameters.logger?.debug('job failed', {
                                job: job.metadata,
                            });
                            reject(new Error('job failed'));
                        }
                    }
                }, reject);
        });
    } catch (err: unknown) {
        world.parameters.logger?.error('error creating job', {
            jobName,
            err,
        });
        throw err;
    }
}
