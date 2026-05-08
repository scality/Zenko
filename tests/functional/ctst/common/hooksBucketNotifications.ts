import { Before } from '@cucumber/cucumber';
import { S3, WorkCoordination } from 'cli-testing';
import Zenko from '../world/Zenko';
import { waitForBucketConnectorState } from '../steps/utils/kafka';
import { allNotificationTypes, wildcardNotificationTypes } from '../steps/notifications';

// Deterministic bucket names for the shared notification buckets.
// Using fixed names means all parallel workers reference the same buckets,
// and only one Kafka Connect connector is created per bucket (instead of
// one per scenario), reducing the rebalance issues that caused flakiness.
const SHARED_NOTIF_BUCKET_PREFIX = 'notif-shared-';
export const SHARED_NOTIF_BUCKETS: Record<string, string> = {
    'Non versioned': `${SHARED_NOTIF_BUCKET_PREFIX}non-versioned`,
    'Versioned': `${SHARED_NOTIF_BUCKET_PREFIX}versioned`,
    'Versioning suspended': `${SHARED_NOTIF_BUCKET_PREFIX}suspended`,
};

// Shared buckets subscribed only with wildcard event types (s3:ObjectCreated:*, etc.)
// to test that wildcard expansion correctly matches concrete events.
export const SHARED_WILDCARD_BUCKETS: Record<string, string> = {
    'Non versioned': `${SHARED_NOTIF_BUCKET_PREFIX}wildcard-non-versioned`,
    'Versioned': `${SHARED_NOTIF_BUCKET_PREFIX}wildcard-versioned`,
    'Versioning suspended': `${SHARED_NOTIF_BUCKET_PREFIX}wildcard-suspended`,
};

Before({ tags: '@BucketNotificationShared', timeout: 300000 },
    async function (this: Zenko) {
        await Zenko.init(this.parameters);
        const lockName = `notif-shared-buckets-${process.ppid}`;
        await WorkCoordination.runOnceAcrossWorkers(
            { lockName, logger: this.logger },
            async () => {
                for (const [versioning, bucketName] of Object.entries(SHARED_NOTIF_BUCKETS)) {
                    // Create bucket
                    this.resetCommand();
                    this.addCommandParameter({ bucket: bucketName });
                    await S3.createBucket(this.getCommandParameters());
                    if (versioning !== 'Non versioned') {
                        this.resetCommand();
                        this.addCommandParameter({ bucket: bucketName });
                        const status = versioning === 'Versioned' ? 'Enabled' : 'Suspended';
                        this.addCommandParameter({ versioningConfiguration: `Status=${status}` });
                        await S3.putBucketVersioning(this.getCommandParameters());
                    }

                    // Non-filtered subscriptions on default, PLAIN, SCRAM destinations
                    const queueConfigs: Record<string, unknown>[] = [
                        this.parameters.NotificationDestination,
                        this.parameters.NotificationDestinationPlain,
                        this.parameters.NotificationDestinationScram,
                    ].filter(Boolean).map(dest => ({
                        QueueArn: `arn:scality:bucketnotif:::${dest}`,
                        Events: allNotificationTypes,
                    }));

                    // Filtered subscriptions on ALT destination (prefix + suffix)
                    const altDest = this.parameters.NotificationDestinationAlt;
                    queueConfigs.push({
                        QueueArn: `arn:scality:bucketnotif:::${altDest}`,
                        Events: allNotificationTypes,
                        Filter: { Key: { FilterRules: [{ Name: 'Prefix', Value: 'pfx-' }] } },
                    });
                    queueConfigs.push({
                        QueueArn: `arn:scality:bucketnotif:::${altDest}`,
                        Events: allNotificationTypes,
                        Filter: { Key: { FilterRules: [{ Name: 'Suffix', Value: '-sfx' }] } },
                    });

                    const destinationConfig = { QueueConfigurations: queueConfigs };
                    this.resetCommand();
                    this.addCommandParameter({ bucket: bucketName });
                    this.addCommandParameter({
                        notificationConfiguration: `'${JSON.stringify(destinationConfig)}'`,
                    });
                    await S3.putBucketNotificationConfiguration(this.getCommandParameters());
                }

                // Create wildcard shared buckets (subscribed with s3:ObjectCreated:* etc.)
                for (const [versioning, bucketName] of Object.entries(SHARED_WILDCARD_BUCKETS)) {
                    this.resetCommand();
                    this.addCommandParameter({ bucket: bucketName });
                    await S3.createBucket(this.getCommandParameters());
                    if (versioning !== 'Non versioned') {
                        this.resetCommand();
                        this.addCommandParameter({ bucket: bucketName });
                        const status = versioning === 'Versioned' ? 'Enabled' : 'Suspended';
                        this.addCommandParameter({ versioningConfiguration: `Status=${status}` });
                        await S3.putBucketVersioning(this.getCommandParameters());
                    }

                    const wildcardConfig = {
                        QueueConfigurations: [
                            {
                                QueueArn: `arn:scality:bucketnotif:::${this.parameters.NotificationDestination}`,
                                Events: wildcardNotificationTypes,
                            },
                            {
                                QueueArn: `arn:scality:bucketnotif:::${this.parameters.NotificationDestinationPlain}`,
                                Events: wildcardNotificationTypes,
                            },
                            {
                                QueueArn: `arn:scality:bucketnotif:::${this.parameters.NotificationDestinationScram}`,
                                Events: wildcardNotificationTypes,
                            },
                        ],
                    };
                    this.resetCommand();
                    this.addCommandParameter({ bucket: bucketName });
                    this.addCommandParameter({
                        notificationConfiguration: `'${JSON.stringify(wildcardConfig)}'`,
                    });
                    await S3.putBucketNotificationConfiguration(this.getCommandParameters());
                }

                // Wait for all shared buckets to appear in connector pipelines
                const allBuckets = [
                    ...Object.values(SHARED_NOTIF_BUCKETS),
                    ...Object.values(SHARED_WILDCARD_BUCKETS),
                ];
                await Promise.all(allBuckets.map(bucketName =>
                    waitForBucketConnectorState(
                        this.parameters.KafkaConnectUrl, bucketName, 'present'),
                ));
                this.logger.info('Shared notification buckets are ready', {
                    buckets: { ...SHARED_NOTIF_BUCKETS, ...SHARED_WILDCARD_BUCKETS },
                });
            },
        );
    },
);
