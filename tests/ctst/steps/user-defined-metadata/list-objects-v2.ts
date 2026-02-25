import assert from 'assert';
import { Then, When } from '@cucumber/cucumber';
import { S3 } from 'cli-testing';
import Zenko from '../../world/Zenko';
import { safeJsonParse } from '../../common/utils';
import { ListObjectsV2Output } from '@aws-sdk/client-s3';

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

    // The AWS SDK fails to deserialize responses containing non-standard fields
    // (e.g., user metadata attributes like x-amz-meta-*) since they are not part
    // of the AWS SDK response model. If the server returned HTTP 200, the request
    // succeeded regardless of the deserialization error.
    if (result.err && result.statusCode === 200) {
        result.err = null;
    }

    this.setResult(result);
});

Then('the ListObjectsV2 response should contain {string}',
    function (this: Zenko, attributes: string) {
        const result = this.getResult();
        const parsed = safeJsonParse<ListObjectsV2Output>(result.stdout);
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
