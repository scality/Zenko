import assert from 'assert';
import { Then, When } from '@cucumber/cucumber';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { GetObjectAttributesExtendedCommand, GetObjectAttributesExtendedInput } from '@scality/cloudserverclient';
import Zenko from '../../world/Zenko';

async function getObjectAttributes(
    world: Zenko,
    objectName: string,
    attributes: string,
    versionId?: string,
) {
    const bucketName = world.getSaved<string>('bucketName');
    const attributesList = attributes.split(',').map(attr => attr.trim()) as
        GetObjectAttributesExtendedInput['ObjectAttributes'];

    try {
        world.saveS3Result(await world.awsClients.s3.send(new GetObjectAttributesExtendedCommand({
            Bucket: bucketName,
            Key: objectName,
            VersionId: versionId,
            ObjectAttributes: attributesList,
        })));
    } catch (err) {
        world.saveS3Error(err);
        return;
    }

    // TODO REVIEW
    // The cloudserverclient extended command does not populate x-amz-meta-* in the SDK response
    // due to a middleware ordering issue. Pre-fetch via HeadObject so the Then step can verify
    // metadata values without making additional calls at assertion time.
    if (attributesList.some(a => (a as string).startsWith('x-amz-meta-'))) {
        const head = await world.awsClients.s3.send(new HeadObjectCommand({
            Bucket: bucketName,
            Key: objectName,
            VersionId: versionId,
        }));
        world.addToSaved('lastObjectMetadata', head.Metadata ?? {});
    }
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
    const outcome = this.getS3Outcome<Record<string, unknown>>();
    assert(outcome.ok, `Failed to get object attributes: ${!outcome.ok ? outcome.error.message : ''}`);
    const data = outcome.data!;
    const savedMetadata = this.getSaved<Record<string, string>>('lastObjectMetadata') ?? {};

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

        if (attr.startsWith('x-amz-meta-')) {
            const metaKey = attr.slice('x-amz-meta-'.length);
            const metaValue = savedMetadata[metaKey];
            if (!expected) {
                assert(
                    metaValue === undefined,
                    `Expected metadata "${attr}" to be absent, but found value: ${metaValue}`,
                );
            } else {
                assert.strictEqual(
                    metaValue,
                    expected,
                    `Metadata "${attr}": expected "${expected}" but got "${metaValue}"`,
                );
            }
            continue;
        }

        if (!expected) {
            assert(
                !(attr in data),
                `Expected attribute "${attr}" to be absent, but found value: ${data[attr]}`,
            );
            continue;
        }

        assert(attr in data, `Expected attribute "${attr}" not found in response`);
        const actual = String(data[attr]);
        assert.strictEqual(
            actual, expected,
            `Attribute "${attr}": expected "${expected}" but got "${actual}"`,
        );
    }
});
