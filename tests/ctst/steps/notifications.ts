import { Then, Given, When, setDefaultTimeout, IWorld } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import { Constants, S3, Utils, KafkaHelper } from 'cli-testing';

setDefaultTimeout(Constants.DEFAULT_TIMEOUT);

const KAFKA_TESTS_TIMEOUT = Number(process.env.KAFKA_TESTS_TIMEOUT) || 60000;

const allNotificationTypes = [
    's3:ObjectCreated:Put',
    's3:ObjectCreated:Copy',
    's3:ObjectRemoved:Delete',
    's3:ObjectRemoved:DeleteMarkerCreated',
    's3:ObjectTagging:Put',
    's3:ObjectTagging:Delete',
    's3:ObjectAcl:Put',
];

async function emptyNonVersionedBucket(world: IWorld) {
    world.resetCommand();
    world.addCommandParameter({ bucket: world.saved.bucketName });
    const results = await S3.listObjects(world.getCommandParameters());
    const objects = JSON.parse(results.stdout || '{}')?.Contents as any[] || [];
    await Promise.all(objects.map(obj => {
        world.deleteKeyFromCommand('key');
        world.addCommandParameter({ key: obj.Key });
        return S3.deleteObject(world.getCommandParameters());
    }));
}

async function emptyVersionedBucket(world: IWorld) {
    world.resetCommand();
    world.addCommandParameter({ bucket: world.saved.bucketName });
    const results = await S3.listObjectVersions(world.getCommandParameters());
    const parsedResults = JSON.parse(results.stdout || '{}');
    const versions = parsedResults.Versions as any[] || [];
    const deleteMarkers = parsedResults.DeleteMarkers as any[] || [];
    await Promise.all(deleteMarkers.map(obj => {
        world.deleteKeyFromCommand('key');
        world.addCommandParameter({ key: obj.Key });
        world.addCommandParameter({ versionId: obj.VersionId });
        return S3.deleteObject(world.getCommandParameters());
    }));
    await Promise.all(versions.map(obj => {
        world.deleteKeyFromCommand('key');
        world.addCommandParameter({ key: obj.Key });
        world.addCommandParameter({ versionId: obj.VersionId });
        return S3.deleteObject(world.getCommandParameters());
    }));
}

async function putObject(world: IWorld) {
    world.resetCommand();
    world.addCommandParameter({ bucket: world.saved.bucketName });
    world.addCommandParameter({ key: world.saved.objectName });
    world.saved.putResult = await S3.putObject(world.getCommandParameters());
}

async function copyObject(world: IWorld) {
    await putObject(world);
    world.resetCommand();
    let objName = `object-${Utils.randomString()}`.toLocaleLowerCase();
    if (world.saved.filterType) {
        objName = world.saved.filterType === 'prefix' ? `${world.saved.objectNamePrefix}${objName}` :
            `${objName}${world.saved.objectNameSufix}`;
    }
    world.addCommandParameter({ bucket: world.saved.bucketName });
    world.addCommandParameter({ key: objName });
    world.addCommandParameter({ copySource: `${world.saved.bucketName}/${world.saved.objectName}` });
    world.saved.objectName = objName;
    await S3.copyObject(world.getCommandParameters());
}

async function deleteObject(world: IWorld, putDeleteMarker = false) {
    await putObject(world);
    world.resetCommand();
    world.addCommandParameter({ bucket: world.saved.bucketName });
    world.addCommandParameter({ key: world.saved.objectName });
    if (world.saved.bucketVersioning !== 'Non versioned' && !putDeleteMarker) {
        const versionId = JSON.parse(world.saved.putResult.stdout)?.VersionId;
        world.addCommandParameter({ versionId });
    }
    await S3.deleteObject(world.getCommandParameters());
}

async function putTag(world: IWorld) {
    await putObject(world);
    world.resetCommand();
    const tags = JSON.stringify({
        TagSet: [{
            Key: 'key',
            Value: 'value',
        }],
    });
    world.addCommandParameter({ bucket: world.saved.bucketName });
    world.addCommandParameter({ key: world.saved.objectName });
    world.addCommandParameter({ tagging: `'${tags}'` });
    await S3.putObjectTagging(world.getCommandParameters());
}

async function deleteTag(world: IWorld) {
    await putTag(world);
    world.resetCommand();
    world.addCommandParameter({ bucket: world.saved.bucketName });
    world.addCommandParameter({ key: world.saved.objectName });
    await S3.deleteObjectTagging(world.getCommandParameters());
}

async function putAcl(world: IWorld) {
    await putObject(world);
    world.resetCommand();
    world.addCommandParameter({ bucket: world.saved.bucketName });
    world.addCommandParameter({ key: world.saved.objectName });
    world.addCommandParameter({ acl: 'public-read' });
    await S3.putObjectAcl(world.getCommandParameters());
}

