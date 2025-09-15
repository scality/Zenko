import { KubernetesClient } from './k8s';
import { logger } from './logger';

interface ZenkoStatusValue {
    lastTransitionTime: string;
    message: string;
    status: 'True' | 'False';
    reason?: string;
    type: 'DeploymentFailure' | 'DeploymentInProgress' | 'Available';
}

type ZenkoStatus = ZenkoStatusValue[];

interface ZenkoStatusOptions {
    namespace: string;
    instanceId?: string;
    timeout?: number;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitForZenkoToStabilize(options: ZenkoStatusOptions): Promise<void> {
    const { namespace, instanceId = 'end2end', timeout = 15 * 60 * 1000 } = options;
    const k8s = new KubernetesClient();

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

    logger.info(`Waiting for Zenko instance '${instanceId}' to stabilize...`);

    while (!status && Date.now() - startTime < timeout) {
        const zenkoCR = await k8s.customObjectsApi.getNamespacedCustomObject({
            group: 'zenko.io',
            version: 'v1alpha2',
            namespace,
            plural: 'zenkos',
            name: instanceId
        }).catch(err => {
            logger.debug('Error getting Zenko CR', {
                error: err instanceof Error ? err.message : String(err),
            });
            return null;
        });

        if (!zenkoCR) {
            await sleep(5000);
            continue;
        }

        const conditions: ZenkoStatus = (zenkoCR as any)?.status?.conditions || [];

        conditions.forEach(condition => {
            if (condition.type === 'DeploymentFailure') {
                deploymentFailure = condition;
            } else if (condition.type === 'DeploymentInProgress') {
                deploymentInProgress = condition;
            } else if (condition.type === 'Available') {
                available = condition;
            }
        });

        logger.debug('Checking Zenko CR status', {
            deploymentFailure: `${deploymentFailure.type}=${deploymentFailure.status}`,
            deploymentInProgress: `${deploymentInProgress.type}=${deploymentInProgress.status}`,
            available: `${available.type}=${available.status}`,
        });

        if (deploymentFailure.status === 'False' &&
            deploymentInProgress.status === 'False' &&
            available.status === 'True'
        ) {
            status = true;
            break;
        }

        if (deploymentFailure.status === 'True') {
            throw new Error(`Zenko deployment failed: ${deploymentFailure.message}`);
        }

        await sleep(5000);
    }

    if (!status) {
        throw new Error(`Zenko instance '${instanceId}' did not stabilize within ${timeout / 1000} seconds`);
    }

    logger.info(`Zenko instance '${instanceId}' is ready and stable`);
}
