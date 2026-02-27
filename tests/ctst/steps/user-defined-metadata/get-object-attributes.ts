import assert from 'assert';
import { Then, When } from '@cucumber/cucumber';
import { parseStringPromise } from 'xml2js';
import { Identity } from 'cli-testing';
import Zenko from '../../world/Zenko';
import { safeJsonParse } from '../../common/utils';

async function getObjectAttributes(
    world: Zenko,
    objectName: string,
    attributes: string,
    versionId?: string,
) {
    world.resetCommand();

    const bucketName = world.getSaved<string>('bucketName');
    const attributesList = attributes.split(',').map(attr => attr.trim());
    const credentials = Identity.getCurrentCredentials();

    let path = `/${bucketName}/${objectName}?attributes`;
    if (versionId) {
        path += `&versionId=${versionId}`;
    }

    const result = await world.awsS3Request(
        'GET',
        path,
        { accessKeyId: credentials.accessKeyId, secretAccessKey: credentials.secretAccessKey },
        { 'x-amz-object-attributes': attributesList.join(',') },
    );

    if (result.err) {
        world.setResult({
            stdout: '',
            err: result.err,
            statusCode: result.statusCode,
        });
        return;
    }

    const rawXml = result.data as string;
    const parsed: Record<string, unknown> = {};

    if (rawXml) {
        const parsedXml = await parseStringPromise(rawXml) as Record<string, unknown>;
        const parsedData = parsedXml?.GetObjectAttributesResponse;
        if (parsedData && typeof parsedData === 'object') {
            for (const k of Object.keys(parsedData)) {
                parsed[k] = (parsedData as Record<string, string[]>)[k][0];
            }
        }
    }

    world.setResult({
        stdout: JSON.stringify(parsed),
        err: null,
        statusCode: result.statusCode,
    });
}

When('the user calls GetObjectAttributes for {string} requesting {string}', async function (
    this: Zenko,
    objectName: string,
    attributes: string,
) {
    await getObjectAttributes(this, objectName, attributes);
});

When('the user calls GetObjectAttributes for {string} requesting {string} with the latest version', async function (
    this: Zenko,
    objectName: string,
    attributes: string,
) {
    const versionId = this.getLatestObjectVersion(objectName);
    await getObjectAttributes(this, objectName, attributes, versionId);
});

Then('the GetObjectAttributes response should contain {string} with values {string}', function (
    this: Zenko,
    attributes: string,
    expectedValues: string,
) {
    const result = this.getResult();
    const parsed = safeJsonParse<Record<string, unknown>>(result.stdout);
    assert(parsed.ok, `Failed to parse GetObjectAttributes response: ${parsed.error}`);

    const attributesList = attributes.split(',').map(attr => attr.trim());
    const valuesList = expectedValues.split(',').map(val => val.trim());

    assert.strictEqual(
        attributesList.length,
        valuesList.length,
        `Mismatch: ${attributesList.length} attributes but ${valuesList.length} expected values`,
    );

    for (let i = 0; i < attributesList.length; i++) {
        const attr = attributesList[i];
        let expected = valuesList[i];

        if (expected === '{savedETag}') {
            expected = this.getSaved<string>('objectETag');
            assert(expected, 'No saved ETag found -- was putObject called before this step?');
            expected = expected.replace(/^"|"$/g, '');
        }

        if (!expected) {
            assert(
                !(attr in parsed.result!),
                `Expected attribute "${attr}" to be absent, but found value: ${parsed.result![attr]}`,
            );
            return;
        }

        assert(attr in parsed.result!, `Expected attribute "${attr}" not found in response`);
        const actual = String(parsed.result![attr]);
        assert.strictEqual(
            actual, expected,
            `Attribute "${attr}": expected "${expected}" but got "${actual}"`,
        );
    }
});
