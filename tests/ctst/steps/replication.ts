import { When, Then } from '@cucumber/cucumber';
import Zenko from '../world/Zenko';
import { createAndRunPod, getMongoDBConfig, getZenkoVersion } from 'steps/utils/kubernetes';
import assert from 'assert';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Utils } from 'cli-testing';
import { getObject, headObject, getReplicationLocationConfig } from 'steps/utils/utils';
import { safeJsonParse } from 'common/utils';

When('I run the job to replicate existing objects with status {string}',
    { timeout: 600000 },
    async function (
        this: Zenko,
        sourceObjectStatus: string,
    ) {
        const sourceBucket = this.getSaved<string>('bucketName');
        const replicationLocation = this.getSaved<string>('replicationLocation');
        const { replicaSetHosts } = await getMongoDBConfig(this);
        const { locationType } = await getReplicationLocationConfig(this, replicationLocation);
        const zenkoVersion = await getZenkoVersion(this);
        const s3utilsVersion = zenkoVersion.spec.versions.s3utils;
        const podManifest = {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
                name: `s3utils-crr-existing-${Utils.randomString().toLowerCase()}`,
                namespace: 'default',
                labels: {
                    app: 's3utils',
                    script: 'crrExistingObjects.js'
                }
            },
            spec: {
                restartPolicy: 'Never',
                containers: [
                    {
                        name: 's3utils',
                        image: `${s3utilsVersion.image}:${s3utilsVersion.tag}`,
                        command: ['node'],
                        args: ['crrExistingObjects.js', sourceBucket],
                        env: [
                            {
                                name: 'MONGODB_REPLICASET', 
                                value: replicaSetHosts.join(',')
                            },
                            { 
                                name: 'MONGODB_AUTH_USERNAME', 
                                valueFrom: { 
                                    secretKeyRef: { 
                                        name: 'mongodb-db-creds', 
                                        key: 'mongodb-username' 
                                    } 
                                } 
                            },
                            { 
                                name: 'MONGODB_AUTH_PASSWORD', 
                                valueFrom: { 
                                    secretKeyRef: { 
                                        name: 'mongodb-db-creds', 
                                        key: 'mongodb-password' 
                                    } 
                                } 
                            },
                            { 
                                name: 'MONGODB_DATABASE', 
                                valueFrom: { 
                                    secretKeyRef: { 
                                        name: 'mongodb-db-creds', 
                                        key: 'mongodb-database' 
                                    } 
                                } 
                            },
                            { name: 'MONGODB_SHARD_COLLECTIONS', value: 'true' },
                            { name: 'STORAGE_TYPE', value: locationType },
                            { name: 'TARGET_REPLICATION_STATUS', value: sourceObjectStatus },
                            { name: 'SITE_NAME', value: replicationLocation },
                        ]
                    }
                ]
            }
        };
        
        await createAndRunPod(this, podManifest);
    });

Then('the object should eventually be replicated',
    async function (this: Zenko) {
        const objectName = this.getSaved<string>('objectName');
        const bucketSource = this.getSaved<string>('bucketName');
        const startTime = Date.now();
        const replicationTimeoutMs = 90_000;
        while (Date.now() - startTime < replicationTimeoutMs) {
            await new Promise(resolve => setTimeout(resolve, 3000));

            const response = await headObject(this, objectName, bucketSource);
            assert(response.stdout);
            assert.strictEqual(response.statusCode, 200, `failed to headobject, ${response.statusCode}`);
            const parsed = safeJsonParse<{
                ReplicationStatus?: string;
                LastModified?: string;
                ETag?: string;
                ContentLength?: number;
                VersionId?: string;
                Metadata?: Record<string, string>;
            }>(response.stdout || '{}');
            assert(parsed.ok);
            const replicationStatus = parsed.result?.ReplicationStatus;
            assert.notStrictEqual(replicationStatus, 'FAILED', `replication failed for object ${objectName}`);
            if (replicationStatus === 'COMPLETED') {
                return;
            }
            if (replicationStatus === 'PENDING' || replicationStatus === 'PROCESSING') {
                continue;
            }
        }
        assert.fail(`Timeout: Object '${objectName}' was not replicated successfully until timeout`);
    });

Then(
    'the replicated object should be the same as the source object',
    async function (
        this: Zenko,
    ) {
        const objectName = this.getSaved<string>('objectName');
        const bucketSource = this.getSaved<string>('bucketName');
        const replicationLocation = this.getSaved<string>('replicationLocation');
        const { destinationBucket, bucketMatch, awsS3Client } = 
            await getReplicationLocationConfig(this, replicationLocation);
        
        // When bucketMatch is disabled on the destination bucket,
        // replicated objects are named sourceBucket/objectName
        let key = `${bucketSource}/${objectName}`;
        if (bucketMatch) {
            key = objectName;
        }
        
        const command = new GetObjectCommand({
            Bucket: destinationBucket,
            Key: key, 
        });
        const replicaObj = await awsS3Client.send(command);
        const sourceResponse = await getObject(this, objectName, bucketSource);
        assert.strictEqual(sourceResponse.statusCode, 200, `failed to getObject, ${sourceResponse.statusCode}`);
        const sourceObj = safeJsonParse<{
            ReplicationStatus?: string;
            LastModified?: string;
            ETag?: string;
            ContentLength?: number;
            VersionId?: string;
            Metadata?: Record<string, string>;
        }>(sourceResponse.stdout || '{}');
        assert(sourceObj.ok);

        assert.strictEqual(sourceObj.result?.ReplicationStatus, 'COMPLETED');
        assert.strictEqual(
            sourceObj.result?.ContentLength,
            replicaObj.ContentLength
        );
        assert.strictEqual(
            sourceObj.result?.Metadata?.[`${replicationLocation}-version-id`],
            replicaObj.VersionId
        );
        assert.strictEqual(
            sourceObj.result?.Metadata?.[`${replicationLocation}-replication-status`],
            'COMPLETED'
        );
        assert.strictEqual(
            sourceObj.result?.VersionId,
            replicaObj.Metadata?.['scal-version-id']
        );
        assert.strictEqual(
            replicaObj.Metadata?.['scal-replication-status'],
            'REPLICA'
        );
    });
