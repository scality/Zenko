import { Given } from '@cucumber/cucumber';
import Zenko from 'world/Zenko';
import { CacheHelper } from 'cli-testing';

Given('DIAGNOSTIC: dump complete world state', function (this: Zenko) {
    const diagnosticData = {
        worldParameters: this.parameters,
        worldParametersCached: CacheHelper.parameters,
    };

    this.logger.info('='.repeat(80));
    this.logger.info('CTST WORLD DIAGNOSTIC DUMP');
    this.logger.info('='.repeat(80));
    this.logger.info(JSON.stringify(diagnosticData, null, 2));
    this.logger.info('='.repeat(80));
});
