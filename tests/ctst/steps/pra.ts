import { Then, Given, When, After } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import { S3, Utils, KafkaHelper, AWSVersionObject, NotificationDestination } from 'cli-testing';
import { Message } from 'node-rdkafka';
import { cleanS3Bucket } from 'common/common';
import Zenko from 'world/Zenko';


Given('a PRA installed', function (this: Zenko) {
    return;
});
