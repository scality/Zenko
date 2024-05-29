import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { safeJsonParse } from '../common/utils';
import { Then, When, After, setDefaultTimeout } from '@cucumber/cucumber';
import { AzureHelper, S3, Constants, Utils } from 'cli-testing';
import util from 'util';
import { exec } from 'child_process';
import Zenko from 'world/Zenko';

setDefaultTimeout(Constants.DEFAULT_TIMEOUT);

type manifestEntry = {
    'archive-id': string,
    'archive-version': number,
    'ns-id': string,
    'archive-offset': number,
    'origin': {
        'bucket': string,
        'object-key': string,
        'version-id': string,
        'etag': string,
    },
    'metadata': {
        'content-length': number,
    },
};

type manifest = {
    'pack-id': string,
    'upload-date': string,
    'pack-size': number,
    'entries': manifestEntry[],
}

type listingObject = {
    Key: string,
    VersionId: string,
}

type listingResult = {
    Versions: listingObject[],
    DeleteMarkers: listingObject[],
}

/**
 * Returns an object containing azure credentials
 * @param {Zenko} world world object
 * @returns {object} azure creds
 */
function getAzureCreds(
    world: Zenko,
): {accountName: string, accountKey: string } {
    return {
        accountName: world.parameters.azureAccountName,
        accountKey: world.parameters.azureAccountKey,
    };
}
/**
 * Verify that an object has well been rehydrated in azure
 * @param {Zenko} zenko zenko object
 * @param {string} objectName object name
 * @returns {string} name of the tar blob
 */
async function isObjectRehydrated(zenko: Zenko, objectName: string) {
    let found = false;
    const {
        tarName,
    } = await findObjectPackAndManifest(
        zenko,
        zenko.getSaved<string>('bucketName'),
        objectName || zenko.getSaved<string>('objectName'),
    );
    const start = new Date();
    assert(tarName);
    while (!found) {
        found = await AzureHelper.blobExists(
            zenko.parameters.azureArchiveContainer,
            `rehydrate/${tarName}`,
            getAzureCreds(zenko),
        );
        await Utils.sleep(1000);

        //wait for 1 minute max
        if (new Date().getTime() - start.getTime() > 60000) {
            return undefined;
        }
    }
    return tarName;
}

/**
 * finds the names of the manifest and pack blobs
 * containing the object
 * @param {Zenko} world world object
 * @param {string} bucketName bucket name
 * @param {string} objectName object name
 * @returns {Promise<object>} names of the manifest and pack blobs
 */
async function findObjectPackAndManifest(
    world: Zenko,
    bucketName: string,
    objectName: string,
): Promise<{ manifestName?:string, manifest?:manifest, tarName?:string }> {
    // lisintg all blobs in the container
    const blobs = await AzureHelper.listBlobs(
        world.parameters.azureArchiveContainer,
        getAzureCreds(world),
    );
    // filtering the list of blobs only leaving the manifests
    const manifests = blobs.filter(blob => blob.name.includes('.json.'));
    for (let i = 0; i < manifests.length; i++) {
        // downloading the manifest
        const manifestBuffer = await AzureHelper.downloadBlob(
            world.parameters.azureArchiveContainer,
            manifests[i].name,
            getAzureCreds(world),
        );
        const { ok, result } = safeJsonParse(manifestBuffer.toString());
        if (!ok) {
            // eslint-disable-next-line no-continue
            continue;
        }
        const manifestJson = result as manifest;
        // checking if target object is in the manifest
        const found = manifestJson.entries.find(entry =>
            entry.origin.bucket === bucketName &&
            entry.origin['object-key'] === objectName,
        );
        if (found) {
            return {
                manifest: manifestJson,
                manifestName: manifests[i].name,
                tarName: manifests[i].name.replace('.json.', '.tar.'),
            };
        }
    }
    return {};
}

/**
 * Cleans the created test bucket
 * @param {Zenko} world world object
 * @param {string} bucketName bucket name
 * @returns {void}
 */
