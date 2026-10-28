import { After, Given, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { S3 } from 'cli-testing';
import Zenko from 'world/Zenko';
import { safeJsonParse, sleep } from 'common/utils';
import constants from 'common/constants';
import { getObjectNameWithBackendFlakiness } from 'steps/utils/utils';
import {
    ArchiveRequest,
    coldArchiveRequestTopicPrefix,
    coldTopicName,
    startTopicRecorder,
    TopicRecorder,
    waitForDLQMessage,
} from 'steps/utils/kafka';

type HeadObjectOutput = {
    StorageClass?: string,
    Restore?: string,
    Metadata?: Record<string, string>,
};

// Resolves the actual object name and targets it (latest version) in the next S3 command
function targetObject(world: Zenko, objectName: string): string {
    const objName = getObjectNameWithBackendFlakiness.call(world, objectName) || world.getSaved<string>('objectName');
    world.resetCommand();
    world.addCommandParameter({ bucket: world.getSaved<string>('bucketName') });
    world.addCommandParameter({ key: objName });
    const versionId = world.getLatestObjectVersion(objName);
    if (versionId) {
        world.addCommandParameter({ versionId });
    }
    return objName;
}

async function waitForFailedTransition(world: Zenko, objectName: string, attempt?: number) {
    const objName = getObjectNameWithBackendFlakiness.call(world, objectName) || world.getSaved<string>('objectName');
    const bucketName = world.getSaved<string>('bucketName');
    const seenDLQ = world.getSaved<Set<string>>('seenDLQMessages') ?? new Set<string>();
    world.addToSaved('seenDLQMessages', seenDLQ);

    const dlqMsg = await waitForDLQMessage(Zenko.dlqBuffer, 'archive', objName, bucketName, seenDLQ, 3 * 60 * 1000);
    world.logger.info('Found transition failure in DLQ', {
        objectName: objName, reason: dlqMsg.reason, try: dlqMsg.try,
    });
    if (attempt !== undefined) {
        assert.strictEqual(dlqMsg.try ?? 0, attempt, `transition of ${objName} failed on an unexpected attempt`);
    }
}

// Direct-to-cold objects are declared cold from the start, but their data stays hot until
// backbeat picks the write up from the oplog and Sorbet archives it: the transition flag is
// what tells the object is still in this window.
async function assertAwaitingTransition(world: Zenko, objectName: string, location: string, attempt?: number) {
    const objName = targetObject(world, objectName);
    const res = await S3.headObject(world.getCommandParameters());
    assert.ifError(res.err);
    const parsed = safeJsonParse<HeadObjectOutput>(res.stdout);
    assert(parsed.ok);
    assert.strictEqual(parsed.result?.StorageClass, location);
    assert.strictEqual(parsed.result?.Metadata?.[constants.transitionInProgressMD], 'true',
        `object ${objName} is not flagged for transition`);
    if (attempt !== undefined) {
        assert.strictEqual(parsed.result?.Metadata?.[constants.transitionAttemptMD], `${attempt}`,
            `object ${objName} is not on transition attempt ${attempt}`);
    }
}

Then('object {string} should be awaiting transition to {string}',
    async function (this: Zenko, objectName: string, location: string) {
        await assertAwaitingTransition(this, objectName, location);
    });

// The attempt counter is bumped when the transition is retried after a failure
Then('object {string} should be awaiting transition to {string} on attempt {int}',
    async function (this: Zenko, objectName: string, location: string, attempt: number) {
        await assertAwaitingTransition(this, objectName, location, attempt);
    });

Then('i {string} be able to read object {string}',
    async function (this: Zenko, expectedResult: string, objectName: string) {
        const objName = targetObject(this, objectName);
        const res = await S3.getObject(this.getCommandParameters());
        if (expectedResult === 'should not') {
            assert(res.err?.includes('InvalidObjectState'),
                `reading object ${objName} should fail with InvalidObjectState, got: ${res.err || 'success'}`);
        } else {
            assert.ifError(res.err);
        }
    });

Then('the transition of object {string} should fail',
    { timeout: 4 * 60 * 1000 }, async function (this: Zenko, objectName: string) {
        await waitForFailedTransition(this, objectName);
    });

Then('the transition of object {string} should fail on attempt {int}',
    { timeout: 4 * 60 * 1000 }, async function (this: Zenko, objectName: string, attempt: number) {
        await waitForFailedTransition(this, objectName, attempt);
    });

Given('the archive requests sent to {string} location are recorded',
    async function (this: Zenko, location: string) {
        const topic = coldTopicName(this.parameters.InstanceID, coldArchiveRequestTopicPrefix, location);
        const recorder = await startTopicRecorder<ArchiveRequest>(this.parameters.KafkaHosts, topic);
        this.addToSaved('archiveRequestRecorder', recorder);
    });

Then('exactly {int} archive request(s) should have been sent for object {string}',
    { timeout: 2 * 60 * 1000 }, async function (this: Zenko, count: number, objectName: string) {
        const recorder = this.getSaved<TopicRecorder<ArchiveRequest>>('archiveRequestRecorder');
        assert(recorder, 'the archive requests are not recorded in this scenario');
        const objName = getObjectNameWithBackendFlakiness.call(this, objectName) || this.getSaved<string>('objectName');
        const bucketName = this.getSaved<string>('bucketName');
        const requestsForObject = () =>
            recorder.messages.filter(m => m.bucketName === bucketName && m.objectKey === objName);

        // The recorder may lag behind: give the expected requests time to show up before
        // checking no other one was sent
        const deadline = Date.now() + 60 * 1000;
        while (requestsForObject().length < count && Date.now() < deadline) {
            await sleep(1000);
        }
        const requests = requestsForObject();
        assert.strictEqual(requests.length, count,
            `expected ${count} archive request(s) for object ${objName}, got ${JSON.stringify(requests)}`);
    });

After(async function (this: Zenko) {
    const recorder = this.getSaved<TopicRecorder<ArchiveRequest>>('archiveRequestRecorder');
    await recorder?.stop();
});
