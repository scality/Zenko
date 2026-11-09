import assert from 'assert';
import { Then, When } from '@cucumber/cucumber';
import { ListObjectsV2ExtendedCommand, ListObjectsV2ExtendedInput } from '@scality/cloudserverclient';
import Zenko from '../../world/Zenko';
import { settle } from '../../common/result';

type ListedObject = Record<string, unknown>;

function listedObjects(world: Zenko): ListedObject[] {
    const { data, error } = world.getResult<{ Contents?: ListedObject[] }>();
    assert.ifError(error);
    assert(data?.Contents, 'Expected Contents in response');
    return data.Contents;
}

async function listObjectsV2WithOptionalAttributes(
    world: Zenko,
    optionalAttributes: string,
) {
    const bucketName = world.getSaved<string>('bucketName');
    const optionalAttrsList = optionalAttributes.split(',').map(attr => attr.trim()) as
        ListObjectsV2ExtendedInput['ObjectAttributes'];

    world.setResult(await settle(world.s3.send(new ListObjectsV2ExtendedCommand({
        Bucket: bucketName,
        ObjectAttributes: optionalAttrsList,
    }))));
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
    const contents = listedObjects(this);
    assert(contents.length > 0, 'Expected at least one object in Contents');

    const attributesList = attributes.split(',').map(attr => attr.trim());
    for (const object of contents) {
        for (const attr of attributesList) {
            assert(object[attr] !== undefined, `Expected attribute "${attr}" not found in listed object`);
        }
    }
});

Then('the ListObjectsV2 response should contain {int} objects', function (
    this: Zenko,
    expectedCount: number,
) {
    const contents = listedObjects(this);
    assert.strictEqual(
        contents.length,
        expectedCount,
        `Expected ${expectedCount} objects but got ${contents.length}`,
    );
});

Then('the ListObjectsV2 response should contain {string} with values {string}', function (
    this: Zenko,
    attributes: string,
    expectedValues: string,
) {
    const contents = listedObjects(this);
    assert(contents.length > 0, 'Expected at least one object in Contents');

    const attributesList = attributes.split(',').map(attr => attr.trim());
    const valuesList = expectedValues.split(',').map(val => val.trim());

    assert.strictEqual(
        attributesList.length,
        valuesList.length,
        `Mismatch: ${attributesList.length} attributes but ${valuesList.length} expected values`,
    );

    for (const object of contents) {
        for (let i = 0; i < attributesList.length; i++) {
            const attr = attributesList[i];
            const expected = valuesList[i];

            if (!expected) {
                assert(
                    object[attr] === undefined,
                    `Expected attribute "${attr}" to be absent, but found value: ${object[attr]}`,
                );
                continue;
            }

            assert(object[attr] !== undefined, `Expected attribute "${attr}" not found in listed object`);
            const actual = String(object[attr]);
            assert.strictEqual(
                actual, expected,
                `Attribute "${attr}": expected "${expected}" but got "${actual}"`,
            );
        }
    }
});
