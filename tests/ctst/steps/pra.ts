import { Given, Then } from '@cucumber/cucumber';
import Zenko from 'world/Zenko';
import ZenkoDrctl from './dr/drctl';
import { displayCRStatus, displayDRSinkStatus, displayDRSourceStatus } from './utils/kubernetes';
import { 
    verifyObjectLocation,
} from 'steps/utils/utils';
import { Identity, IdentityEnum, Utils } from 'cli-testing';
import { safeJsonParse } from 'common/utils';

enum ZenkoDrSinkPhases {
    ZenkoDRSinkPhaseNew = 'New',
    ZenkoDRSinkPhaseBootstrapWaiting = 'Bootstrap:Waiting',
    ZenkoDRSinkPhaseBootstrapReceiving = 'Bootstrap:Receiving',
    ZenkoDRSinkPhaseBootstrapFailed = 'Bootstrap:Failed',
    ZenkoDRSinkPhaseRunning = 'Running',
    ZenkoDRSinkPhasePaused = 'Paused',
    ZenkoDRSinkPhaseFailover = 'Failover',
}

enum ZenkoDrSourcePhases {
    ZenkoDRSourcePhaseNew = 'New',
    ZenkoDRSourcePhaseBootstrapWaiting = 'Bootstrap:Waiting',
    ZenkoDRSourcePhaseBootstrapSending = 'Bootstrap:Sending',
    ZenkoDRSourcePhaseBootstrapFailed = 'Bootstrap:Failed',
    ZenkoDRSourcePhaseRunning = 'Running',
    ZenkoDRSourcePhasePaused = 'Paused',
}

interface DrState {
    source: {
        crStatus: {
            phase: ZenkoDrSourcePhases;
        },
    };
    sink: {
        crStatus: {
            phase: ZenkoDrSinkPhases;
        },
    };
}

export function preparePRA(world: Zenko) {
    // eslint-disable-next-line no-param-reassign
    world.zenkoDrCtl = new ZenkoDrctl(world);
}

export async function displayDebuggingInformation(world: Zenko) {
    await displayCRStatus(world);
    await displayDRSinkStatus(world);
    await displayDRSourceStatus(world);
}

async function waitForPhase(
    world: Zenko,
    target: 'source' | 'sink',
    state: ZenkoDrSinkPhases | ZenkoDrSourcePhases,
    timeout = 130000,
): Promise<boolean> {
    const start = Date.now();
    let currentPhase;
    
    while (Date.now() - start < timeout) {
        let currentStatus;
        let phase;

        if (target === 'sink') {
            currentStatus = await world.zenkoDrCtl?.status({
                sinkZenkoDrInstance: 'end2end-pra-sink',
                sourceZenkoDrInstance: 'end2end-source',
                output: 'json',
            });
        } else {
            currentStatus = await world.zenkoDrCtl?.status({
                sourceZenkoDrInstance: 'end2end-source',
                sinkZenkoDrInstance: 'end2end-pra-sink',
                output: 'json',
            });
        }

        if (!currentStatus) {
            world.logger.debug('Failed to get DR status, retrying', {
                currentStatus,
            });
            await Utils.sleep(1000);
            break;
        }

        const parsedStatus = safeJsonParse(currentStatus);

        if (!parsedStatus.ok) {
            world.logger.debug('Failed to parse DR status, retrying', {
                parsedStatus,
            });
            await Utils.sleep(1000);
            break;
        }

        if (target === 'sink') {
            phase = (parsedStatus.result as DrState).sink.crStatus.phase;
        } else {
            phase = (parsedStatus.result as DrState).source.crStatus.phase;
        }

        world.logger.debug('current phase', {
            phase,
            target,
        });

        if (currentPhase === state) {
            return true;
        }
        
        await Utils.sleep(1000);
    }

    return false;
}

Given('a DR installed', { timeout: 130000 }, async function (this: Zenko) {
    await this.zenkoDrCtl?.install({
        sourceZenkoDrInstance: 'end2end-source',
        sinkZenkoDrInstance: 'end2end-pra-sink',
        kafkaPersistenceSize: '1Gi',
        kafkaPersistenceStorageClassName: 'standard',
        locations: 'e2e-cold',
        s3Bucket: 'dump-db',
        sinkZenkoInstance: 'end2end-pra',
        sinkZenkoNamespace: 'default',
        sourceZenkoInstance: 'end2end',
        sourceZenkoNamespace: 'default',
        sourceS3Endpoint: 'http://s3.zenko.local',
        sinkS3Endpoint: 'http://s3.dr.zenko.local',
    });
    return;
});

Then('the DR sink should be in phase {string}', { timeout: 130000 }, async function (this: Zenko,state: string) {
    let targetPhase;
    switch (state) {
    case 'New':
        targetPhase = ZenkoDrSinkPhases.ZenkoDRSinkPhaseNew;
        break;
    case 'Bootstrap:Waiting':
        targetPhase = ZenkoDrSinkPhases.ZenkoDRSinkPhaseBootstrapWaiting;
        break;
    case 'Bootstrap:Receiving':
        targetPhase = ZenkoDrSinkPhases.ZenkoDRSinkPhaseBootstrapReceiving;
        break;
    case 'Bootstrap:Failed':
        targetPhase = ZenkoDrSinkPhases.ZenkoDRSinkPhaseBootstrapFailed;
        break;
    case 'Running':
        targetPhase = ZenkoDrSinkPhases.ZenkoDRSinkPhaseRunning;
        break;
    case 'Paused':
        targetPhase = ZenkoDrSinkPhases.ZenkoDRSinkPhasePaused;
        break;
    case 'Failover':
        targetPhase = ZenkoDrSinkPhases.ZenkoDRSinkPhaseFailover;
        break;
    default:
        throw new Error(`Unknown state ${state}`);
    }

    await waitForPhase(this, 'sink', targetPhase);
});

Then('the DR source should be in phase {string}', { timeout: 130000 }, async function (this: Zenko, state: string) {
    let targetPhase;
    switch (state) {
    case 'New':
        targetPhase = ZenkoDrSourcePhases.ZenkoDRSourcePhaseNew;
        break;
    case 'Bootstrap:Waiting':
        targetPhase = ZenkoDrSourcePhases.ZenkoDRSourcePhaseBootstrapWaiting;
        break;
    case 'Bootstrap:Sending':
        targetPhase = ZenkoDrSourcePhases.ZenkoDRSourcePhaseBootstrapSending;
        break;
    case 'Bootstrap:Failed':
        targetPhase = ZenkoDrSourcePhases.ZenkoDRSourcePhaseBootstrapFailed;
        break;
    case 'Running':
        targetPhase = ZenkoDrSourcePhases.ZenkoDRSourcePhaseRunning;
        break;
    case 'Paused':
        targetPhase = ZenkoDrSourcePhases.ZenkoDRSourcePhasePaused;
        break;
    default:
        throw new Error(`Unknown state ${state}`);
    }

    await waitForPhase(this, 'source', targetPhase);
});

Then('object {string} should be {string} and have the storage class {string} on {string} site',
    async function (this: Zenko, objName: string, objectTransitionStatus: string, storageClass: string, site: string) {
        this.resetCommand();
        if (site === 'DR') {
            Identity.useIdentity(IdentityEnum.ACCOUNT, Zenko.sites['sink'].accountName);
        } else {
            Identity.useIdentity(IdentityEnum.ACCOUNT, Zenko.sites['source'].accountName);
        }

        await verifyObjectLocation.call(this, objName, objectTransitionStatus, storageClass);
    });
