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
    const bucketWebSiteConfiguration = JSON.stringify({
        IndexDocument: {
            Suffix: 'index.html',
        },
        ErrorDocument: {
            Key: 'error.html',
        },
    });

    await S3.putBucketWebsite({
        bucket: this.getSaved<string>('bucketName'),
        websiteConfiguration: bucketWebSiteConfiguration,
    });
});

When('the {string} endpoint is added to the overlay', async function (this: Zenko, endpoint: string) {
    await this.addWebsiteEndpoint(endpoint);
});

When('the user creates an S3 Bucket policy granting public read access', async function (this: Zenko) {
    const policy = {
        Version: '2012-10-17',
        Statement: [
            {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: [
                    's3:GetObject',
                ],
                Resource: [
                    `arn:aws:s3:::${this.getSaved<string>('bucketName')}/*`,
                ],
            },
        ],
    };
    await S3.putBucketPolicy({
        bucket: this.getSaved<string>('bucketName'),
        policy: JSON.stringify(policy),
    });
});

Then('the user should be able to load the index.html file from the {string} endpoint',
    async function (this: Zenko, endpoint: string) {
        const baseUrl = this.parameters.ssl === false ? 'http://' : 'https://';
        // The ingress may take some time to be ready (<60s)
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
        assert.fail('Failed to fetch the bucket website after 20 tries');
    });
