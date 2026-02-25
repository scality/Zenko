import assert from 'assert';
import { Then, When } from '@cucumber/cucumber';
import { S3 } from 'cli-testing';
import Zenko from '../../world/Zenko';
import { safeJsonParse } from '../../common/utils';
import { GetObjectAttributesOutput } from '@aws-sdk/client-s3';

async function getObjectAttributes(
    world: Zenko,
    objectName: string,
    attributes: string,
    versionId?: string,
) {
    world.resetCommand();

    const bucketName = world.getSaved<string>('bucketName');
    const attributesList = JSON.stringify(attributes.split(',').map(attr => attr.trim()));

    const result = await S3.getObjectAttributes({
        bucket: bucketName,
        key: objectName,
        objectAttributes: attributesList,
        ...(versionId && { versionId }),
    });

    // The AWS SDK fails to deserialize responses containing non-standard fields
    // (e.g., user metadata attributes like x-amz-meta-*) since they are not part
    // of the AWS SDK response model. If the server returned HTTP 200, the request
    // succeeded regardless of the deserialization error.
    if (result.err && result.statusCode === 200) {
        result.err = null;
    }

    world.setResult(result);
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

Then('the GetObjectAttributes response should contain {string}',
    function (this: Zenko, attributes: string) {
        const result = this.getResult();
        const parsed = safeJsonParse<GetObjectAttributesOutput>(result.stdout);
        assert(parsed.ok, `Failed to parse GetObjectAttributes response: ${parsed.error}`);

        const attributesList = attributes.split(',').map(attr => attr.trim());
        for (const attr of attributesList) {
            assert(attr in parsed.result!, `Expected attribute "${attr}" not found in response`);
        }
    });
