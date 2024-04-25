/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { KubernetesHelper, Utils } from 'cli-testing';
import Zenko from 'world/Zenko';
import { V1Job, Watch, V1ObjectMeta } from '@kubernetes/client-node';

export function createKubeBatchClient(context: Zenko) {
    if (!KubernetesHelper.clientBatch) {
        KubernetesHelper.init(context.parameters);
    }
    return KubernetesHelper.clientBatch;
}

export function createKubeCoreClient(context: Zenko) {
    if (!KubernetesHelper.clientBatch) {
        KubernetesHelper.init(context.parameters);
    }
    return KubernetesHelper.clientCore;
}

export function createKubeWatchClient(context: Zenko) {
    if (!KubernetesHelper.clientWatch) {
        KubernetesHelper.init(context.parameters);
    }
    return KubernetesHelper.clientWatch as Watch;
}

export async function createJobAndWaitForCompletion(context: Zenko, jobName: string) {
    const batchClient = createKubeBatchClient(context);
    const watchClient = createKubeWatchClient(context);
    try {
        context.parameters.logger?.debug('creating job', {
            jobName,
        });
    
        const cronJob = await batchClient!.readNamespacedCronJob(jobName, 'default');
        const cronJobSpec = cronJob.body.spec?.jobTemplate.spec;
        const job = new V1Job();
        const metadata = new V1ObjectMeta();
        job.apiVersion = 'batch/v1';
        job.kind = 'Job';
        job.spec = cronJobSpec;
        metadata.name = `${jobName}-${Utils.randomString()}`;
        metadata.annotations = {
            'cronjob.kubernetes.io/instantiate': 'ctst',
        };
        job.metadata = metadata;
    
        context.parameters.logger?.debug('job spec', {
            job: job.spec,
            cronJob,
            metadata,
            cronJobSpec,
        });
    
        const response = await batchClient!.createNamespacedJob('default', job);
        context.parameters.logger?.debug('job created', {
            job: response.body.metadata,
        });
    
        await new Promise<void>((resolve, reject) => {
            void watchClient.watch(
                '/apis/batch/v1/namespaces/default/jobs',
                {},
                (type, apiObj, watchObj) => {
                    if (watchObj.metadata?.name === job.metadata?.name) {
                        if (watchObj.status?.succeeded) {
                            context.parameters.logger?.debug('job succeeded', {
                                job: job.metadata,
                            });
                            resolve();
                        } else if (watchObj.status?.failed) {
                            context.parameters.logger?.debug('job failed', {
                                job: job.metadata,
                            });
                            reject(new Error('job failed'));
                        }
                    }
                }, reject);
        });
    } catch (err: unknown) {
        context.parameters.logger?.error('error creating job', {
            jobName,
            err,
        });
        throw err;
    }
}
