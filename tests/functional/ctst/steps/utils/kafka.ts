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
    status: {
        name: string;
        connector: { state: string };
        tasks: Array<{ id: number; state: string; worker_id: string }>;
    };
}

/**
 * Polls the Kafka Connect REST API until the given bucket reaches the
 * desired state in the connector pipelines.
 *
 * - 'present': bucket appears in at least one connector's pipeline AND
 *   that connector has a RUNNING task.
 * - 'absent': bucket is gone from all connector pipelines. Note that
 *   connector pipelines only track buckets, not individual events.
 *   This only works when ALL events have been removed for the bucket
 *   (i.e. the QueueConfiguration entry was fully removed), otherwise
 *   the bucket stays in the pipeline regardless of which events remain.
 */
export async function waitForBucketConnectorState(
    kafkaConnectUrl: string,
    bucketName: string,
    expectedState: 'present' | 'absent',
    timeoutMs = 30000,
    intervalMs = 1000,
): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    const needStatus = expectedState === 'present';
    const expand = needStatus ? '?expand=info&expand=status' : '?expand=info';
    let lastConnectorCount = 0;
    let lastTaskState = '';
    while (Date.now() < deadline) {
        try {
            const response = await fetch(`${kafkaConnectUrl}${expand}`, {
                signal: AbortSignal.timeout(5000),
            });
            const connectors = await response.json() as Record<string, ConnectorInfo>;
            lastConnectorCount = Object.keys(connectors).length;
            let found = false;

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
                        found = true;
                        if (needStatus) {
                            const tasks = connector.status?.tasks;
                            const hasRunningTask = tasks?.some(t => t.state === 'RUNNING');
                            lastTaskState = tasks?.map(t => t.state).join(',') || 'no tasks';
                            if (hasRunningTask) {
                                return;
                            }
                        }
                        break;
                    }
                } catch {
                    // pipeline not valid JSON, skip
                }
            }

            if (expectedState === 'absent' && !found) {
                return;
            }
        } catch {
            // Kafka Connect not reachable, retry
        }
        await Utils.sleep(intervalMs);
    }
    const detail = expectedState === 'present'
        ? `(${lastConnectorCount} connectors checked, last task state: ${lastTaskState})`
        : '';
    const msg = `waitForBucketConnectorState timed out after ${timeoutMs}ms waiting for bucket` +
        ` "${bucketName}" to be ${expectedState} in connector pipelines ${detail}`;
    throw new Error(msg.trim());
}
