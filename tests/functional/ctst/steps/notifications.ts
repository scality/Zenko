import { Then, Given, When } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import { Utils, NotificationDestination } from 'cli-testing';
import { Consumer, stringDeserializers } from '@platformatic/kafka';
import Zenko from 'world/Zenko';
import { putObject } from './utils/utils';
import { waitForBucketInConnectorPipeline } from './utils/kafka';
import {
    CopyObjectCommand,
    DeleteObjectCommand,
    PutObjectTaggingCommand,
    DeleteObjectTaggingCommand,
    PutObjectAclCommand,
    GetBucketNotificationConfigurationCommand,
    PutBucketNotificationConfigurationCommand,
    type QueueConfiguration as S3QueueConfiguration,
} from '@aws-sdk/client-s3';

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
    const bucket = world.getSaved<string>('bucketName');
    let objName = `notif-s3:objectcreated:copy-target-${Utils.randomString()}`.toLocaleLowerCase();
    if (world.getSaved<string>('filterType')) {
        objName = world.getSaved<string>('filterType') === 'prefix'
            ? `${world.getSaved<string>('objectNamePrefix')}${objName}`
            : `${objName}${world.getSaved<string>('objectNameSufix')}`;
    }
    world.addToSaved('objectName', objName);
    await world.awsClients.s3.send(new CopyObjectCommand({
        Bucket: bucket,
        Key: objName,
        CopySource: `${bucket}/${sourceObject}`,
    }));
}

async function deleteObject(world: Zenko, objName: string, putDeleteMarker = false) {
    await putObject(world, objName);
    const bucket = world.getSaved<string>('bucketName');
    const versionId = (!putDeleteMarker && world.getSaved<string>('bucketVersioning') !== 'Non versioned')
        ? world.getLatestObjectVersion(objName) || undefined
        : undefined;
    await world.awsClients.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: objName, VersionId: versionId }));
}

async function putTag(world: Zenko, objName: string) {
    await putObject(world, objName);
    await world.awsClients.s3.send(new PutObjectTaggingCommand({
        Bucket: world.getSaved<string>('bucketName'),
        Key: objName,
        Tagging: { TagSet: [{ Key: 'key', Value: 'value' }] },
    }));
}

async function deleteTag(world: Zenko, objName: string) {
    await putTag(world, objName);
    await world.awsClients.s3.send(new DeleteObjectTaggingCommand({
        Bucket: world.getSaved<string>('bucketName'),
        Key: objName,
    }));
}

async function putAcl(world: Zenko, objName: string) {
    await putObject(world, objName);
    await world.awsClients.s3.send(new PutObjectAclCommand({
        Bucket: world.getSaved<string>('bucketName'),
        Key: objName,
        ACL: 'public-read',
    }));
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
        const bucket = this.getSaved<string>('bucketName');
        const newEntry: S3QueueConfiguration = {
            QueueArn: 'arn:scality:bucketnotif:::' +
                `${(this.getSaved<Array<NotificationDestination>>('notificationDestinations')[destination])
                    .destinationName}`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Events: notificationsPerDestination[`${destination}`] as any,
        };
        // Get existing notification config (may be empty)
        let existingQueues: S3QueueConfiguration[] = [];
        try {
            const existing = await this.awsClients.s3.send(
                new GetBucketNotificationConfigurationCommand({ Bucket: bucket }),
            );
            existingQueues = existing.QueueConfigurations || [];
        } catch (error) {
            this.logger.debug('Error getting notification configuration', { error });
        }
        existingQueues.push(newEntry);
        await this.awsClients.s3.send(new PutBucketNotificationConfigurationCommand({
            Bucket: bucket,
            NotificationConfiguration: { QueueConfigurations: existingQueues },
        }));
        await waitForBucketInConnectorPipeline(this.parameters.KafkaConnectUrl, bucket);
    });

