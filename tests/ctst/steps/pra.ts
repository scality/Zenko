import { Given, Then, When } from '@cucumber/cucumber';
import Zenko from 'world/Zenko';
import ZenkoDrctl from './dr/drctl';
import {
    createSecret,
    displayCRStatus,
    getDRSink,
    getDRSource,
    getPVCFromLabel,
} from './utils/kubernetes';
import { 
    verifyObjectLocation,
} from 'steps/utils/utils';
import { Identity, IdentityEnum, SuperAdmin, Utils } from 'cli-testing';
import { safeJsonParse } from 'common/utils';
import assert from 'assert';

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
    const drSource = await getDRSource(world);
    const drSink = await getDRSink(world);

    world.logger.debug('Zenko DR custom resources', {
        drSink,
        drSource,
    });
}

async function waitForPhase(
    world: Zenko,
    target: 'source' | 'sink',
    state: ZenkoDrSinkPhases | ZenkoDrSourcePhases,
    timeout = 130000,
): Promise<boolean> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
        let phase;

        const currentStatus = await world.zenkoDrCtl?.status({
            sinkZenkoNamespace: 'default',
            sourceZenkoNamespace: 'default',
            sinkZenkoDrInstance: 'end2end-pra-sink',
            sourceZenkoDrInstance: 'end2end-source',
            output: 'json',
        });

        if (!currentStatus) {
            world.logger.debug('Failed to get DR status, retrying', {
                currentStatus,
            });
            await Utils.sleep(1000);
            continue;
        }

        const lines = currentStatus.split('\n');
        let parsedStatus: DrState | null = null;

        for (const line of lines) {
            try {
                const json = safeJsonParse<DrState>(line);
                if (json.ok && json.result?.source && json.result?.source) {
                    parsedStatus = json.result;
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!parsedStatus) {
            world.logger.debug('Failed to parse DR status, retrying', {
                parsedStatus,
            });
            await Utils.sleep(1000);
            continue;
        }

        if (target === 'sink') {
            phase = parsedStatus.sink.crStatus.phase;
        } else {
            phase = parsedStatus.source.crStatus.phase;
        }

        world.logger.debug('current phase', {
            phase,
            target,
        });

        if (phase === state) {
            return true;
        }
        
        await Utils.sleep(1000);
    }

    return false;
}

Given('a DR installed', { timeout: 130000 }, async function (this: Zenko) {
    Identity.useIdentity(IdentityEnum.ACCOUNT, Zenko.sites['source'].accountName);
    const credentials = Identity.getCurrentCredentials();
    await createSecret(this, 'drctl-s3-creds', {
        accessKey: Buffer.from(credentials.accessKeyId).toString('base64'),
        secretAccessKey: Buffer.from(credentials.secretAccessKey).toString('base64'),
    });
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
        sinkS3Endpoint: 'http://s3.zenko.local',
    });
    return;
});

Then('the DR sink should be in phase {string}', { timeout: 360000 }, async function (this: Zenko,state: string) {
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

Then('the DR source should be in phase {string}', { timeout: 360000 }, async function (this: Zenko, state: string) {
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

Then('object {string} should be {string} and have the storage class {string} on DR site',
    async function (this: Zenko, objName: string, objectTransitionStatus: string, storageClass: string) {
        this.resetCommand();
        // use source account: it should have been replicated
        Identity.useIdentity(IdentityEnum.ACCOUNT, Zenko.sites['source'].accountName);

        await verifyObjectLocation.call(this, objName, objectTransitionStatus, storageClass);
    });

Then('the kafka DR volume exists', { timeout: 60000 }, async function (this: Zenko) {
    const volumeClaim = await getPVCFromLabel(this, 'kafka_cr', 'end2end-pra-sink-base-queue');
    this.logger.debug('kafka volume claim', { volumeClaim });
    assert(volumeClaim);
    const volume = await this.zenkoDrCtl?.volumeGet({
        volumeName: volumeClaim.spec?.volumeName,
        timeout: '60s',
    });
    this.logger.debug('kafka volume from drctl', { volume });
    assert(volume);
    const volumeParsed = safeJsonParse<{'volume phase': string, 'volume name': string}>(volume);
    if (!volumeParsed.ok) {
        throw new Error('Failed to parse volume');
    }
    assert(volumeParsed.result!['volume phase'] === 'Bound');
});

When('I uninstall DR', { timeout: 360000 }, async function (this: Zenko) {
    await this.zenkoDrCtl?.uninstall({
        sourceZenkoDrInstance: 'end2end-source',
        sinkZenkoDrInstance: 'end2end-pra-sink',
        wait: true,
        timeout: '6m',
    });
});

Then('the DR custom resources should be deleted', { timeout: 360000 }, async function (this: Zenko) {
    const drSource = await getDRSource(this);
    const drSink = await getDRSink(this);

    assert(!drSource);
    assert(!drSink);
});

Given('access keys for the replicated account', async () => {
    Identity.useIdentity(IdentityEnum.ADMIN, Zenko.sites['sink'].adminIdentityName);
    // The account is the one from the source cluster: it replaces the sink account
    // after the bootstrap phases
    const targetAccount = Zenko.sites['source'].accountName;

    // ensure the account is replicated
    const account = await SuperAdmin.getAccount({
        accountName: targetAccount,
    });
    assert(account);

    const credentials = await SuperAdmin.generateAccountAccessKey({
        accountName: targetAccount,
    });
    // This will replace the source account, and use the sink endpoint instead.
    Identity.addIdentity(IdentityEnum.ACCOUNT, `${targetAccount}-replicated`, credentials, undefined, true);
});
