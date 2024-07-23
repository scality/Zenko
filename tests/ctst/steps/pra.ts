import { Given, Then } from '@cucumber/cucumber';
import Zenko from 'world/Zenko';
import ZenkoDrctl from './dr/drctl';
import { displayCRStatus, displayDRSinkStatus, displayDRSourceStatus } from './utils/kubernetes';
import { 
    verifyObjectLocation,
} from 'steps/utils/utils';
import { Identity, IdentityEnum } from 'cli-testing';

export function preparePRA(world: Zenko) {
    // eslint-disable-next-line no-param-reassign
    world.zenkoDrCtl = new ZenkoDrctl(world);
}

export async function displayDebuggingInformation(world: Zenko) {
    await displayCRStatus(world);
    await displayDRSinkStatus(world);
    await displayDRSourceStatus(world);
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

Then('object {string} should be {string} and have the storage class {string} on {string} site',
    async function (this: Zenko, objName: string, objectTransitionStatus: string, storageClass: string, site: string) {
        this.resetCommand();
        let accountName: string;
        if (site === 'DR') {
            Zenko.useSite('sink');
            accountName = Zenko.sites['sink'].accountName;
        } else {
            Zenko.useSite('source');
            accountName = Zenko.sites['source'].accountName
        }

        Identity.useIdentity(IdentityEnum.ACCOUNT, accountName);

        await verifyObjectLocation.call(this, objName, objectTransitionStatus, storageClass);
    });
