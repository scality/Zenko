/* eslint-disable no-case-declarations */
import { Given, When } from '@cucumber/cucumber';
import Zenko from '../../world/Zenko';
import { Scality, Command, Utils } from 'cli-testing';

Given('a bucket quota set to {int} B', async function (this: Zenko, quota: number) {
    if (quota === 0) {
        return;
    }
    this.addCommandParameter({
        quota: String(quota),
    });
    this.addCommandParameter({
        bucket: this.getSaved<string>('bucketName'),
    });
    // This API is only valid for storage managers
    this.useSavedIdentity();
    const result: Command = await Scality.updateBucketQuota(
        this.parameters,
        this.getCommandParameters());

    this.logger.debug('UpdateBucketQuota result', {
        result,
    });

    if (result.err) {
        throw new Error(result.err);
    }
});

Given('an account quota set to {int} B', async function (this: Zenko, quota: number) {
    if (quota === 0) {
        return;
    }
    this.addCommandParameter({
        quotaMax: String(quota),
    });
    // This API is only valid for storage managers
    this.useSavedIdentity();
    const result: Command = await Scality.updateAccountQuota(
        this.parameters,
        this.getCommandParameters());

    this.logger.debug('UpdateAccountQuota result', {
        result,
    });

    if (result.err) {
        throw new Error(result.err);
    }
});

When('I wait {int} seconds', async (seconds: number) => {
    await Utils.sleep(seconds * 1000);
});
