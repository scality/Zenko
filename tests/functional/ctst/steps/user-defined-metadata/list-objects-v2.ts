import assert from 'assert';
import { Then, When } from '@cucumber/cucumber';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { ListObjectsV2ExtendedCommand, ListObjectsV2ExtendedInput } from '@scality/cloudserverclient';
import Zenko from '../../world/Zenko';

async function listObjectsV2WithOptionalAttributes(
    world: Zenko,
    optionalAttributes: string,
) {
    const bucketName = world.getSaved<string>('bucketName');
    const optionalAttrsList = optionalAttributes.split(',').map(attr => attr.trim()) as
        ListObjectsV2ExtendedInput['ObjectAttributes'];

    try {
        world.saveS3Result(await world.awsClients.s3.send(new ListObjectsV2ExtendedCommand({
            Bucket: bucketName,
            ObjectAttributes: optionalAttrsList,
        })));
    } catch (err) {
        world.saveS3Error(err);
        return;
    }

    // TODO REVIEW
    // The cloudserverclient extended command does not populate x-amz-meta-* in the SDK response
    // due to a middleware ordering issue. Pre-fetch via HeadObject per object so the Then step
    // can verify metadata values without making additional calls at assertion time.
    if (optionalAttrsList?.some(a => (a as string).startsWith('x-amz-meta-'))) {
        const outcome = world.getS3Outcome<{ Contents?: { Key?: string }[] }>();
        if (outcome.ok && outcome.data?.Contents) {
            const metadataByKey: Record<string, Record<string, string>> = {};
            for (const obj of outcome.data.Contents) {
                if (obj.Key) {
                    try {
                        const head = await world.awsClients.s3.send(new HeadObjectCommand({
                            Bucket: bucketName,
                            Key: obj.Key,
                        }));
                        metadataByKey[obj.Key] = head.Metadata ?? {};
                    } catch {
                        metadataByKey[obj.Key] = {};
                    }
                }
            }
            world.addToSaved('lastListMetadataByKey', metadataByKey);
        }
    }
}

When('the user calls ListObjectsV2 on the bucket with optional attributes {string}', async function (
    this: Zenko,
    optionalAttributes: string,
) {
    await listObjectsV2WithOptionalAttributes(this, optionalAttributes);
});

Then('the ListObjectsV2 response should contain {string}', function (
    this: Zenko,
    attributes: string,
) {
    const outcome = this.getS3Outcome<{ Contents: Record<string, unknown>[] }>();
    assert(outcome.ok, `Failed: ${!outcome.ok ? outcome.error.message : ''}`);
    assert(outcome.data!.Contents, 'Expected Contents in response');
    assert(outcome.data!.Contents!.length > 0, 'Expected at least one object in Contents');

    const attributesList = attributes.split(',').map(attr => attr.trim());
    for (const object of outcome.data!.Contents!) {
        for (const attr of attributesList) {
            assert(attr in object, `Expected attribute "${attr}" not found in listed object`);
        }
    }
});

Then('the ListObjectsV2 response should contain {int} objects', function (
    this: Zenko,
    expectedCount: number,
) {
    const outcome = this.getS3Outcome<{ Contents: Record<string, unknown>[] }>();
    assert(outcome.ok, `Failed: ${!outcome.ok ? outcome.error.message : ''}`);
    assert(outcome.data!.Contents, 'Expected Contents in response');
    assert.strictEqual(
        outcome.data!.Contents!.length,
        expectedCount,
        `Expected ${expectedCount} objects but got ${outcome.data!.Contents!.length}`,
    );
});

Then('the ListObjectsV2 response should contain {string} with values {string}', function (
    this: Zenko,
    attributes: string,
    expectedValues: string,
) {
    const outcome = this.getS3Outcome<{ Contents: Record<string, unknown>[] }>();
    assert(outcome.ok, `Failed: ${!outcome.ok ? outcome.error.message : ''}`);
    assert(outcome.data!.Contents, 'Expected Contents in response');
    assert(outcome.data!.Contents!.length > 0, 'Expected at least one object in Contents');

    const attributesList = attributes.split(',').map(attr => attr.trim());
    const valuesList = expectedValues.split(',').map(val => val.trim());

    assert.strictEqual(
        attributesList.length,
        valuesList.length,
        `Mismatch: ${attributesList.length} attributes but ${valuesList.length} expected values`,
    );

    const metadataByKey = this.getSaved<Record<string, Record<string, string>>>('lastListMetadataByKey') ?? {};

    for (const object of outcome.data!.Contents!) {
        for (let i = 0; i < attributesList.length; i++) {
            const attr = attributesList[i];
            const expected = valuesList[i];

            if (attr.startsWith('x-amz-meta-')) {
                const metaKey = attr.slice('x-amz-meta-'.length);
                const objectKey = object['Key'] as string;
                const metaValue = metadataByKey[objectKey]?.[metaKey];
                if (!expected) {
                    assert(
                        metaValue === undefined,
                        `Expected metadata "${attr}" to be absent on "${objectKey}", but found: ${metaValue}`,
                    );
                } else {
                    assert.strictEqual(
                        metaValue,
                        expected,
                        `Metadata "${attr}" on "${objectKey}": expected "${expected}" but got "${metaValue}"`,
                    );
                }
                continue;
            }

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
