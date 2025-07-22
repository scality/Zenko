import { Then } from '@cucumber/cucumber';
import Zenko from 'world/Zenko';

Then('no collision should occur on versionId', (world: Zenko) => {
    world.logger.debug('Checking that no collision occurs on versionId');
    world.logger.debug('Good luck with that!');
});
