import { When, Then } from '@cucumber/cucumber';
import Zenko from '../world/Zenko';
import { createAndRunPod, getZenkoVersion } from 'steps/utils/kubernetes';
import assert from 'assert';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { IdentityEnum, Identity, Utils } from 'cli-testing';
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
        const { locationType } = 
            await getReplicationLocationConfig(this, replicationLocation);
        const zenkoVersion = await getZenkoVersion(this);
        const s3utilsVersion = zenkoVersion.spec.versions.s3utils;
        console.log('AAAAAA 1', this.parameters.AdminAccessKey);
        console.log('AAAAAA 2', this.parameters.AdminSecretKey);
        console.log('AAAAAA 3', this.parameters.AccountAccessKey);
        console.log('AAAAAA 4', this.parameters.AccountSecretKey);

        console.log('AAAAAA 5', this.parameters.subdomain);
        console.log('AAAAAA 5.2', this.parameters.AccountName);

        const credentials = Identity.getCredentialsForIdentity(
            IdentityEnum.ACCOUNT,
            'zenko-ctst'
        ) 

//         AAAAAA 6 {
//   accessKeyId: 'EI19IYDB8ONEW314WB21',
//   secretAccessKey: 'Rx8ztWQfqXKdwxWVrha2VXVL7MHeUllKN0j4KxhY',
//   subDomain: 'zenko.local'
// }

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
                        // image: 'ghcr.io/scality/s3utils:f0b7cb961186e646b035ec850826a168efdc536c',
                        command: ['node'],
                        args: ['crrExistingObjects.js', sourceBucket],
                        env: [
                            { name: 'ACCESS_KEY', value: credentials?.accessKeyId },
                            { name: 'SECRET_KEY', value: credentials?.secretAccessKey },
                            { name: 'ENDPOINT', value: `http://s3.${credentials?.subDomain}` },
                            { name: 'STORAGE_TYPE', value: locationType },
                            { name: 'TARGET_REPLICATION_STATUS', value: sourceObjectStatus },
                            { name: 'SITE_NAME', value: replicationLocation },
                        ]
                    }
                ]
            }
        };
        // http://s3.zenko.local:80
        await createAndRunPod(this, podManifest);
    });

Then('the object should eventually be replicated', { timeout: 360_000 },
    async function (this: Zenko) {
        const objectName = this.getSaved<string>('objectName');
        const bucketSource = this.getSaved<string>('bucketName');
        const startTime = Date.now();
        const replicationTimeoutMs = 300_000;
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
            console.log('AAAAA 1 replicationStatus', replicationStatus);
            console.log('AAAAA 2 replicationStatus', response.stdout);
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
        
        console.log('DEBUG 1: Starting replication verification');
        console.log('DEBUG 2: objectName =', objectName);
        console.log('DEBUG 3: bucketSource =', bucketSource);
        console.log('DEBUG 4: replicationLocation =', replicationLocation);
        
        let replicationConfig;
        try {
            console.log('DEBUG 4.1: About to call getReplicationLocationConfig...');
            replicationConfig = await getReplicationLocationConfig(this, replicationLocation);
            console.log('DEBUG 4.2: getReplicationLocationConfig successful');
        } catch (error) {
            console.log('DEBUG ERROR 4.3: getReplicationLocationConfig failed:', error);
            throw error;
        }
        
        const { destinationBucket, bucketMatch, awsS3Client } = replicationConfig;
        
        console.log('DEBUG 5: destinationBucket =', destinationBucket);
        console.log('DEBUG 6: bucketMatch =', bucketMatch);
        console.log('DEBUG 7: awsS3Client config =', {
            endpoint: awsS3Client.config.endpoint,
            region: awsS3Client.config.region,
            credentials: awsS3Client.config.credentials
        });
        
        // When bucketMatch is disabled on the destination bucket,
        // replicated objects are named sourceBucket/objectName
        let key = `${bucketSource}/${objectName}`;
        if (bucketMatch) {
            key = objectName;
        }
        
        console.log('DEBUG 8: final key =', key);
        
        const command = new GetObjectCommand({
            Bucket: destinationBucket,
            Key: key, 
        });
        
        console.log('DEBUG 9: GetObjectCommand created for bucket:', destinationBucket, 'key:', key);
        
        let replicaObj;
        try {
            console.log('DEBUG 10: About to send GetObjectCommand...');
            replicaObj = await awsS3Client.send(command);
            console.log('DEBUG 11: GetObjectCommand successful, response:', {
                ContentLength: replicaObj.ContentLength,
                VersionId: replicaObj.VersionId,
                Metadata: replicaObj.Metadata
            });
        } catch (error) {
            console.log('DEBUG ERROR: GetObjectCommand failed');
            console.log('DEBUG ERROR details:', error);
            console.log('DEBUG ERROR response:', (error as any).$response);
            console.log('DEBUG ERROR message:', (error as any).message);
            throw error;
        }
        
        console.log('DEBUG 12: About to get source object...');
        let sourceResponse;
        try {
            sourceResponse = await getObject(this, objectName, bucketSource);
            console.log('DEBUG 13: getObject successful, statusCode:', sourceResponse.statusCode);
            console.log('DEBUG 14: sourceResponse.stdout:', sourceResponse.stdout);
        } catch (error) {
            console.log('DEBUG ERROR 15: getObject failed:', error);
            throw error;
        }
        
        assert.strictEqual(sourceResponse.statusCode, 200, `failed to getObject, ${sourceResponse.statusCode}`);
        
        console.log('DEBUG 16: About to parse sourceResponse.stdout...');
        const sourceObj = safeJsonParse<{
            ReplicationStatus?: string;
            LastModified?: string;
            ETag?: string;
            ContentLength?: number;
            VersionId?: string;
            Metadata?: Record<string, string>;
        }>(sourceResponse.stdout || '{}');
        
        console.log('DEBUG 17: safeJsonParse result:', {
            ok: sourceObj.ok,
            result: sourceObj.result
        });
        
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
