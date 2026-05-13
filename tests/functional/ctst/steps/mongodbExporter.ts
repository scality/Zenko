import { Then } from '@cucumber/cucumber';
import { Utils } from 'cli-testing';
import { PrometheusDriver } from 'prometheus-query';
import assert from 'assert';
import Zenko from 'world/Zenko';

const TIMEOUT_MS = 180_000;
const POLL_MS = 1_000;

// Negative-assertion stability window: we re-check across at least one
// Prometheus scrape interval so a not-yet-scraped metric does not pass the
// test trivially. Default scrape interval is 30s; 4 checks at 10s = 30s span.
const STABILITY_CHECKS = 4;
const STABILITY_INTERVAL_MS = 10_000;

function makeProm(world: Zenko): PrometheusDriver {
    return new PrometheusDriver({
        endpoint: world.parameters.PrometheusEndpoint,
        baseURL: '/api/v1',
    });
}

Then(
    'prometheus should expose mongodb metric {string}',
    { timeout: TIMEOUT_MS },
    async function (this: Zenko, metric: string) {
        const prom = makeProm(this);
        const deadline = Date.now() + TIMEOUT_MS - POLL_MS;
        for (;;) {
            const res = await prom.instantQuery(metric);
            if (res.result.length > 0) {
                return;
            }
            if (Date.now() > deadline) {
                assert.fail(
                    `Metric ${metric} never appeared (no series in /api/v1/query)`,
                );
            }
            await Utils.sleep(POLL_MS);
        }
    },
);

Then(
    'prometheus should not expose mongodb metric {string}',
    { timeout: TIMEOUT_MS },
    async function (this: Zenko, metric: string) {
        const prom = makeProm(this);
        for (let i = 0; i < STABILITY_CHECKS; i++) {
            const res = await prom.instantQuery(metric);
            assert.strictEqual(
                res.result.length,
                0,
                `Expected ${metric} to be absent, got ${res.result.length} series`,
            );
            if (i < STABILITY_CHECKS - 1) {
                await Utils.sleep(STABILITY_INTERVAL_MS);
            }
        }
    },
);
