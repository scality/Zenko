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
    putObject,
    restoreObject,
    verifyObjectLocation,
} from 'steps/utils/utils';
import { Constants, Identity, IdentityEnum, SuperAdmin, Utils } from 'cli-testing';
import { safeJsonParse } from 'common/utils';
import assert from 'assert';
import { EntityType } from 'world/Zenko';

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

async function installPRA(world: Zenko, sinkS3Endpoint = 'http://s3.zenko.local', timeout = '30m') {
    const kafkaExternalIpOption = world.parameters.KafkaExternalIps ?
        { kafkaExternalIps: world.parameters.KafkaExternalIps } :
        { kafkaExternalIpsDiscovery: true };

    return world.zenkoDrCtl?.install({
        sourceZenkoDrInstance: 'end2end-source',
        sinkZenkoDrInstance: 'end2end-pra-sink',
        kafkaPersistenceSize: '1Gi',
        kafkaPersistenceStorageClassName: '-',
        kafkaPersistenceSelector: 'app=kafka-dr-sink',
        locations: 'e2e-cold', // comma-separated list
        s3Bucket: 'dump-db',
        sinkZenkoInstance: 'end2end-pra',
        sinkZenkoNamespace: 'default',
        sourceZenkoInstance: 'end2end',
        sourceZenkoNamespace: 'default',
        sourceS3Endpoint: 'http://s3.zenko.local',
        sinkS3Endpoint,
        prometheusService: world.parameters.PrometheusService,
        // prometheusHostname: 'prom.dr.zenko.local', // could be any name, cert will be auto-generated
        prometheusExternalIpsDiscovery: true,
        prometheusDisableTls: true,
        forceRotateServiceCredentials: world.praInstallCount > 0,
        ...kafkaExternalIpOption,
        timeout,
    });
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
            outputFormat: 'json',
        });

        if (!currentStatus) {
            world.logger.debug('Failed to get DR status', {
                currentStatus,
            });
            throw new Error('Failed to get DR status');
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
            } catch (err) {
                world.logger.debug('Failed to parse DR status line', { line, err });
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

const installTimeout = 360000;
Given('a DR installed', { timeout: installTimeout + 2000 }, async function (this: Zenko) {
    Identity.useIdentity(IdentityEnum.ACCOUNT, Zenko.sites['source'].accountName);
    const credentials = Identity.getCurrentCredentials();
    await createSecret(this, 'drctl-s3-creds', {
        accessKey: Buffer.from(credentials.accessKeyId).toString('base64'),
        secretAccessKey: Buffer.from(credentials.secretAccessKey).toString('base64'),
    });
    await installPRA(this, undefined, `${installTimeout.toString()}ms`);
    this.praInstallCount += 1;
    return;
});

Given('a DR failing to be installed', { timeout: 130000 }, async function (this: Zenko) {
    Identity.useIdentity(IdentityEnum.ACCOUNT, Zenko.sites['source'].accountName);
    const credentials = Identity.getCurrentCredentials();
    await createSecret(this, 'drctl-s3-creds', {
        accessKey: Buffer.from(credentials.accessKeyId).toString('base64'),
        secretAccessKey: Buffer.from(credentials.secretAccessKey).toString('base64'),
    });
    await installPRA(this, 'http://s3.dr.zenko.local');
    return;
});

Then('the DR sink should be in phase {string}', { timeout: 360000 }, async function (this: Zenko, state: string) {
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

    const res = await waitForPhase(this, 'sink', targetPhase);
    assert(res);
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

    const res = await waitForPhase(this, 'source', targetPhase);
    assert(res);
});

Then('object {string} should {string} be {string} and have the storage class {string} on {string} site',
    { timeout: 360000 },
    async function (
        this: Zenko,
        objName: string,
        isVerb: string,
        objectTransitionStatus: string,
        storageClass: string,
        site: string) {
        this.resetCommand();
        if (site === 'DR') {
            Identity.useIdentity(IdentityEnum.ACCOUNT, `${Zenko.sites['source'].accountName}-replicated`);
        } else {
            Identity.useIdentity(IdentityEnum.ACCOUNT, Zenko.sites['source'].accountName);
        }
        try {
            await verifyObjectLocation.call(this, objName, objectTransitionStatus, storageClass);
            if (isVerb === 'not') {
                throw new Error(`Object ${objName} should not be ${objectTransitionStatus}`);
            }
        } catch (err) {
            if (isVerb !== 'not') {
                throw err;
            }
            assert(err);
        }
    });

When('the DATA_ACCESSOR user tries to perform PutObject on {string} site', { timeout: 5 * 60 * 1000 },
    async function (this: Zenko, site: string) {
        if (site === 'DR') {
            Identity.useIdentity(IdentityEnum.ACCOUNT, `${Zenko.sites['source'].accountName}-replicated`);
        } else {
            Identity.useIdentity(IdentityEnum.ACCOUNT, Zenko.sites['source'].accountName);
        }
        this.resetCommand();
        this.addToSaved('accountName', Zenko.sites['source'].accountName);

        // At this point, the role may take some time to be propagated
        // so, tolerate up to 5m of retries
        let conditionOk = false;
        while (!conditionOk) {
            try {
                await this.setupEntity(EntityType.DATA_ACCESSOR);
                conditionOk = true;
            } catch (err) {
                this.logger.error('Failed to setup entity', { err });
            }
        }

        await putObject(this);
    });

const volumeTimeout = 60000;
Then('the kafka DR volume exists', { timeout: volumeTimeout + 2000 }, async function (this: Zenko) {
    const volumeClaim = await getPVCFromLabel(this, 'kafka_cr', 'end2end-pra-sink-base-queue');
    this.logger.debug('kafka volume claim', { volumeClaim });
    assert(volumeClaim);
    const volume = await this.zenkoDrCtl?.volumeGet({
        volumeName: volumeClaim.spec?.volumeName,
        timeout: `${volumeTimeout.toString()}ms`,
    });
    this.logger.debug('kafka volume from drctl', { volume });
    assert(volume);
    const volumeParsed = safeJsonParse<{'volume phase': string, 'volume name': string}>(volume);
    if (!volumeParsed.ok) {
        throw new Error('Failed to parse volume');
    }
    assert(volumeParsed.result!['volume phase'] === 'Bound');
});

const failoverTimeout = 360000;
When ('I request the failover state for the DR', { timeout: failoverTimeout + 2000 }, async function (this: Zenko) {
    await this.zenkoDrCtl?.failover({
        sinkZenkoDrNamespace: 'default',
        sinkZenkoDrInstance: 'end2end-pra-sink',
        wait: true,
        timeout: `${failoverTimeout.toString()}ms`,
    });
});

const failbackTimeout = 360000;
When ('I resume operations for the DR', { timeout: failbackTimeout + 2000 }, async function (this: Zenko) {
    await this.zenkoDrCtl?.failback({
        sinkZenkoDrNamespace: 'default',
        sinkZenkoDrInstance: 'end2end-pra-sink',
        wait: true,
        timeout: `${failbackTimeout.toString()}ms`,
    });
});

const pauseTimeout = 360000;
When('I pause the DR', { timeout: pauseTimeout + 2000 }, async function (this: Zenko) {
    await this.zenkoDrCtl?.replicationPause({
        sourceZenkoDrInstance: 'end2end-source',
        sinkZenkoDrInstance: 'end2end-pra-sink',
        sinkZenkoDrNamespace: 'default',
        sourceZenkoDrNamespace: 'default',
        wait: true,
        timeout: `${pauseTimeout.toString()}ms`,
    });
});

const resumeTimeout = 360000;
When('I resume the DR', { timeout: resumeTimeout + 2000 }, async function (this: Zenko) {
    await this.zenkoDrCtl?.replicationResume({
        sourceZenkoDrInstance: 'end2end-source',
        sinkZenkoDrInstance: 'end2end-pra-sink',
        sinkZenkoNamespace: 'default',
        sourceZenkoNamespace: 'default',
        wait: true,
        timeout: `${resumeTimeout.toString()}ms`,
    });
});

const uninstallTimeout = 360000;
When('I uninstall DR', { timeout: uninstallTimeout + 2000 }, async function (this: Zenko) {
    await this.zenkoDrCtl?.uninstall({
        sourceZenkoDrInstance: 'end2end-source',
        sinkZenkoDrInstance: 'end2end-pra-sink',
        sinkZenkoNamespace: 'default',
        sourceZenkoNamespace: 'default',
        wait: true,
        timeout: `${uninstallTimeout.toString()}ms`,
    });
});

Then('the DR custom resources should be deleted', { timeout: 360000 }, async function (this: Zenko) {
    const drSource = await getDRSource(this);
    const drSink = await getDRSink(this);

    assert(!drSource);
    assert(!drSink);
});

Given('access keys for the replicated account', { timeout: 360000 }, async () => {
    Identity.useIdentity(IdentityEnum.ADMIN, Zenko.sites['sink'].adminIdentityName);
    // The account is the one from the source cluster: it replaces the sink account
    // after the bootstrap phases
    const targetAccount = Zenko.sites['source'].accountName;

    let account;
    let remaining = Constants.MAX_ACCOUNT_CHECK_RETRIES;
    account = await SuperAdmin.getAccount({
        accountName: targetAccount,
    });
    while (!account && remaining > 0) {
        await Utils.sleep(500);
        account = await SuperAdmin.getAccount({
            accountName: targetAccount,
        });
        remaining--;
    }
    assert(account);

    const credentials = await SuperAdmin.generateAccountAccessKey({
        accountName: targetAccount,
    });

    Identity.addIdentity(IdentityEnum.ACCOUNT, `${targetAccount}-replicated`, credentials, undefined, true);
});

When('i restore object {string} for {int} days on {string} site',
    async function (this: Zenko, objectName: string, days: number, site: string) {
        this.resetCommand();
        if (site === 'DR') {
            Identity.useIdentity(IdentityEnum.ACCOUNT, `${Zenko.sites['source'].accountName}-replicated`);
        } else {
            Identity.useIdentity(IdentityEnum.ACCOUNT, Zenko.sites['source'].accountName);
        }
        await restoreObject.call(this, objectName, days);
    });
