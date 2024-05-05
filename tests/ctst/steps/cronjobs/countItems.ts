import { When } from '@cucumber/cucumber';
import Zenko from '../../world/Zenko';
import { createJobAndWaitForCompletion } from 'steps/utils/kubernetes';

When('the CountItems cronjobs completes without error', async function (this: Zenko) {
    const countItemsName = 'end2end-ops-count-items';
    await createJobAndWaitForCompletion(this, countItemsName);
});
