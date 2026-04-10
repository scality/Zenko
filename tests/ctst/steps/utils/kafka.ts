import { Utils } from 'cli-testing';

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
