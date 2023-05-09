import { Then, Given, When, setDefaultTimeout } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import Zenko, {
    ApiResult,
    AWSVersionObject,
} from '../world/Zenko';
import { Constants, S3, Utils, KafkaHelper } from 'cli-testing';
import { Message } from 'node-rdkafka';

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

interface NotificationConfig {
    QueueConfigurations: QueueConfiguration[];
}

interface NotificationDestination {
    destinationName: string;
    topic: string;
    hosts: string;
}

interface Notification {
    s3: {
        bucket: {
            name: string;
        }
        object: {
            key: string;
        }
    }
    eventName: string;
}

interface QueueConfiguration {
    QueueArn: string;
    Events: string[];
}

async function emptyNonVersionedBucket(world: Zenko) {
    world.resetCommand();
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    const results = await S3.listObjects(world.getCommandParameters());
    const objects = (JSON.parse(results.stdout || '{}') as { Contents?: AWSVersionObject[] })?.Contents || [];
    await Promise.all(objects.map(obj => {
        world.deleteKeyFromCommand('key');
        world.addCommandParameter({ key: obj.Key });
        return S3.deleteObject(world.getCommandParameters());
    }));
}

async function emptyVersionedBucket(world: Zenko) {
    world.resetCommand();
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    const results = await S3.listObjectVersions(world.getCommandParameters());
    const parsedResults = JSON.parse(results.stdout || '{}') as Record<string, unknown>;
    const versions = parsedResults.Versions as AWSVersionObject[] || [];
    const deleteMarkers = parsedResults.DeleteMarkers as AWSVersionObject[] || [];
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

async function putObject(world: Zenko) {
    world.resetCommand();
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    world.addCommandParameter({ key: world.getSaved<string>('objectName') });
    const result = await S3.putObject(world.getCommandParameters());
    world.setResult(result);
}

async function copyObject(world: Zenko) {
    await putObject(world);
    world.resetCommand();
    let objName = `object-${Utils.randomString()}`.toLocaleLowerCase();
    if (world.getSaved<string>('filterType')) {
        objName = world.getSaved<string>('filterType') === 'prefix' ?
            `${world.getSaved<string>('objectNamePrefix') }${objName}` :
            `${objName}${ world.getSaved<string>('objectNameSufix') }`;
    }
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    world.addCommandParameter({ key: objName });
    world.addCommandParameter({
        copySource:
            `${world.getSaved<string>('bucketName')}/${world.getSaved<string>('objectName') }`,
    });
    world.addToSaved('objectName', objName);
    await S3.copyObject(world.getCommandParameters());
}

async function deleteObject(world: Zenko, putDeleteMarker = false) {
    await putObject(world);
    world.resetCommand();
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    world.addCommandParameter({ key: world.getSaved<string>('objectName') });
    if (world.getSaved<string>('bucketVersioning') !== 'Non versioned' && !putDeleteMarker) {
        const putResult = world.getResult();
        const versionId =
            (JSON.parse(putResult.stdout!) as AWSVersionObject).VersionId;
        world.addCommandParameter({ versionId });
    }
    await S3.deleteObject(world.getCommandParameters());
}

async function putTag(world: Zenko) {
    await putObject(world);
    world.resetCommand();
    const tags = JSON.stringify({
        TagSet: [{
            Key: 'key',
            Value: 'value',
        }],
    });
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    world.addCommandParameter({ key: world.getSaved<string>('objectName') });
    world.addCommandParameter({ tagging: `'${tags}'` });
    await S3.putObjectTagging(world.getCommandParameters());
}

async function deleteTag(world: Zenko) {
    await putTag(world);
    world.resetCommand();
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    world.addCommandParameter({ key: world.getSaved<string>('objectName') });
    await S3.deleteObjectTagging(world.getCommandParameters());
}

async function putAcl(world: Zenko) {
    await putObject(world);
    world.resetCommand();
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    world.addCommandParameter({ key: world.getSaved<string>('objectName') });
    world.addCommandParameter({ acl: 'public-read' });
    await S3.putObjectAcl(world.getCommandParameters());
}

Given('one notification destination', function (this: Zenko) {
    const notificationDestinations = [];
    notificationDestinations.push({
        destinationName: this.parameters.NotificationDestination,
        topic: this.parameters.NotificationDestinationTopic,
        hosts: this.parameters.KafkaHosts,
    });
    this.addToSaved('notificationDestinations', notificationDestinations);
});

Given('two notification destinations', function (this: Zenko) {
    const notificationDestinations = [];
    notificationDestinations.push({
        destinationName: this.parameters.NotificationDestination,
        topic: this.parameters.NotificationDestinationTopic,
        hosts: this.parameters.KafkaHosts,
    });
    notificationDestinations.push({
        destinationName: this.parameters.NotificationDestinationAlt,
        topic: this.parameters.NotificationDestinationTopicAlt,
        hosts: this.parameters.KafkaHosts,
    });
    this.addToSaved('notificationDestinations', notificationDestinations);
});

When('i subscribe to {string} notifications for destination {int}',
    async function (this: Zenko, notificationType: string, destination: number) {
        const notificationsPerDestination : Record<string, string[]> = {};
        notificationsPerDestination[`${destination}`] =
            notificationType !== 'all' ? [notificationType] : allNotificationTypes;
        this.addToSaved('notificationsPerDestination', notificationsPerDestination);
        const destinationConfig = {
            QueueConfigurations: [
                {
                    QueueArn: 'arn:scality:bucketnotif:::' +
                        `${(this.getSaved<Array<NotificationDestination>>('notificationDestinations')[destination])
                            .destinationName}`,
                    Events: notificationsPerDestination[`${destination}`],
                },
            ],
        };
        (this).resetCommand();
        // Getting and adapting previous notification configuration
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        const result = await S3.getBucketNotificationConfiguration(this.getCommandParameters());
        try {
            const notificationConfig = JSON.parse(result.stdout) as NotificationConfig;
            notificationConfig.QueueConfigurations.push(destinationConfig.QueueConfigurations[0]);
            this.addCommandParameter({ notificationConfiguration: `'${JSON.stringify(notificationConfig)}'` });
        } catch (error) {
            // Put new config if old doesn't exist
            this.addCommandParameter({ notificationConfiguration: `'${JSON.stringify(destinationConfig)}'` });
        }
        await S3.putBucketNotificationConfiguration(this.getCommandParameters());
        // waiting for oplog populator to take the putNotificationConfiguration into account
        await Utils.sleep(10000);
    });

When('i subscribe to {string} notifications for destination {int} with {string} filter',
    async function (this: Zenko, notificationType: string, destination: number, filterType: string) {
        const notificationsPerDestination : Record<string, string[]> = {};

        notificationsPerDestination[`${destination}`] =
            notificationType !== 'all' ? [notificationType] : allNotificationTypes;
        this.addToSaved('objectNamePrefix', filterType === 'prefix' ? 'pfx-' : '');
        this.addToSaved('objectNameSufix', filterType === 'suffix' ? '-sfx' : '');
        this.addToSaved('notificationsPerDestination', notificationsPerDestination);
        let filter = filterType.toLocaleLowerCase();
        filter = filter[0].toUpperCase() + filter.slice(1);
        const destinationConfig = {
            QueueConfigurations: [
                {
                    QueueArn: 'arn:scality:bucketnotif:::' +
                        `${(this.getSaved<NotificationDestination[]>('notificationDestinations')[destination])
                            .destinationName}`,
                    Events: notificationsPerDestination[`${destination}`],
                    Filter: {
                        Key: {
                            FilterRules: [
                                {
                                    Name: filter,
                                    Value: filterType === 'prefix' ? 'pfx-' : '-sfx',
                                },
                            ],
                        },
                    },
                },
            ],
        };
        this.resetCommand();
        // Getting and adapting previous notification configuration
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        const result = await S3.getBucketNotificationConfiguration(this.getCommandParameters());
        try {
            const notificationConfig = JSON.parse(result.stdout) as NotificationConfig;
            // Update old config and update
            notificationConfig.QueueConfigurations.push(destinationConfig.QueueConfigurations[0]);
            this.addCommandParameter({ notificationConfiguration: `'${JSON.stringify(notificationConfig)}'` });
        } catch (error) {
            // Put new config it old doesn't exist
            this.addCommandParameter({ notificationConfiguration: `'${JSON.stringify(destinationConfig)}'` });
        }
        await S3.putBucketNotificationConfiguration(this.getCommandParameters());
        // waiting for oplog populator to take the putNotificationConfiguration into account
        await Utils.sleep(10000);
    });

// eslint-disable-next-line new-cap
When('i unsubscribe from {string} notifications for destination {int}',
    async function (this: Zenko, notificationType: string, destination: number) {
        this.resetCommand();
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        const result = await S3.getBucketNotificationConfiguration(this.getCommandParameters());
        assert.strictEqual(this.checkResults([result]), true);
        const notificationConfiguration = JSON.parse(result.stdout) as NotificationConfig;
        let QueueConfigIdx = -1;
        const destinationConfiguration = notificationConfiguration
            .QueueConfigurations
            .find((conf: QueueConfiguration, idx: number) => {
                const configDestinationName = conf.QueueArn.split(':')[5];
                if (configDestinationName ===
                    (this.getSaved<NotificationDestination[]>('notificationDestinations')[destination])
                        .destinationName) {
                    QueueConfigIdx = idx;
                    return true;
                }
                return false;
            }) as QueueConfiguration;
        const excludedNotifications = notificationType !== 'all' ? [notificationType] : allNotificationTypes;
        const configuredNotifEvents =
            destinationConfiguration.Events.filter((event: string) => !excludedNotifications.includes(event));
        notificationConfiguration.QueueConfigurations[QueueConfigIdx].Events = configuredNotifEvents;
        this.resetCommand();
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        this.addCommandParameter({ notificationConfiguration: `'${JSON.stringify(notificationConfiguration)}'` });
        await S3.putBucketNotificationConfiguration(this.getCommandParameters());
        // waiting for oplog populator to take the putNotificationConfiguration into account
        await Utils.sleep(10000);
    });

// eslint-disable-next-line new-cap
When('a {string} event is triggered {string} {string}',
    async function (this: Zenko, notificationType: string, enable: string, filterType: string) {
        this.resetCommand();
        this.addToSaved('notificationEventType', notificationType);
        let objName = `object-${Utils.randomString()}`.toLocaleLowerCase();
        if (enable === 'with') {
            this.addToSaved('filterType', filterType);
            objName = filterType === 'prefix' ? `${this.getSaved<string>('objectNamePrefix')}${objName}` :
                `${objName}${this.getSaved<string>('objectNameSufix')}`;
        }
        this.addToSaved('objectName', objName);
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

Then('notifications should be enabled for {string} event in destination {int}',
    async function (this: Zenko, notificationType: string, destination: number) {
        this.resetCommand();
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        const result = await S3.getBucketNotificationConfiguration(this.getCommandParameters());
        assert.strictEqual(this.checkResults([result]), true);
        const notificationConfiguration = JSON.parse(result.stdout) as NotificationConfig;
        const destinationConfiguration = notificationConfiguration
            .QueueConfigurations.find((conf: QueueConfiguration) => {
                const configDestinationName = conf.QueueArn.split(':')[5];
                return configDestinationName ===
                    (this.getSaved<NotificationDestination[]>('notificationDestinations')[destination]).destinationName;
            }) as QueueConfiguration;
        assert(destinationConfiguration.Events.includes(notificationType));
        await S3.deleteBucket(this.getCommandParameters());
    });

// eslint-disable-next-line new-cap
Then('i should {string} a notification for {string} event in destination {int}',
    async function (this: Zenko, receive: string, notificationType: string, destination: number) {

        const receivedNotification = await KafkaHelper.consumeTopicUntilCondition(
            this.getSaved<NotificationDestination[]>('notificationDestinations')[destination].topic,
            this.getSaved<NotificationDestination[]>('notificationDestinations')[destination].hosts,
            `ctst_kafka_consumer_group_${Utils.randomString()}`,
            KAFKA_TESTS_TIMEOUT,
            (msg: Message) => {
                try {
                    const notification = (JSON.parse(msg.value?.toString() as string
                        || '{Records:[]}') as { Records: Notification[] }).Records[0] ;
                    const bucketNameMatches = this.getSaved<string>('bucketName') === notification?.s3.bucket.name;
                    const objectNameMatches = this.getSaved<string>('objectName') === notification?.s3.object.key;
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
        if (this.getSaved<string>('bucketVersioning') === 'Non versioned') {
            await emptyNonVersionedBucket(this);
        } else {
            await emptyVersionedBucket(this);
        }
        this.resetCommand();
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        await S3.deleteBucket(this.getCommandParameters());
    });
