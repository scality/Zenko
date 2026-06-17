import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import Zenko from '../../world/Zenko';
import { putObject } from '../utils/utils';
import { waitForZenkoToStabilize, waitForDataServicesToStabilize } from '../utils/kubernetes';
import { Utils } from 'cli-testing';

const pageMessage = Utils.randomString();

Given('an index html file', async function (this: Zenko) {
    const content = `<html><head><title>Index</title></head><body><h1>${pageMessage}</h1></body></html>`;
    this.addToSaved('objectSize', content.length);
    await putObject(this, 'index.html', content);
});

When('the {string} endpoint is added to the overlay', { timeout: 15 * 60 * 1000 },
    async function (this: Zenko, endpoint: string) {
        await this.addWebsiteEndpoint(endpoint);
        await waitForZenkoToStabilize(this, true);
        await waitForDataServicesToStabilize(this);
    });

Then('the user should be able to load the index.html file from the {string} endpoint',
    async function (this: Zenko, endpoint: string) {
        const baseUrl = this.parameters.ssl === false ? 'http://' : 'https://';
        const uri = `${baseUrl}${this.getSaved<string>('bucketName')}.${endpoint}`;
        let response;
        let content;
        let tries = 60;

        while (tries > 0) {
            tries--;
            try {
                response = await fetch(uri);
                content = await response.text();
                assert.strictEqual(content.includes(pageMessage), true);
                return;
            } catch (err) {
                this.logger.debug('Error when fetching the bucket website', {
                    err,
                    uri,
                    response,
                    content,
                });
                await Utils.sleep(1000);
            }
        }
        assert.fail('Failed to fetch the bucket website after 60 tries');
    });
