import KubernetesHelper from 'cli-testing/utils/KubernetesHelper';
import { logger } from './logger';
import { sleep } from 'cli-testing/utils/utils';

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
    zenkoName: string;
    timeout?: number;
}

/**
 * Wait for Zenko to stabilize: ensure the CR is ready and stable
 * @param options - Zenko status options
 * @returns Promise that resolves when Zenko is stabilized
 */
export async function waitForZenkoToStabilize(options: ZenkoStatusOptions): Promise<void> {
    const { namespace, zenkoName, timeout = 15 * 60 * 1000 } = options;

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

    logger.info(`Waiting for Zenko instance '${zenkoName}' to stabilize...`);

    while (!status && Date.now() - startTime < timeout) {
        KubernetesHelper.init({});
        const zenkoCR = await KubernetesHelper.getCustomObject()!.getNamespacedCustomObject({
            group: 'zenko.io',
            version: 'v1alpha2',
            namespace,
            plural: 'zenkos',
            name: zenkoName
        }).catch((err: any) => {
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
        throw new Error(`Zenko instance '${zenkoName}' did not stabilize within ${timeout / 1000} seconds`);
    }

    logger.info(`Zenko instance '${zenkoName}' is ready and stable`);
}
