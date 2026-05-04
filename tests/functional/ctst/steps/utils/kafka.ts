import { Utils } from 'cli-testing';
import { Consumer, stringDeserializers } from '@platformatic/kafka';

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
}

export function dlqKey(op: string, bucketName: string, objectKey: string): string {
    return `${op}:${bucketName}:${objectKey}`;
}

let dlqConsumerCleanup: (() => Promise<void>) | undefined;

/**
 * Starts a long-lived background Kafka consumer. Each arriving DLQ message is
 * passed to `onMessage` — the caller owns the buffer. Call once from BeforeAll.
 */
export async function startDLQConsumer(
    kafkaHosts: string, topic: string,
    onMessage: (msg: DLQMessage) => void,
): Promise<void> {
    const consumer = new Consumer({
        clientId: `zenko-e2e-dlq-${Utils.randomString()}`,
        groupId: `zenko-e2e-dlq-${Utils.randomString()}`,
        bootstrapBrokers: [kafkaHosts],
        deserializers: stringDeserializers,
    });
    const stream = await consumer.consume({ topics: [topic], mode: 'earliest' });
    void (async () => {
        try {
            for await (const msg of stream) {
                try { onMessage(JSON.parse(msg.value) as DLQMessage); } catch { /* ignore malformed messages */ }
            }
        } catch { /* consumer disconnected — stop silently */ }
    })();
    dlqConsumerCleanup = async () => {
        await stream.close().catch(() => {});
        await consumer.close().catch(() => {});
    };
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
        await Utils.sleep(500);
    }
    throw new Error(
        `DLQ: no "${op}" message for object "${objectName}" in bucket "${bucketName}" ` +
        `within ${timeoutMs / 1000}s`,
    );
}

interface ConnectorInfo {
    info: {
        name: string;
        config: {
            pipeline?: string;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
}


/**
 * Polls the Kafka Connect REST API until the given bucket appears in
 * at least one connector's MongoDB change-stream pipeline (`$match` →
 * `ns.coll.$in`).  This ensures the oplog-populator has propagated a
 * new `putBucketNotificationConfiguration` to the connector before the
 * test proceeds to trigger events.
 */ 
export async function waitForBucketInConnectorPipeline(
    kafkaConnectUrl: string,
    bucketName: string,
    timeoutMs = 120000,
    intervalMs = 1000,
): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    let lastConnectorCount = 0;
    while (Date.now() < deadline) {
        try {
            const response = await fetch(`${kafkaConnectUrl}?expand=info`, {
                signal: AbortSignal.timeout(5000),
            });
            const connectors = await response.json() as Record<string, ConnectorInfo>;
            lastConnectorCount = Object.keys(connectors).length;

            for (const connector of Object.values(connectors)) {
                const pipelineStr = connector.info?.config?.pipeline;
                if (!pipelineStr) {
                    continue;
                }
                try {
                    const pipeline = JSON.parse(pipelineStr) as Array<Record<string, unknown>>;
                    const matchStage = pipeline[0]?.$match as Record<string, unknown> | undefined;
                    const nsColl = matchStage?.['ns.coll'] as Record<string, unknown> | undefined;
                    const bucketList = nsColl?.$in as string[] | undefined;
                    if (bucketList?.includes(bucketName)) {
                        return;
                    }
                } catch {
                    // pipeline not valid JSON, skip
                }
            }
        } catch {
            // Kafka Connect not reachable, retry
        }
        await Utils.sleep(intervalMs);
    }
    throw new Error(
        `waitForBucketInConnectorPipeline timed out after ${timeoutMs}ms waiting for bucket ` +
        `"${bucketName}" in connector pipelines (${lastConnectorCount} connectors checked)`,
    );
}
