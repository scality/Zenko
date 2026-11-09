import { When, Then } from '@cucumber/cucumber';
import {
    DeleteBucketEncryptionCommand,
    GetBucketEncryptionCommand,
    GetObjectCommand,
    PutBucketEncryptionCommand,
    PutObjectCommand,
    PutObjectCommandOutput,
    type ServerSideEncryption,
} from '@aws-sdk/client-s3';
import Zenko from 'world/Zenko';
import assert from 'assert';
import { failedWith, settle } from 'common/result';

When('bucket encryption is set to {string} with key {string}',
    async function (this: Zenko, algo: string, keyId: string) {
        if (!algo) {
            return;
        }
        this.setResult(await settle(this.s3.send(new PutBucketEncryptionCommand({
            Bucket: this.getSaved<string>('bucketName'),
            ServerSideEncryptionConfiguration: {
                Rules: [{
                    ApplyServerSideEncryptionByDefault: {
                        SSEAlgorithm: algo as ServerSideEncryption,
                        KMSMasterKeyID: keyId || undefined,
                    },
                }],
            },
        }))));
    },
);

When('the user gets bucket encryption', async function (this: Zenko) {
    this.setResult(await settle(this.s3.send(new GetBucketEncryptionCommand({
        Bucket: this.getSaved<string>('bucketName'),
    }))));
});

Then('the bucket encryption is verified for algorithm {string} and key {string}',
    async function (this: Zenko, algo: string, keyId: string) {
        if (!algo) {
            return;
        }
        const { ServerSideEncryptionConfiguration } = await this.s3.send(new GetBucketEncryptionCommand({
            Bucket: this.getSaved<string>('bucketName'),
        }));
        const defaults = ServerSideEncryptionConfiguration
            ?.Rules?.[0]?.ApplyServerSideEncryptionByDefault;
        assert.strictEqual(defaults?.SSEAlgorithm, algo,
            `GetBucketEncryption: expected "${algo}", got "${defaults?.SSEAlgorithm}"`);
        if (keyId) {
            assert.ok(defaults?.KMSMasterKeyID,
                'GetBucketEncryption: KMSMasterKeyID should be present');
        } else {
            assert.strictEqual(defaults?.KMSMasterKeyID, undefined,
                `GetBucketEncryption: KMSMasterKeyID should be absent, got "${defaults?.KMSMasterKeyID}"`);
        }
    },
);

When('the user deletes bucket encryption', async function (this: Zenko) {
    await this.s3.send(new DeleteBucketEncryptionCommand({ Bucket: this.getSaved<string>('bucketName') }));
});

When('an object {string} is uploaded with SSE algorithm {string} and key {string}',
    async function (this: Zenko, objectName: string, algo: string, keyId: string) {
        const SSE_TEST_BODY = 'I am an encrypted test content :-)';
        this.addToSaved('objectName', objectName);
        this.addToSaved('objectBody', SSE_TEST_BODY);
        const bucket = this.getSaved<string>('bucketName');
        const result = await settle(this.s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: objectName,
            Body: SSE_TEST_BODY,
            ...(algo ? { ServerSideEncryption: algo as ServerSideEncryption } : {}),
            ...(keyId ? { SSEKMSKeyId: keyId } : {}),
        })));
        if (result.data) {
            this.saveCreatedObject(objectName, result.data.VersionId || '');
        }
        this.setResult(result);
    },
);

Then('the PutObject response should have SSE algorithm {string} and KMS key {string}',
    function (this: Zenko, expectedAlgo: string, expectedKey: string) {
        const { data: response, error } = this.getResult<PutObjectCommandOutput>();
        assert.ifError(error);
        const { ServerSideEncryption: sse, SSEKMSKeyId: sseKmsKeyId } = response!;
        if (expectedAlgo) {
            assert.strictEqual(sse, expectedAlgo,
                `PutObject SSE: expected "${expectedAlgo}", got "${sse}"`);
        } else {
            assert.strictEqual(sse, undefined,
                `PutObject SSE: expected absent, got "${sse}"`);
        }
        if (expectedKey === 'absent') {
            assert.strictEqual(sseKmsKeyId, undefined,
                `PutObject: SSEKMSKeyId should be absent, got "${sseKmsKeyId}"`);
        } else if (expectedKey === 'generated') {
            assert.ok(sseKmsKeyId, 'PutObject: SSEKMSKeyId should be present');
            assert.ok(isValidSseKmsKeyId(sseKmsKeyId),
                `PutObject: expected a generated key (hex or KMIP), got "${sseKmsKeyId}"`);
        } else {
            assert.ok(sseKmsKeyId, 'PutObject: SSEKMSKeyId should be present');
        }
    },
);

