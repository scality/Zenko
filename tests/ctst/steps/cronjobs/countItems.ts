import { Then } from '@cucumber/cucumber';
import Zenko from '../../world/Zenko';
import { createJobAndWaitForCompletion } from 'steps/utils/kubernetes';

Then('the CountItems cronjobs completes without error', async function (this: Zenko) {
    const countItemsName = 'ops-count-items';
    await createJobAndWaitForCompletion(this, countItemsName);
});