Given('one notification destination', function () {
    if (!Array.isArray(this.saved.notificationDestinations)) {
        this.saved.notificationDestinations = [];
    }
    this.saved.notificationDestinations.push({
        destinationName: this.parameters.NotificationDestination,
        topic: this.parameters.NotificationDestinationTopic,
        hosts: this.parameters.KafkaHosts,
    });
});

Given('two notification destinations', function () {
    if (!Array.isArray(this.saved.notificationDestinations)) {
        this.saved.notificationDestinations = [];
    }
    this.saved.notificationDestinations.push({
        destinationName: this.parameters.NotificationDestination,
        topic: this.parameters.NotificationDestinationTopic,
        hosts: this.parameters.KafkaHosts,
    });
    this.saved.notificationDestinations.push({
        destinationName: this.parameters.NotificationDestinationAlt,
        topic: this.parameters.NotificationDestinationTopicAlt,
        hosts: this.parameters.KafkaHosts,
    });
});

When('i subscribe to {string} notifications for destination {int}', async function (notificationType, destination) {
    if (!this.saved.notificationsPerDestination) {
        this.saved.notificationsPerDestination = {};
    }
    this.saved.notificationsPerDestination[`${destination}`] = notificationType !== 'all' ? [notificationType] : allNotificationTypes;
    const destinationConfig = {
        QueueConfigurations: [
            {
                QueueArn: `arn:scality:bucketnotif:::${this.saved.notificationDestinations[destination].destinationName}`,
                Events: this.saved.notificationsPerDestination[`${destination}`],
            },
        ],
    };
    this.resetCommand();
    // Getting and adapting previous notification configuration
    this.addCommandParameter({ bucket: this.saved.bucketName });
    const result = await S3.getBucketNotificationConfiguration(this.getCommandParameters());
    try {
        const notificationConfig = JSON.parse(result.stdout);
        notificationConfig.QueueConfigurations.push(destinationConfig.QueueConfigurations[0])
        this.addCommandParameter({ notificationConfiguration: `'${JSON.stringify(notificationConfig)}'` });
    } catch (error) {
        // Put new config if old doesn't exist
        this.addCommandParameter({ notificationConfiguration: `'${JSON.stringify(destinationConfig)}'` });
    }
    await S3.putBucketNotificationConfiguration(this.getCommandParameters());
    // waiting for oplog populator to take the putNotificationConfiguration into account
    await Utils.sleep(10000);
});

When('i subscribe to {string} notifications for destination {int} with {string} filter', async function (notificationType, destination, filterType) {
    if (!this.saved.notificationsPerDestination) {
        this.saved.notificationsPerDestination = {};
    }
    this.saved.notificationsPerDestination[`${destination}`] = notificationType !== 'all' ? [notificationType] : allNotificationTypes;
    this.saved.objectNamePrefix = filterType === 'prefix' ? 'pfx-' : '';
    this.saved.objectNameSufix = filterType === 'suffix' ? '-sfx' : '';
    let filter = filterType.toLocaleLowerCase();
    filter = filter[0].toUpperCase() + filter.slice(1);
    const destinationConfig = {
        QueueConfigurations: [
            {
                QueueArn: `arn:scality:bucketnotif:::${this.saved.notificationDestinations[destination].destinationName}`,
                Events: this.saved.notificationsPerDestination[`${destination}`],
                Filter: {
                    Key: {
                        FilterRules: [
                            {
                                Name: filter,
                                Value: filterType === 'prefix' ? 'pfx-' : '-sfx',
                            }
                        ],
                    },
                },
            },
        ],
    };
    this.resetCommand();
    // Getting and adapting previous notification configuration
    this.addCommandParameter({ bucket: this.saved.bucketName });
    const result = await S3.getBucketNotificationConfiguration(this.getCommandParameters());
    try {
        const notificationConfig = JSON.parse(result.stdout);
        // Update old config and update
        notificationConfig.QueueConfigurations.push(destinationConfig.QueueConfigurations[0])
        this.addCommandParameter({ notificationConfiguration: `'${JSON.stringify(notificationConfig)}'` });
    } catch (error) {
        // Put new config it old doesn't exist
        this.addCommandParameter({ notificationConfiguration: `'${JSON.stringify(destinationConfig)}'` });
    }
    await S3.putBucketNotificationConfiguration(this.getCommandParameters());
    // waiting for oplog populator to take the putNotificationConfiguration into account
    await Utils.sleep(10000);
});

