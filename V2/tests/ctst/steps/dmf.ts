import { Then, Given, After } from '@cucumber/cucumber';
import assert from 'assert';
import { execShellCommand } from 'common/utils';
import Zenko from 'world/Zenko';

async function cleanDmfVolume() {
    await execShellCommand('rm -rf /cold-data/*');
}

Then('dmf volume should contain {int} objects',
    { timeout: 2 * 60 * 1000 }, async (objectCount: number) => {
        let conditionOk = false;
        const maxAttempts = 60;
        let attempts = 0;
        
        while (!conditionOk && attempts < maxAttempts) {
            // Getting the number of objects inside the volume used
            // by the mock dmf to store transitioned objects
            const outStr = await execShellCommand('find /cold-data -type f | wc -l');
            const fileCount = Number(outStr.trim());
            // we store two files per object (content and manifest.json)
            conditionOk = fileCount === objectCount * 2;
            
            if (!conditionOk) {
                attempts++;
                // Add small delay to avoid hammering the system
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        if (!conditionOk) {
            const actualCount = await execShellCommand('find /cold-data -type f | wc -l');
            throw new Error(`DMF volume check failed: expected ${objectCount * 2} files` +
                `, found ${actualCount.trim()} files after ${attempts} attempts`);
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

After({ tags: '@Dmf' }, async () => {
    await cleanDmfVolume();
});
