import { When } from '@cucumber/cucumber';
import Zenko from '../../world/Zenko';
import { createJobAndWaitForCompletion } from 'steps/utils/kubernetes';

When('the {string} cronjobs completes without error', { timeout: 1200000 }, async function (this: Zenko, job: string) {
    switch (job) {
    case 'CountItems':
        await createJobAndWaitForCompletion(this, 'end2end-ops-count-items');
        break;
    default:
        throw new Error(`Unknown job: ${job}`);
    }
});
