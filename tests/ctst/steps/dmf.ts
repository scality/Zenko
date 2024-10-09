import { Then, After } from '@cucumber/cucumber';
import assert from 'assert';
import { Utils } from 'cli-testing';
import { execShellCommand } from 'common/utils';

async function cleanDmfVolume() {
    await execShellCommand('rm -rf /cold-data/*');
}

Then('dmf volume should contain {int} objects', { timeout: 5 * 60 * 1000 }, async (objectCount: number) => {
    let conditionOk = false;
    while (!conditionOk) {
        // Getting the number of objects inside the volume used
        // by the mock dmf to store transitioned objects
        const outStr = await execShellCommand('find /cold-data -type f | wc -l');
        // we store two files per object (content and manifest.json)
        conditionOk = Number(outStr) === objectCount * 2;
        if (!conditionOk) {
            await Utils.sleep(500);
        }
    }
    assert(conditionOk);
});

After({ tags: '@Dmf' }, async () => {
    await cleanDmfVolume();
});
