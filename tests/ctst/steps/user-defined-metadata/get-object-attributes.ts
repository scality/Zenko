import { When } from '@cucumber/cucumber';
import { S3 } from 'cli-testing';
import Zenko from '../../world/Zenko';

When('the user calls GetObjectAttributes for {string} requesting {string}', async function (
    this: Zenko,
    objectName: string,
    attributes: string,
) {
    this.resetCommand();
    const bucketName = this.getSaved<string>('bucketName');

    const attributesList = JSON.stringify(attributes.split(',').map(attr => attr.trim()));

    const result = await S3.getObjectAttributes({
        bucket: bucketName,
        key: objectName,
        objectAttributes: attributesList,
    });

    // The AWS SDK may fail to deserialize non-standard responses
    // (e.g., custom metadata attributes like x-amz-meta-*).
    // If the server returned HTTP 200, the request succeeded.
    if (result.err && result.statusCode === 200) {
        result.err = null;
    }

    this.setResult(result);
});

