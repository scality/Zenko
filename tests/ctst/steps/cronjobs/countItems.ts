import { When } from '@cucumber/cucumber';
import Zenko from '../../world/Zenko';
import { createJobAndWaitForCompletion } from 'steps/utils/kubernetes';

async function runCronjob(this: Zenko, job: string, site?: string) {
    let zenkoName = 'end2end';

    if (site === 'DR') {
        zenkoName += '-pra';
    }

    switch (job) {
        case 'CountItems':
            await createJobAndWaitForCompletion(this, `${zenkoName}-ops-count-items`);
            break;
        case 'EnsureVaultSeeds':
            await createJobAndWaitForCompletion(this, `${zenkoName}-ops-vault-check-seeds`);
            break;
        default:
            throw new Error(`Unknown job: ${job}`);
    }
}

When('the {string} cronjobs completes without error', { timeout: 1200000 }, async function (this: Zenko, job: string) {
    runCronjob.call(this, job);
});

When('the {string} cronjobs completes without error on {string} site', { timeout: 1200000 }, async function (this: Zenko, job: string, site: string) {
    runCronjob.call(this, job, site);
});
