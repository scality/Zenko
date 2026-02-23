import { When } from '@cucumber/cucumber';
import { S3 } from 'cli-testing';
import Zenko from '../../world/Zenko';

When('the user calls ListObjectsV2 on the bucket with optional attributes {string}', async function (
    this: Zenko,
    optionalAttributes: string,
) {
    this.resetCommand();

    const bucketName = this.getSaved<string>('bucketName');

    const result = await S3.listObjectsV2({
        bucket: bucketName,
        ...(optionalAttributes && {
            optionalObjectAttributes: JSON.stringify(
                optionalAttributes.split(',').map(attr => attr.trim()),
            ),
        }),
    });

    // The AWS SDK may fail to deserialize non-standard responses
    // (e.g., user metadata in optional attributes).
    // If the server returned HTTP 200, the request succeeded.
    if (result.err && result.statusCode === 200) {
        result.err = null;
    }

    this.setResult(result);
});