Then('the GetObject should return the uploaded body with SSE algorithm {string} and KMS key {string}',
    async function (this: Zenko, expectedAlgo: string, expectedKey: string) {
        const bucket = this.getSaved<string>('bucketName');
        const objectName = this.getSaved<string>('objectName');
        const expectedBody = this.getSaved<string>('objectBody');
        const resp = await this.s3.send(
            new GetObjectCommand({ Bucket: bucket, Key: objectName }),
        );
        const body = await resp.Body!.transformToString();
        assert.strictEqual(body, expectedBody, 'GetObject: body content mismatch');

        if (expectedAlgo) {
            assert.strictEqual(resp.ServerSideEncryption, expectedAlgo,
                `GetObject SSE: expected "${expectedAlgo}", got "${resp.ServerSideEncryption}"`);
        } else {
            assert.strictEqual(resp.ServerSideEncryption, undefined,
                `GetObject SSE: expected absent, got "${resp.ServerSideEncryption}"`);
        }
        if (expectedKey === 'absent') {
            assert.strictEqual(resp.SSEKMSKeyId, undefined,
                `GetObject: SSEKMSKeyId should be absent, got "${resp.SSEKMSKeyId}"`);
        } else if (expectedKey === 'generated') {
            assert.ok(resp.SSEKMSKeyId, 'GetObject: SSEKMSKeyId should be present');
            assert.ok(isValidSseKmsKeyId(resp.SSEKMSKeyId),
                `GetObject: expected a generated key (hex or KMIP), got "${resp.SSEKMSKeyId}"`);
        } else {
            assert.strictEqual(resp.SSEKMSKeyId, expectedKey,
                `GetObject: expected key "${expectedKey}", got "${resp.SSEKMSKeyId}"`);
        }
    },
);

Then('it should fail with error {string}',
    function (this: Zenko, expectedError: string) {
        const result = this.getResult();
        assert.ok(failedWith(result, expectedError),
            `Expected error "${expectedError}" but got: ${result.error}`);
    },
);

Then('objects {string} and {string} share the same KMS key',
    async function (this: Zenko, objA: string, objB: string) {
        const bucket = this.getSaved<string>('bucketName');
        const [respA, respB] = await Promise.all([
            this.s3.send(new GetObjectCommand({ Bucket: bucket, Key: objA })),
            this.s3.send(new GetObjectCommand({ Bucket: bucket, Key: objB })),
        ]);
        // Only the metadata is used, release the connections of the bodies
        await Promise.all([respA, respB].map(resp => resp.Body?.transformToWebStream().cancel()));
        const keyA = respA.SSEKMSKeyId;
        const keyB = respB.SSEKMSKeyId;
        assert.ok(keyA, `Object "${objA}" has no SSEKMSKeyId`);
        assert.ok(keyB, `Object "${objB}" has no SSEKMSKeyId`);
        assert.strictEqual(keyA, keyB,
            `Objects in same bucket should share the same KMIP key; got "${keyA}" vs "${keyB}"`);
    },
);

/**
 * Validates if the provided SSE KMS Key ID matches supported backend formats:
 * 1. File Backend: A 64-character hex string.
 * 2. KMIP Backend: A numeric string OR a specific Scality KMIP ARN.
 * @param sseKmsKeyId - The key ID string to validate
 * @returns boolean
 */
function isValidSseKmsKeyId(sseKmsKeyId: string | undefined): boolean {
    if (!sseKmsKeyId) {
        return false;
    }

    const isFileBackendKey = /^[a-f0-9]{64}$/.test(sseKmsKeyId);
    const isKmipKey = /^(\d+|arn:scality:kms:external:kmip:[a-z0-9]+:key\/\d+)$/.test(sseKmsKeyId);

    return isFileBackendKey || isKmipKey;
}
