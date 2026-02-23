import { When } from '@cucumber/cucumber';
import { S3 } from 'cli-testing';
import Zenko from '../../world/Zenko';

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

    // The AWS SDK may fail to deserialize non-standard responses
    // (e.g., custom metadata attributes like x-amz-meta-*).
    // If the server returned HTTP 200, the request succeeded.
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
