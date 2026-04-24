import { When, Then } from '@cucumber/cucumber';
import { S3 } from 'cli-testing';
import {
    GetObjectCommand,
    PutObjectCommand,
    type ServerSideEncryption,
} from '@aws-sdk/client-s3';
import Zenko from 'world/Zenko';
import assert from 'assert';

// We use the AWS SDK directly instead of cli-testing for PutObject and GetObject
// because:
// - cli-testing has a casing bug: --ssekms-key-id → SsekmsKeyId (should be
//   SSEKMSKeyId), so the KMS key id is silently dropped on PutObject.
// - cli-testing's S3.getObject writes the body to a shared file (out.loc)
//   which races under parallel execution.
// Long term solution : consider dropping cli-testing sdk wrapper : https://scality.atlassian.net/browse/ZENKO-5247

When('bucket encryption is set to {string} with key {string}',
    async function (this: Zenko, algo: string, keyId: string) {
        if (!algo) {
            return;
        }
        this.resetCommand();
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        this.addCommandParameter({
            serverSideEncryptionConfiguration: JSON.stringify({
                Rules: [{
                    ApplyServerSideEncryptionByDefault: {
                        SSEAlgorithm: algo,
                        ...(keyId ? { KMSMasterKeyID: keyId } : {}),
                    },
                }],
            }),
        });
        const result = await S3.putBucketEncryption(this.getCommandParameters());
        this.setResult(result);
    },
);

When('the user gets bucket encryption', async function (this: Zenko) {
    this.resetCommand();
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    this.setResult(await S3.getBucketEncryption(this.getCommandParameters()));
});

Then('the bucket encryption is verified for algorithm {string} and key {string}',
    async function (this: Zenko, algo: string, keyId: string) {
        if (!algo) {
            return;
        }
        this.resetCommand();
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        const result = await S3.getBucketEncryption(this.getCommandParameters());
        assert.ifError(result.err);
        const parsed = JSON.parse(result.stdout) as {
            ServerSideEncryptionConfiguration?: {
                Rules?: Array<{
                    ApplyServerSideEncryptionByDefault?: {
                        SSEAlgorithm?: string;
                        KMSMasterKeyID?: string;
                    };
                }>;
            };
        };
        const defaults = parsed.ServerSideEncryptionConfiguration
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
    this.resetCommand();
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    const result = await S3.deleteBucketEncryption(this.getCommandParameters());
    assert.ifError(result.err);
    this.setResult(result);
});

When('an object {string} is uploaded with SSE algorithm {string} and key {string}',
    async function (this: Zenko, objectName: string, algo: string, keyId: string) {
        const SSE_TEST_BODY = 'I am an encrypted test content :-)';
        this.addToSaved('objectName', objectName);
        this.addToSaved('objectBody', SSE_TEST_BODY);
        const bucket = this.getSaved<string>('bucketName');
        const client = this.createS3Client();
        try {
            const resp = await client.send(new PutObjectCommand({
                Bucket: bucket,
                Key: objectName,
                Body: SSE_TEST_BODY,
                ...(algo ? { ServerSideEncryption: algo as ServerSideEncryption } : {}),
                ...(keyId ? { SSEKMSKeyId: keyId } : {}),
            }));
            this.saveCreatedObject(objectName, resp.VersionId || '');
            const result = {
                err: null as string | null,
                stdout: JSON.stringify(resp),
                serverSideEncryption: resp.ServerSideEncryption,
                sseKmsKeyId: resp.SSEKMSKeyId,
            };
            this.setResult(result);
        } catch (error: unknown) {
            const err = error as Error & { name: string; message: string };
            this.setResult({
                err: `${err.name}: ${err.message}`,
                stdout: '',
            });
        } finally {
            client.destroy();
        }
    },
);

Then('the PutObject response should have SSE algorithm {string} and KMS key {string}',
    function (this: Zenko, expectedAlgo: string, expectedKey: string) {
        const result = this.getResult() as {
            serverSideEncryption?: string; sseKmsKeyId?: string;
        };
        if (expectedAlgo) {
            assert.strictEqual(result.serverSideEncryption, expectedAlgo,
                `PutObject SSE: expected "${expectedAlgo}", got "${result.serverSideEncryption}"`);
        } else {
            assert.strictEqual(result.serverSideEncryption, undefined,
                `PutObject SSE: expected absent, got "${result.serverSideEncryption}"`);
        }
        if (expectedKey === 'absent') {
            assert.strictEqual(result.sseKmsKeyId, undefined,
                `PutObject: SSEKMSKeyId should be absent, got "${result.sseKmsKeyId}"`);
        } else if (expectedKey === 'generated') {
            assert.ok(result.sseKmsKeyId, 'PutObject: SSEKMSKeyId should be present');
            assert.ok(isValidSseKmsKeyId(result.sseKmsKeyId),
                `PutObject: expected a generated key (hex or KMIP), got "${result.sseKmsKeyId}"`);
        } else {
            assert.ok(result.sseKmsKeyId, 'PutObject: SSEKMSKeyId should be present');
        }
    },
);

Then('the GetObject should return the uploaded body with SSE algorithm {string} and KMS key {string}',
    async function (this: Zenko, expectedAlgo: string, expectedKey: string) {
        const bucket = this.getSaved<string>('bucketName');
        const objectName = this.getSaved<string>('objectName');
        const expectedBody = this.getSaved<string>('objectBody');
        const client = this.createS3Client();
        try {
            const resp = await client.send(
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
        } finally {
            client.destroy();
        }
    },
);

Then('it should fail with error {string}',
    function (this: Zenko, expectedError: string) {
        const result = this.getResult();
        assert.ok(result.err?.includes(expectedError),
            `Expected error "${expectedError}" but got: ${result.err}`);
    },
);

Then('objects {string} and {string} share the same KMS key',
    async function (this: Zenko, objA: string, objB: string) {
        const bucket = this.getSaved<string>('bucketName');
        const client = this.createS3Client();
        try {
            const [respA, respB] = await Promise.all([
                client.send(new GetObjectCommand({ Bucket: bucket, Key: objA })),
                client.send(new GetObjectCommand({ Bucket: bucket, Key: objB })),
            ]);
            const keyA = respA.SSEKMSKeyId;
            const keyB = respB.SSEKMSKeyId;
            assert.ok(keyA, `Object "${objA}" has no SSEKMSKeyId`);
            assert.ok(keyB, `Object "${objB}" has no SSEKMSKeyId`);
            assert.strictEqual(keyA, keyB,
                `Objects in same bucket should share the same KMIP key; got "${keyA}" vs "${keyB}"`);
        } finally {
            client.destroy();
        }
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
