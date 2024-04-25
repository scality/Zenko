/* eslint-disable no-case-declarations */
import { Given } from '@cucumber/cucumber';
import Zenko from '../../world/Zenko';
import { Scality, Command } from 'cli-testing';

Given('a bucket quota set to {string} B', async function (this: Zenko, quota: string) {
    this.addCommandParameter({
        quota,
    });
    const result: Command = await Scality.updateBucketQuota(
        this.getCliMode().parameters,
        this.getCliMode(),
        this.getCommandParameters());

    this.parameters.logger?.debug('UpdateBucketQuota result', {
        result,
    });

    if (result.err) {
        throw new Error(result.err);
    }
});

Given('an account quota set to {string} B', async function (this: Zenko, quota: string) {
    this.addCommandParameter({
        quotaMax: quota,
    });
    const result: Command = await Scality.updateAccountQuota(
        this.getCliMode().parameters,
        this.getCliMode(),
        this.getCommandParameters());

    this.parameters.logger?.debug('UpdateAccountQuota result', {
        result,
    });

    if (result.err) {
        throw new Error(result.err);
    }
});
