import { Then, Given, setDefaultTimeout } from '@cucumber/cucumber';
import assert from 'assert';
import { Constants } from 'cli-testing';
import { execShellCommand } from 'common/utils';
import Zenko from 'world/Zenko';

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

Given('a flaky backend that will require {int} retries for {string}',
    function (this: Zenko, retryNumber: number, op: string) {
        assert(["restore", "archive", "command"].includes(op), `Invalid operation ${op}`);
        assert(retryNumber > 0, `Invalid retry number ${retryNumber}`);

        this.addToSaved('backendFlakynessRetryNumber', retryNumber);
        this.addToSaved('backendFlakyness', op);
    });
