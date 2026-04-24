import { Given } from '@cucumber/cucumber';
import assert from 'assert';
import Zenko from 'world/Zenko';

// This step is a generic placeholder to check that the environment is set up
// while allowing to write specific steps for each feature.
// The associated setup logic is called in the tests/functional/ctst/common/hooks.ts file
// for the matching feature tags.
Given(/^.*environment is set up.*$/, function (this: Zenko) {
    const isSetup = this.getSaved<boolean>('metricsEnvironmentSetup');
    assert.strictEqual(isSetup, true, 'Metrics environment should be set up by the Before hook');
});
