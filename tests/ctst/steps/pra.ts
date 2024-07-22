import { Given } from '@cucumber/cucumber';
import Zenko from 'world/Zenko';

Given('a PRA installed', async function (this: Zenko) {
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