When('i unsubscribe from {string} notifications for destination {int}', async function (notificationType, destination) {
    this.resetCommand();
    this.addCommandParameter({ bucket: this.saved.bucketName });
    const result = await S3.getBucketNotificationConfiguration(this.getCommandParameters());
    assert.strictEqual(this.checkResult(result), true);
    const notificationConfiguration = JSON.parse(result.stdout);
    let QueueConfigIdx = -1;
    const destinationConfiguration = notificationConfiguration.QueueConfigurations.find((conf:any, idx:number) => {
        const configDestinationName = conf.QueueArn.split(':')[5];
        if (configDestinationName === this.saved.notificationDestinations[destination].destinationName) {
            QueueConfigIdx = idx;
            return true;
        }
        return false;
    });
    const excludedNotifications = notificationType !== 'all' ? [notificationType] : allNotificationTypes;
    const configuredNotifEvents = destinationConfiguration.Events.filter((event:any) => !excludedNotifications.includes(event));
    notificationConfiguration.QueueConfigurations[QueueConfigIdx].Events = configuredNotifEvents;
    this.resetCommand();
    this.addCommandParameter({ bucket: this.saved.bucketName });
    this.addCommandParameter({ notificationConfiguration: `'${JSON.stringify(notificationConfiguration)}'` });
    await S3.putBucketNotificationConfiguration(this.getCommandParameters());
    // waiting for oplog populator to take the putNotificationConfiguration into account
    await Utils.sleep(10000);
});

When('a {string} event is triggered {string} {string}', async function (notificationType, enable, filterType) {
    this.resetCommand();
    this.saved.notificationEventType = notificationType;
    let objName = `object-${Utils.randomString()}`.toLocaleLowerCase();
    if (enable === 'with') {
        this.saved.filterType = filterType;
        objName = filterType === 'prefix' ? `${this.saved.objectNamePrefix}${objName}` :
            `${objName}${this.saved.objectNameSufix}`;
    }
    this.saved.objectName = objName;
    switch (notificationType) {
        case 's3:ObjectCreated:Put':
            await putObject(this);
            break;
        case 's3:ObjectCreated:Copy':
            await copyObject(this);
            break;
        case 's3:ObjectRemoved:Delete':
            await deleteObject(this);
            break;
        case 's3:ObjectTagging:Put':
            await putTag(this);
            break;
        case 's3:ObjectTagging:Delete':
            await deleteTag(this);
            break;
        case 's3:ObjectAcl:Put':
            await putAcl(this);
            break;
        case 's3:ObjectRemoved:DeleteMarkerCreated':
            await deleteObject(this, true);
            break;
        default:
            break;
    }
});

Then('notifications should be enabled for {string} event in destination {int}', async function (notificationType, destination) {
    this.resetCommand();
    this.addCommandParameter({ bucket: this.saved.bucketName });
    const result = await S3.getBucketNotificationConfiguration(this.getCommandParameters());
    assert.strictEqual(this.checkResult(result), true);
    const notificationConfiguration = JSON.parse(result.stdout);
    const destinationConfiguration = notificationConfiguration.QueueConfigurations.find((conf:any) => {
        const configDestinationName = conf.QueueArn.split(':')[5];
        return configDestinationName === this.saved.notificationDestinations[destination].destinationName;
    });
    assert(destinationConfiguration.Events.includes(notificationType));
    await S3.deleteBucket(this.getCommandParameters());
});

Then('i should {string} a notification for {string} event in destination {int}', async function (receive, notificationType, destination) {
    const receivedNotification = await KafkaHelper.consumeTopicUntilCondition(
        this.saved.notificationDestinations[destination].topic,
        this.saved.notificationDestinations[destination].hosts,
        `ctst_kafka_consumer_group_${Utils.randomString()}`,
        KAFKA_TESTS_TIMEOUT,
        (msg:any) => {
            try {
                const notification = JSON.parse(msg.value?.toString() || '{Records:[]}').Records[0];
                const bucketNameMatches = this.saved.bucketName === notification?.s3.bucket.name;
                const objectNameMatches = this.saved.objectName === notification?.s3.object.key;
                const eventTypeMatches = notificationType === notification?.eventName;
                if (bucketNameMatches && objectNameMatches && eventTypeMatches) {
                    return true;
                }
                return false;
            } catch (error) {
                return false;
            }
        },
    );
    const expected = receive === 'receive';
    assert.strictEqual(receivedNotification, expected);
    if (this.saved.bucketVersioning === 'Non versioned') {
        await emptyNonVersionedBucket(this);
    } else {
        await emptyVersionedBucket(this);
    }
    this.resetCommand();
    this.addCommandParameter({ bucket: this.saved.bucketName });
    await S3.deleteBucket(this.getCommandParameters());
});
