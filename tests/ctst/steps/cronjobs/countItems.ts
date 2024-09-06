import { When } from '@cucumber/cucumber';
import Zenko from '../../world/Zenko';
import { createJobAndWaitForCompletion } from 'steps/utils/kubernetes';

async function runCronjob(this: Zenko, job: string, site?: string) {
    let zenkoName = 'end2end';

    if (site === 'DR') {
        zenkoName += '-pra';
    }

    await createJobAndWaitForCompletion(this, `${zenkoName}-ops-${job}`);
}

When('the {string} cronjobs completes without error', { timeout: 1200000 }, async function (this: Zenko, job: string) {
    await runCronjob.call(this, job);
});

When('the {string} cronjobs completes without error on {string} site', { timeout: 1200000 },
    async function (this: Zenko, job: string, site: string) {
        await runCronjob.call(this, job, site);
    });
