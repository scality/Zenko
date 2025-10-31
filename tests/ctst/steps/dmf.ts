import { Then, Given, After } from '@cucumber/cucumber';
import assert from 'assert';
import Zenko from 'world/Zenko';
import { execInCluster } from './utils/kubernetes';

async function cleanDmfVolume(world: Zenko) {
    await execInCluster(world, 'rm -rf /cold-data/*');
}

Then('dmf volume should contain {int} objects',
    { timeout: 2 * 60 * 1000 }, async function (this: Zenko, objectCount: number) {
        let conditionOk = false;
        while (!conditionOk) {
            const outStrDebug = await execInCluster(this, 'find /cold-data -type f');
            this.logger.debug('DMF volume contents', { outStrDebug });
            // Getting the number of objects inside the volume used
            // by the mock dmf to store transitioned objects
            const outStr = await execInCluster(this, 'find /cold-data -type f | wc -l');
            // we store two files per object (content and manifest.json)
            conditionOk = Number(outStr) === objectCount * 2;
        }
        assert(conditionOk);
    });

Given('a flaky backend that will require {int} retries for {string}',
    function (this: Zenko, retryNumber: number, op: string) {
        assert(['restore', 'archive', 'command'].includes(op), `Invalid operation ${op}`);
        assert(retryNumber > 0, `Invalid retry number ${retryNumber}`);

        this.addToSaved('backendFlakinessRetryNumber', retryNumber);
        this.addToSaved('backendFlakiness', op);
    });

After({ tags: '@Dmf' }, async function (this: Zenko) {
    await cleanDmfVolume(this);
});
