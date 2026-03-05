import { Then, Given, When } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import { S3, Utils, AWSVersionObject, NotificationDestination } from 'cli-testing';
import { Consumer, stringDeserializers } from '@platformatic/kafka';
import Zenko from 'world/Zenko';
import { putObject } from './utils/utils';

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

async function copyObject(world: Zenko, sourceObject: string) {
    await putObject(world, sourceObject);
    world.resetCommand();
    let objName = `notif-s3:objectcreated:copy-target-${Utils.randomString()}`.toLocaleLowerCase();
    if (world.getSaved<string>('filterType')) {
        objName = world.getSaved<string>('filterType') === 'prefix' ?
            `${world.getSaved<string>('objectNamePrefix') }${objName}` :
            `${objName}${ world.getSaved<string>('objectNameSufix') }`;
    }
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    world.addCommandParameter({ key: objName });
    world.addCommandParameter({
        copySource:
            `${world.getSaved<string>('bucketName')}/${sourceObject}`,
    });
    world.addToSaved('objectName', objName);
    await S3.copyObject(world.getCommandParameters());
}

async function deleteObject(world: Zenko, objName: string, putDeleteMarker = false) {
    await putObject(world, objName);
    world.resetCommand();
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    world.addCommandParameter({ key: objName });
    if (world.getSaved<string>('bucketVersioning') !== 'Non versioned' && !putDeleteMarker) {
        const putResult = world.getResult();
        const versionId =
            (JSON.parse(putResult.stdout) as AWSVersionObject).VersionId;
        world.addCommandParameter({ versionId });
    }
    await S3.deleteObject(world.getCommandParameters());
}

async function putTag(world: Zenko, objName: string) {
    await putObject(world, objName);
    world.resetCommand();
    const tags = JSON.stringify({
        TagSet: [{
            Key: 'key',
            Value: 'value',
        }],
    });
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    world.addCommandParameter({ key: objName });
    world.addCommandParameter({ tagging: `'${tags}'` });
    await S3.putObjectTagging(world.getCommandParameters());
}

async function deleteTag(world: Zenko, objName: string) {
    await putTag(world, objName);
    world.resetCommand();
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    world.addCommandParameter({ key: objName });
    await S3.deleteObjectTagging(world.getCommandParameters());
}

async function putAcl(world: Zenko, objName: string) {
    await putObject(world, objName);
    world.resetCommand();
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    world.addCommandParameter({ key: objName });
    world.addCommandParameter({ acl: 'public-read' });
    await S3.putObjectAcl(world.getCommandParameters());
}

function setNotificationDestination(world: Zenko, destination: string, topic: string, hosts: string) {
    const notificationDestinations = [];
    notificationDestinations.push({
        destinationName: destination,
        topic,
        hosts,
    });
    world.addToSaved('notificationDestinations', notificationDestinations);
}

Given('one notification destination', function (this: Zenko) {
    setNotificationDestination(
        this,
        this.parameters.NotificationDestination,
        this.parameters.NotificationDestinationTopic,
        this.parameters.KafkaHosts,
    );
});

Given('one PLAIN authenticated notification destination', function (this: Zenko) {
    setNotificationDestination(
        this,
        this.parameters.NotificationDestinationPlain,
        this.parameters.NotificationDestinationTopicPlain,
        this.parameters.KafkaAuthHosts,
    );
});

Given('one SCRAM authenticated notification destination', function (this: Zenko) {
    setNotificationDestination(
        this,
        this.parameters.NotificationDestinationScram,
        this.parameters.NotificationDestinationTopicScram,
        this.parameters.KafkaAuthHosts,
    );
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
            this.logger.debug('Error parsing notification configuration', { error });
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
            this.logger.debug('Error putting notification configuration', { error });
            // Put new config it old doesn't exist
            this.addCommandParameter({ notificationConfiguration: `'${JSON.stringify(destinationConfig)}'` });
        }
        await S3.putBucketNotificationConfiguration(this.getCommandParameters());
        // waiting for oplog populator to take the putNotificationConfiguration into account
        await Utils.sleep(10000);
    });

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

When('a {string} event is triggered {string} {string}',
    async function (this: Zenko, notificationType: string, enable: string, filterType: string) {
        this.resetCommand();
        this.addToSaved('notificationEventType', notificationType);
        let objName = `notif-${notificationType}-${enable}-${filterType}-${Utils.randomString()}`.toLocaleLowerCase();
        if (enable === 'with') {
            this.addToSaved('filterType', filterType);
            objName = filterType === 'prefix' ? `${this.getSaved<string>('objectNamePrefix')}${objName}` :
                `${objName}${this.getSaved<string>('objectNameSufix')}`;
        }
        this.addToSaved('objectName', objName);
        switch (notificationType) {
        case 's3:ObjectCreated:Put':
            await putObject(this, objName);
            break;
        case 's3:ObjectCreated:Copy':
            await copyObject(this, objName);
            break;
        case 's3:ObjectRemoved:Delete':
            await deleteObject(this, objName);
            break;
        case 's3:ObjectTagging:Put':
            await putTag(this, objName);
            break;
        case 's3:ObjectTagging:Delete':
            await deleteTag(this, objName);
            break;
        case 's3:ObjectAcl:Put':
            await putAcl(this, objName);
            break;
        case 's3:ObjectRemoved:DeleteMarkerCreated':
            await deleteObject(this, objName, true);
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
    });

Then('i should {string} a notification for {string} event in destination {int}',
    async function (this: Zenko, receive: string, notificationType: string, destination: number) {
        const topic = this.getSaved<NotificationDestination[]>('notificationDestinations')[destination].topic;
        const hosts = this.getSaved<NotificationDestination[]>('notificationDestinations')[destination].hosts;
        const groupId = `ctst_kafka_consumer_group_${Utils.randomString()}`;

        const consumer = new Consumer({
            clientId: groupId,
            groupId,
            bootstrapBrokers: [hosts],
            deserializers: stringDeserializers,
        });

        let receivedNotification = false;
        const startTime = Date.now();

        try {
            const stream = await consumer.consume({
                topics: [topic],
                mode: 'earliest',
                sessionTimeout: 10000,
                heartbeatInterval: 500,
            });

            // Force-close the stream after timeout to avoid hanging
            // when no more messages arrive (e.g. "not receive" tests)
            const timeoutHandle = setTimeout(() => {
                stream.close().catch(() => {});
            }, KAFKA_TESTS_TIMEOUT);

            try {
                for await (const msg of stream) {
                    if (Date.now() - startTime >= KAFKA_TESTS_TIMEOUT) {
                        break;
                    }
                    this.logger.debug('Kafka message received', {
                        topic: msg.topic,
                        partition: msg.partition,
                        offset: msg.offset?.toString(),
                        value: msg.value,
                    });
                    try {
                        const notification = (JSON.parse(msg.value as string
                            || '{"Records":[]}') as { Records: Notification[] }).Records[0];
                        const bucketNameMatches =
                            this.getSaved<string>('bucketName') === notification?.s3.bucket.name;
                        const objectNameMatches =
                            this.getSaved<string>('objectName') === notification?.s3.object.key;
                        const eventTypeMatches = notificationType === notification?.eventName;
                        if (bucketNameMatches && objectNameMatches && eventTypeMatches) {
                            receivedNotification = true;
                            break;
                        }
                    } catch (error) {
                        this.logger.debug('error when parsing notification message', { error });
                    }
                }
            } finally {
                clearTimeout(timeoutHandle);
            }

            await stream.close();
        } finally {
            await consumer.close();
        }

        const expected = receive === 'receive';
        assert.strictEqual(receivedNotification, expected);
    });