export async function cleanZenkoBucket(
    world: Zenko,
    bucketName: string,
): Promise<void> {
    world.resetCommand();
    world.addCommandParameter({ bucket: bucketName });
    const results = await S3.listObjectVersions(world.getCommandParameters());
    const res = safeJsonParse(results.stdout);
    if (!res.ok) {
        world.parameters.logger?.error('Error listing objects', { res, results });
        throw new Error('Error listing objects');
    }
    const parsedResults = res.result as listingResult;
    const versions = parsedResults.Versions || [];
    const deleteMarkers = parsedResults.DeleteMarkers || [];
    await Promise.all(versions.concat(deleteMarkers).map(obj => {
        world.addCommandParameter({ key: obj.Key });
        world.addCommandParameter({ versionId: obj.VersionId });
        return S3.deleteObject(world.getCommandParameters());
    }));
    world.deleteKeyFromCommand('key');
    world.deleteKeyFromCommand('versionId');
    await S3.deleteBucketLifecycle(world.getCommandParameters());
    await S3.deleteBucket(world.getCommandParameters());
}

/**
 * Cleans the created test azure blobs
 * @param {Zenko} world world object
 * @param {string} bucketName bucket name
 * @returns {void}
 */
export async function cleanAzureContainer(
    world: Zenko,
    bucketName: string,
): Promise<void> {
    const iterator = world.getSaved<Map<string, string>>('createdObjects').keys();
    let currentKey = iterator.next();
    while (currentKey.value) {
        const {
            tarName,
            manifestName,
        } = await findObjectPackAndManifest(
            world,
            bucketName,
            currentKey.value as string,
        );
        if (tarName) {
            await AzureHelper.deleteBlob(
                world.parameters.azureArchiveContainer,
                tarName,
                getAzureCreds(world),
            );
            await AzureHelper.deleteBlob(
                world.parameters.azureArchiveContainer,
                `rehydrate/${tarName}`,
                getAzureCreds(world),
            );
        }
        if (manifestName) {
            await AzureHelper.deleteBlob(
                world.parameters.azureArchiveContainer,
                manifestName,
                getAzureCreds(world),
            );
        }
        currentKey = iterator.next();
    }
}

Then('manifest access tier should be valid for object {string}', async function (this: Zenko, objectName: string) {
    const {
        manifestName,
    } = await findObjectPackAndManifest(
        this,
        this.getSaved<string>('bucketName'),
        objectName,
    );
    assert(manifestName);
    // manifest access tier
    const manifestProperties = await AzureHelper.getBlobProperties(
        this.parameters.azureArchiveContainer,
        manifestName,
        getAzureCreds(this),
    );
    assert.strictEqual(manifestProperties.accessTier, this.parameters.azureArchiveManifestTier);
});

Then('tar access tier should be valid for object {string}', async function (this: Zenko, objectName: string) {
    const {
        tarName,
    } = await findObjectPackAndManifest(
        this,
        this.getSaved<string>('bucketName'),
        objectName,
    );
    assert(tarName);
    // manifest access tier
    const packProperties = await AzureHelper.getBlobProperties(
        this.parameters.azureArchiveContainer,
        tarName,
        getAzureCreds(this),
    );
    assert.strictEqual(packProperties.accessTier, this.parameters.AzureArchiveAccessTier);
});

Then('manifest and tar containing object {string} should exist', async function (this: Zenko, objectName: string) {
    const {
        manifestName,
        tarName,
    } = await findObjectPackAndManifest(
        this,
        this.getSaved<string>('bucketName'),
        objectName || this.getSaved<string>('objectName'),
    );
    assert(manifestName);
    assert(tarName);
});

Then('object {string} should have the same data', async function (this: Zenko, objectName: string) {
    const objName = objectName ||  this.getSaved<string>('objectName');
    this.resetCommand();
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    this.addCommandParameter({ key: objName });
    const versionId = this.getSaved<Map<string, string>>('createdObjects')?.get(objName);
    if (versionId) {
        this.addCommandParameter({ versionId });
    }
    const res = await S3.getObject(this.getCommandParameters());
    assert.ifError(res.err);
    const objectPath = path.join(__dirname, '../utils/api', Constants.OUTFILE_NAME);
    const objectBuffer = fs.readFileSync(objectPath);
    fs.rmSync(objectPath);
    const expectedContent = Buffer.alloc(Buffer.byteLength(objectBuffer), 'a');
    assert.strictEqual(objectBuffer.toString(), expectedContent.toString());
});

