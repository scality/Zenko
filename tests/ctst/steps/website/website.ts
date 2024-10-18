import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import Zenko from '../../world/Zenko';
import { putObject } from '../utils/utils';
import { S3, Utils } from 'cli-testing';

const pageMessage = Utils.randomString();

Given('an index html file', async function (this: Zenko) {
    // push a file with a basic html content named index.html in the bucket
    const content = `<html><head><title>Index</title></head><body><h1>${pageMessage}</h1></body></html>`;
    this.addToSaved('objectSize', content.length);
    await putObject(this, 'index.html', content);
});

When('the user puts the bucket website configuration', async function (this: Zenko) {
    const bucketWebSiteConfiguration =
    '<WebsiteConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">' +
    '<IndexDocument><Suffix>string</Suffix></IndexDocument>';

    await S3.putBucketWebsite({
        bucket: this.getSaved<string>('bucketName'),
        websiteConfiguration: bucketWebSiteConfiguration,
    });
});

When('the {string} endpoint is added to the overlay', async function (this: Zenko, endpoint: string) {
    await this.addWebsiteEndpoint(endpoint);
});

Then('the user should be able to load the index.html file from the {string} endpoint',
    async function (this: Zenko, endpoint: string) {
        const uri = `http://${this.getSaved<string>('bucketName')}.${endpoint}`;
        const response = await fetch(uri);
        const content = await response.text();
        assert.strictEqual(content.includes(pageMessage), true);
    });
