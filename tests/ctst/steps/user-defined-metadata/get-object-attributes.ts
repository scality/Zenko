import assert from 'assert';
import { Then, When } from '@cucumber/cucumber';
import { GetObjectAttributesExtendedCommand, GetObjectAttributesExtendedInput } from '@scality/cloudserverclient';
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
    const attributesList = attributes.split(',').map(attr => attr.trim()) as
        GetObjectAttributesExtendedInput['ObjectAttributes'];

    await world.sendS3Command(new GetObjectAttributesExtendedCommand({
        Bucket: bucketName,
        Key: objectName,
        VersionId: versionId,
        ObjectAttributes: attributesList,
    }));
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