Then('manifest containing object {string} should {string} object {string}',
    async function (this: Zenko, objectName1: string, condition: string, objectName2: string) {
        const {
            manifest,
        } = await findObjectPackAndManifest(
            this,
            this.getSaved<string>('bucketName'),
            objectName1,
        );
        assert(manifest);
        const found = manifest.entries.find((entry:manifestEntry) =>
            entry?.origin['object-key'] === objectName2,
        );
        if (condition === 'contain') {
            assert(found);
        } else {
            assert.deepStrictEqual(found, undefined);
        }
    });

Then('manifest containing object {string} should contain {int} objects',
    async function (this: Zenko, objectName: string, objectCount: number) {
        const {
            manifest,
        } = await findObjectPackAndManifest(
            this,
            this.getSaved<string>('bucketName'),
            objectName || this.getSaved<string>('objectName'),
        );
        assert(manifest);
        const count = manifest.entries.length;
        assert.strictEqual(count, objectCount);
    });

Then('blob for object {string} must be rehydrated',
    async function (this: Zenko, objectName: string) {
        const tarName = await isObjectRehydrated(this, objectName);
        assert(tarName);
        await AzureHelper.sendBlobCreatedEventToQueue(
            this.parameters.azureArchiveQueue,
            this.parameters.azureArchiveContainer,
            `rehydrate/${tarName}`,
            getAzureCreds(this),
        );
    });
/**
 * This is used to intentionally fail rehydration
 * To do that, we verify that the blob is rehydrated in azure
 * But we don't send the event to the queue so that
 * zenko is not aware of the rehydration and mark it as failed
 */
Then('blob for object {string} fails to rehydrate',
    async function (this: Zenko, objectName: string) {
        const tarName = await isObjectRehydrated(this, objectName);

        // wait for restore to fail and end up in dead letter queue
        const restoreTimeoutSeconds = parseInt(this.parameters.SorbetdRestoreTimeout);
        await Utils.sleep(restoreTimeoutSeconds * 1000 + 1000);
        assert(tarName);
    });

Then('the storage class of object {string} must stay {string} for {int} seconds',
    async function (this: Zenko, objectName: string, storageClass: string, seconds: number) {
        const objName = objectName || this.getSaved<string>('objectName');
        this.resetCommand();
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        this.addCommandParameter({ key: objName });
        const versionId = this.getSaved<Map<string, string>>('createdObjects')?.get(objName);
        if (versionId) {
            this.addCommandParameter({ versionId });
        }
        let secondsPassed = 0;
        while (secondsPassed < seconds) {
            const res = await S3.headObject(this.getCommandParameters());
            if (res.err) {
                break;
            }
            assert(res.stdout);
            const parsed = safeJsonParse(res.stdout);
            assert(parsed.ok);
            const head = parsed.result as { StorageClass: string | undefined };
            const expectedClass = storageClass !== '' ? storageClass : undefined;
            if (head?.StorageClass !== expectedClass) {
                break;
            }
            await Utils.sleep(1000);
            secondsPassed++;
        }
        assert(secondsPassed === seconds);
    });

When('i run sorbetctl to retry failed restore for {string} location', async function (this: Zenko, location: string) {
    const command = `/ctst/sorbetctl forward list failed --trigger-retry --skip-invalid \
        --kafka-dead-letter-topic=${this.parameters.kafkaDeadLetterQueueTopic} \
        --kafka-object-task-topic=${this.parameters.kafkaObjectTaskTopic} \
        --kafka-brokers ${this.parameters.KafkaHosts}`;
    try {
        await util.promisify(exec)(command);
    } catch (err) {
        assert.ifError(err);
    }
});

Then('object {string} should expire in {int} days', async function (this: Zenko, objectName: string, days: number) {
    const objName = objectName ||  this.getSaved<string>('objectName');
    this.resetCommand();
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    this.addCommandParameter({ key: objName });
    const versionId = this.getSaved<Map<string, string>>('createdObjects')?.get(objName);
    if (versionId) {
        this.addCommandParameter({ versionId });
    }
    const res = await S3.headObject(this.getCommandParameters());
    assert.ifError(res.err);
    assert(res.stdout);
    const parsed = safeJsonParse(res.stdout);
    assert(parsed.ok);
    const head = parsed.result as { Restore: string, LastModified: string };
    const expireResDate = head.Restore.match(/expiry-date="+(.*)"/) || [];
    const exiryDate = new Date(expireResDate[1]).getTime();
    const lastModified = new Date(head.LastModified).getTime();
    const diff = (exiryDate - lastModified) / 1000 / 86400;
    assert(diff >= days && diff < days + 0.1);
});
