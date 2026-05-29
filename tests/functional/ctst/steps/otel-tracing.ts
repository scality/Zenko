import { Then, When } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';
import { Utils } from 'cli-testing';
import Zenko from 'world/Zenko';

const JAEGER_POLL_TIMEOUT = 30000;
const JAEGER_POLL_INTERVAL = 2000;
const TRACED_OBJECT_KEY = 'otel-trace-test-object';

interface JaegerTrace {
    traceID: string;
    spans: { processID: string }[];
    processes: Record<string, { serviceName: string }>;
}

function generateTraceContext(): { traceparent: string; traceId: string } {
    const traceId = randomBytes(16).toString('hex');
    const spanId = randomBytes(8).toString('hex');
    return { traceparent: `00-${traceId}-${spanId}-01`, traceId };
}

function injectTraceparent(client: S3Client, traceparent: string): void {
    // traceparent is not part of any SigV4 signed-header set, so injecting at
    // the 'build' step (pre-signing) does not invalidate the signature.
    client.middlewareStack.add(
        next => async args => {
            const request = args.request as { headers: Record<string, string> };
            request.headers.traceparent = traceparent;
            return next(args);
        },
        { step: 'build', name: 'injectTraceparent' },
    );
}

async function fetchTraceById(endpoint: string, traceId: string): Promise<JaegerTrace | null> {
    const response = await fetch(`${endpoint}/api/traces/${traceId}`, {
        signal: AbortSignal.timeout(5000),
    });
    if (response.status === 404) {
        return null;
    }
    if (!response.ok) {
        throw new Error(`Jaeger query returned HTTP ${response.status}`);
    }
    const body = await response.json() as { data: JaegerTrace[] };
    return body.data?.[0] ?? null;
}

async function pollJaegerForTrace(
    endpoint: string,
    traceId: string,
    timeoutMs = JAEGER_POLL_TIMEOUT,
    intervalMs = JAEGER_POLL_INTERVAL,
): Promise<JaegerTrace> {
    const deadline = Date.now() + timeoutMs;
    let lastError: Error | null = null;

    while (Date.now() < deadline) {
        try {
            const trace = await fetchTraceById(endpoint, traceId);
            if (trace) {
                return trace;
            }
        } catch (err) {
            lastError = err as Error;
        }
        await Utils.sleep(intervalMs);
    }

    throw new Error(
        `pollJaegerForTrace timed out after ${timeoutMs}ms waiting for trace ${traceId}` +
        `${lastError ? `: ${lastError.message}` : ''}`,
    );
}

function traceHasSpansFromService(trace: JaegerTrace, serviceName: string): boolean {
    const processIds = Object.entries(trace.processes)
        .filter(([, proc]) => proc.serviceName === serviceName)
        .map(([id]) => id);

    return trace.spans.some(span => processIds.includes(span.processID));
}

When('I put an object with an injected traceparent',
    async function (this: Zenko) {
        const bucketName = this.getSaved<string>('bucketName');
        assert.ok(bucketName, 'No bucketName saved from a previous step');

        const { traceparent, traceId } = generateTraceContext();
        const client = this.createS3Client();
        injectTraceparent(client, traceparent);
        await client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: TRACED_OBJECT_KEY,
            Body: 'otel-trace-payload',
        }));

        this.addToSaved('jaegerTraceId', traceId);
    },
);

Then('the injected trace should be found in Jaeger',
    { timeout: JAEGER_POLL_TIMEOUT + 10000 },
    async function (this: Zenko) {
        const endpoint = this.parameters.JaegerQueryEndpoint;
        assert.ok(endpoint, 'JaegerQueryEndpoint missing from world parameters');
        const traceId = this.getSaved<string>('jaegerTraceId');
        assert.ok(traceId, 'No jaegerTraceId saved from a previous step');

        const trace = await pollJaegerForTrace(endpoint, traceId);
        this.addToSaved('jaegerTrace', trace);
    },
);

Then('the trace should contain spans from service {string}',
    async function (this: Zenko, service: string) {
        const trace = this.getSaved<JaegerTrace>('jaegerTrace');
        assert.ok(trace, 'No trace saved from the previous step');

        assert.ok(
            traceHasSpansFromService(trace, service),
            `Trace ${trace.traceID} does not contain spans from service "${service}". ` +
            `Services in trace: ${[...new Set(
                Object.values(trace.processes).map(p => p.serviceName),
            )].join(', ')}`,
        );
    },
);
