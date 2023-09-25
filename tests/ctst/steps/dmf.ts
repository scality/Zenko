import { Then, setDefaultTimeout } from '@cucumber/cucumber';
import assert from 'assert';
import { Constants } from 'cli-testing';
import { execShellCommand } from 'common/utils';

setDefaultTimeout(Constants.DEFAULT_TIMEOUT);

Then('dmf volume should contain {int} objects', async (objectCount: number) => {
    let conditionOk = false;
    while (!conditionOk) {
        // Getting the number of objects inside the volume used
        // by the mock dmf to store transitioned objects
        const outStr = await execShellCommand('find /cold-data -type f | wc -l');
        // we store two files per object (content and manifest.json)
        conditionOk = Number(outStr) === objectCount * 2;
    }
    assert(conditionOk);
});
