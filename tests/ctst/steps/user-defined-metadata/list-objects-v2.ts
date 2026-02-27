import assert from 'assert';
import { Then, When } from '@cucumber/cucumber';
import { parseStringPromise } from 'xml2js';
import { Identity } from 'cli-testing';
import Zenko from '../../world/Zenko';
import { safeJsonParse } from '../../common/utils';

When('the user calls ListObjectsV2 on the bucket with optional attributes {string}', async function (
    this: Zenko,
    optionalAttributes: string,
) {
    this.resetCommand();

    const bucketName = this.getSaved<string>('bucketName');
    const attributesList = optionalAttributes.split(',').map(attr => attr.trim());
    const credentials = Identity.getCurrentCredentials();

    const path = `/${bucketName}?list-type=2`;

    const result = await this.awsS3Request(
        'GET',
        path,
        { accessKeyId: credentials.accessKeyId, secretAccessKey: credentials.secretAccessKey },
        { 'x-amz-optional-object-attributes': attributesList.join(',') },
    );

    if (result.err) {
        this.setResult({
            stdout: '',
            err: result.err,
            statusCode: result.statusCode,
        });
        return;
    }

    const rawXml = result.data as string;
    const contents: Record<string, unknown>[] = [];

    if (rawXml) {
        const parsedXml = await parseStringPromise(rawXml) as Record<string, unknown>;
        const listResult = parsedXml?.ListBucketResult as Record<string, unknown> | undefined;
        if (listResult?.Contents) {
            for (const item of listResult.Contents as Record<string, unknown[]>[]) {
                const obj: Record<string, unknown> = {};
                for (const k of Object.keys(item)) {
                    obj[k] = item[k][0];
                }
                contents.push(obj);
            }
        }
    }

    this.setResult({
        stdout: JSON.stringify({ Contents: contents }),
        err: null,
        statusCode: result.statusCode,
    });
});

Then('the ListObjectsV2 response should contain {string}', function (
    this: Zenko,
    attributes: string,
) {
    const result = this.getResult();
    const parsed = safeJsonParse<{ Contents: Record<string, unknown>[] }>(result.stdout);
    assert(parsed.ok, `Failed to parse ListObjectsV2 response: ${parsed.error}`);
    assert(parsed.result!.Contents, 'Expected Contents in response');
    assert(parsed.result!.Contents!.length > 0, 'Expected at least one object in Contents');

    const attributesList = attributes.split(',').map(attr => attr.trim());
    for (const object of parsed.result!.Contents!) {
        for (const attr of attributesList) {
            assert(attr in object, `Expected attribute "${attr}" not found in listed object`);
        }
    }
});

Then('the ListObjectsV2 response should contain {int} objects', function (
    this: Zenko,
    expectedCount: number,
) {
    const result = this.getResult();
    const parsed = safeJsonParse<{ Contents: Record<string, unknown>[] }>(result.stdout);
    assert(parsed.ok, `Failed to parse ListObjectsV2 response: ${parsed.error}`);
    assert(parsed.result!.Contents, 'Expected Contents in response');
    assert.strictEqual(
        parsed.result!.Contents!.length,
        expectedCount,
        `Expected ${expectedCount} objects but got ${parsed.result!.Contents!.length}`,
    );
});

Then('the ListObjectsV2 response should contain {string} with values {string}', function (
    this: Zenko,
    attributes: string,
    expectedValues: string,
) {
    const result = this.getResult();
    const parsed = safeJsonParse<{ Contents: Record<string, unknown>[] }>(result.stdout);
    assert(parsed.ok, `Failed to parse ListObjectsV2 response: ${parsed.error}`);
    assert(parsed.result!.Contents, 'Expected Contents in response');
    assert(parsed.result!.Contents!.length > 0, 'Expected at least one object in Contents');

    const attributesList = attributes.split(',').map(attr => attr.trim());
    const valuesList = expectedValues.split(',').map(val => val.trim());

    assert.strictEqual(
        attributesList.length,
        valuesList.length,
        `Mismatch: ${attributesList.length} attributes but ${valuesList.length} expected values`,
    );

    for (const object of parsed.result!.Contents!) {
        for (let i = 0; i < attributesList.length; i++) {
            const attr = attributesList[i];
            const expected = valuesList[i];

            if (!expected) {
                assert(
                    !(attr in object),
                    `Expected attribute "${attr}" to be absent, but found value: ${object[attr]}`,
                );
                continue;
            }

            assert(attr in object, `Expected attribute "${attr}" not found in listed object`);
            const actual = String(object[attr]);
            assert.strictEqual(
                actual, expected,
                `Attribute "${attr}": expected "${expected}" but got "${actual}"`,
            );
        }
    }
});
