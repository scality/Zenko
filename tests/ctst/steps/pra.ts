import { Given, Then } from '@cucumber/cucumber';
import Zenko from 'world/Zenko';
import ZenkoDrctl from './dr/drctl';
import { displayCRStatus, displayDRSinkStatus, displayDRSourceStatus } from './utils/kubernetes';
import { 
    verifyObjectLocation,
} from 'steps/utils/utils';

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
        sourceZenkoDrInstance: 'end2end',
        sinkZenkoDrInstance: 'end2end-pra',
        kafkaPersistenceSize: '1Gi',
        kafkaPersistenceStorageClassName: 'standard',
        locations: 'e2e-cold',
        s3Bucket: '__dump-db',
        sinkZenkoInstance: 'end2end-pra',
        sinkZenkoNamespace: 'default',
        sourceZenkoInstance: 'end2end',
        sourceZenkoNamespace: 'default',
        sinkS3UserSecretName: 'end2end-pra-management-vault-admin-creds.v1',
        sourceS3UserSecretName: 'end2end-management-vault-admin-creds.v1',
    });
    return;
});

Then('object {string} should be {string} and have the storage class {string} on {string} site',
    async function (this: Zenko, objName: string, objectTransitionStatus: string, storageClass: string, site: string) {
        this.resetCommand();
        if (site === 'DR') {
            this.useSite('sink');
        } else {
            this.useSite('source');
        }

        await verifyObjectLocation.call(this, objName, objectTransitionStatus, storageClass);
});
