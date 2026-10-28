
import { Admin, Consumer, stringDeserializers } from '@platformatic/kafka';
import { sleep, randomString } from 'common/utils';

// Sorbet topics are per cold location, named after the Zenko instance and the location
export function coldTopicName(instanceId: string, prefix: string, location: string): string {
    return `${instanceId}.${prefix}${location}`;
}

export const coldArchiveRequestTopicPrefix = 'cold-archive-req-';
export const coldGCRequestTopicPrefix = 'cold-gc-req-';
export const coldDeadLetterTopicPrefix = 'cold-dead-letter-';

export async function listTopics(kafkaHosts: string, filter: (topic: string) => boolean): Promise<string[]> {
    const admin = new Admin({
        clientId: `zenko-e2e-${randomString()}`,
        bootstrapBrokers: [kafkaHosts],
    });
    try {
        return (await admin.listTopics()).filter(filter);
    } finally {
        await admin.close();
    }
}

export interface DLQMessage {
    op: string;
    bucketName: string;
    objectKey: string;
    accountId: string;
    eTag: string;
    archiveInfo: Record<string, unknown>;
    requestId: string;
    originalMessage: string;
    reason: string;
    date: string;
    // retry count of the job, omitted on the first attempt
    try?: number;
}

/** Transition request published by backbeat to the cold-archive-req-<location> topic */
export interface ArchiveRequest {
    accountId: string;
    bucketName: string;
    objectKey: string;
    objectVersion?: string;
    requestId: string;
    size: number;
    eTag: string;
    try?: number;
    transitionTime: string;
}

export function dlqKey(op: string, bucketName: string, objectKey: string): string {
    return `${op}:${bucketName}:${objectKey}`;
}

/**
 * Starts a background Kafka consumer reading the topics from their beginning, and returns a
 * function stopping it. Each message is passed to `onMessage`: the caller owns the buffer.
 */
async function consumeTopics<T>(
    kafkaHosts: string, topics: string[],
    onMessage: (msg: T) => void,
): Promise<() => Promise<void>> {
    const consumer = new Consumer({
        clientId: `zenko-e2e-${randomString()}`,
        groupId: `zenko-e2e-${randomString()}`,
        bootstrapBrokers: [kafkaHosts],
        deserializers: stringDeserializers,
    });
    const stream = await consumer.consume({ topics, mode: 'earliest' });
    void (async () => {
        try {
            for await (const msg of stream) {
                try { onMessage(JSON.parse(msg.value) as T); } catch { /* ignore malformed messages */ }
            }
        } catch { /* consumer disconnected — stop silently */ }
    })();
    return async () => {
        await stream.close().catch(() => {});
        await consumer.close().catch(() => {});
    };
}

let dlqConsumerCleanup: (() => Promise<void>) | undefined;

/**
 * Starts a long-lived background Kafka consumer on the dead letter topics of all the cold
 * locations. Each arriving DLQ message is passed to `onMessage` — the caller owns the buffer.
 * Call once from BeforeAll.
 */
export async function startDLQConsumer(
    kafkaHosts: string, instanceId: string,
    onMessage: (msg: DLQMessage) => void,
): Promise<void> {
    const prefix = coldTopicName(instanceId, coldDeadLetterTopicPrefix, '');
    const topics = await listTopics(kafkaHosts, topic => topic.startsWith(prefix));
    if (topics.length === 0) {
        return;
    }
    dlqConsumerCleanup = await consumeTopics(kafkaHosts, topics, onMessage);
}

export interface TopicRecorder<T> {
    messages: T[];
    stop: () => Promise<void>;
}

/**
 * Buffers all the messages of a topic, for a scenario to check what was published while it
 * ran. The recorder is not shared: each scenario starts its own and stops it when done.
 */
export async function startTopicRecorder<T>(kafkaHosts: string, topic: string): Promise<TopicRecorder<T>> {
    const messages: T[] = [];
    const stop = await consumeTopics<T>(kafkaHosts, [topic], msg => messages.push(msg));
    return { messages, stop };
}

/** Stops the background DLQ consumer. Call from AfterAll. */
export async function stopDLQConsumer(): Promise<void> {
    await dlqConsumerCleanup?.();
}

/**
 * Synchronous, non-blocking check of a DLQ buffer.
 * Returns the first unseen message matching (op, objectName, bucketName),
 * or undefined if none has arrived yet. The caller is responsible for
 * sleeping and retrying if needed.
 *
 * seenMessages prevents the same Kafka message being matched twice across
 * retries — e.g. a failed-restore DLQ entry must not re-trigger a later
 * "wait for successful restore" check on the same object.
 */
export function pollDLQBuffer(
    buffer: Map<string, DLQMessage[]>,
    op: string, objectName: string, bucketName: string,
    seenMessages: Set<string>,
): DLQMessage | undefined {
    return buffer.get(dlqKey(op, bucketName, objectName))
        ?.find(m => !seenMessages.has(m.requestId));
}

/**
 * Blocks until a matching DLQ message appears or timeoutMs elapses.
 * Used when a test step explicitly expects a failure to land in the DLQ.
 */
export async function waitForDLQMessage(
    buffer: Map<string, DLQMessage[]>,
    op: string, objectName: string, bucketName: string,
    seenMessages: Set<string>, timeoutMs: number,
): Promise<DLQMessage> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const msg = pollDLQBuffer(buffer, op, objectName, bucketName, seenMessages);
        if (msg) {
            seenMessages.add(msg.requestId);
            return msg;
        }
        await sleep(500);
    }
    throw new Error(
        `DLQ: no "${op}" message for object "${objectName}" in bucket "${bucketName}" ` +
        `within ${timeoutMs / 1000}s`,
    );
}