When('i subscribe to {string} notifications for destination {int} with {string} filter',
    async function (this: Zenko, notificationType: string, destination: number, filterType: string) {
        const notificationsPerDestination : Record<string, string[]> = {};
        notificationsPerDestination[`${destination}`] =
            notificationType !== 'all' ? [notificationType] : allNotificationTypes;
        this.addToSaved('objectNamePrefix', filterType === 'prefix' ? 'pfx-' : '');
        this.addToSaved('objectNameSufix', filterType === 'suffix' ? '-sfx' : '');
        this.addToSaved('notificationsPerDestination', notificationsPerDestination);
        const filterName = filterType.charAt(0).toUpperCase() + filterType.slice(1).toLocaleLowerCase();
        const bucket = this.getSaved<string>('bucketName');
        const newEntry: S3QueueConfiguration = {
            QueueArn: 'arn:scality:bucketnotif:::' +
                `${(this.getSaved<NotificationDestination[]>('notificationDestinations')[destination])
                    .destinationName}`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Events: notificationsPerDestination[`${destination}`] as any,
            Filter: {
                Key: {
                    FilterRules: [{
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        Name: filterName as any,
                        Value: filterType === 'prefix' ? 'pfx-' : '-sfx',
                    }],
                },
            },
        };
        let existingQueues: S3QueueConfiguration[] = [];
        try {
            const existing = await this.awsClients.s3.send(
                new GetBucketNotificationConfigurationCommand({ Bucket: bucket }),
            );
            existingQueues = existing.QueueConfigurations || [];
        } catch (error) {
            this.logger.debug('Error getting notification configuration', { error });
        }
        existingQueues.push(newEntry);
        await this.awsClients.s3.send(new PutBucketNotificationConfigurationCommand({
            Bucket: bucket,
            NotificationConfiguration: { QueueConfigurations: existingQueues },
        }));
        await waitForBucketInConnectorPipeline(this.parameters.KafkaConnectUrl, bucket);
    });

When('i unsubscribe from {string} notifications for destination {int}',
    async function (this: Zenko, notificationType: string, destination: number) {
        const bucket = this.getSaved<string>('bucketName');
        const existing = await this.awsClients.s3.send(new GetBucketNotificationConfigurationCommand({ Bucket: bucket }));
        const queues = existing.QueueConfigurations || [];
        let queueIdx = -1;
        const destinationConf = queues.find((conf, idx) => {
            const configDestinationName = (conf.QueueArn ?? '').split(':')[5];
            if (configDestinationName ===
                (this.getSaved<NotificationDestination[]>('notificationDestinations')[destination]).destinationName) {
                queueIdx = idx;
                return true;
            }
            return false;
        });
        assert(destinationConf, `No notification config found for destination ${destination}`);
        const excludedNotifications = notificationType !== 'all' ? [notificationType] : allNotificationTypes;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queues[queueIdx].Events = (queues[queueIdx].Events as any[]).filter(
            (event: string) => !excludedNotifications.includes(event),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any;
        await this.awsClients.s3.send(new PutBucketNotificationConfigurationCommand({
            Bucket: bucket,
            NotificationConfiguration: { QueueConfigurations: queues },
        }));
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
        const bucket = this.getSaved<string>('bucketName');
        const result = await this.awsClients.s3.send(new GetBucketNotificationConfigurationCommand({ Bucket: bucket }));
        const destinationConf = (result.QueueConfigurations || []).find(conf => {
            const configDestinationName = (conf.QueueArn ?? '').split(':')[5];
            return configDestinationName ===
                (this.getSaved<NotificationDestination[]>('notificationDestinations')[destination]).destinationName;
        });
        assert(destinationConf, `No notification config found for destination ${destination}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        assert((destinationConf.Events as any[]).includes(notificationType));
    });

Then('i should {string} a notification for {string} event in destination {int}',
    async function (this: Zenko, receive: string, notificationType: string, destination: number) {
        const { topic, hosts } = this.getSaved<NotificationDestination[]>('notificationDestinations')[destination];
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
