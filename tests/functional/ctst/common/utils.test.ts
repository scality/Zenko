import assert from 'assert';
import { paramToCli, parseGoDuration } from './utils';

const durations: [string, number][] = [
    ['1m', 60],
    ['2h', 7200],
    ['30s', 30],
    ['2h45m', 9900],
    ['500ms', 0.5],
    ['1.5s', 1.5],
    ['1h30m10s', 5410],
    ['100ns', 1e-7],
    ['10us', 1e-5],
    ['10µs', 1e-5],
    ['0s', 0],
];

for (const [input, expected] of durations) {
    const result = parseGoDuration(input);
    assert.strictEqual(
        Math.abs(result - expected) < 1e-12, true,
        `parseGoDuration("${input}") = ${result}, expected ${expected}`,
    );
}

const invalid = ['', 'abc', '1x', '5h 3m', '1', 'm', ' 1m'];
for (const input of invalid) {
    assert.throws(
        () => parseGoDuration(input),
        { message: /Invalid duration/ },
        `parseGoDuration("${input}") should throw`,
    );
}

const cliParams: [Record<string, unknown>, string][] = [
    // pflag boolean flags must use the "=" form: "--flag false" would set the
    // flag to true and drop "false" as a positional argument.
    [{ forceRotateServiceCredentials: false }, '--force-rotate-service-credentials=false'],
    [{ forceRotateServiceCredentials: true }, '--force-rotate-service-credentials=true'],
    [{ wait: true }, '--wait=true'],
    [{ sinkZenkoInstance: 'end2end-pra' }, '--sink-zenko-instance end2end-pra'],
    [{ kafkaExternalPort: 9092 }, '--kafka-external-port 9092'],
    [{ kafkaPersistenceSelector: 'app=kafka-dr-sink' }, '--kafka-persistence-selector app=kafka-dr-sink'],
    [{ mongodbHosts: ['host-a', 'host-b'] }, '--mongodb-hosts host-a,host-b'],
    [{ timeout: undefined }, ''],
    [{ timeout: null }, ''],
    [{}, ''],
    [
        { sinkZenkoInstance: 'end2end-pra', wait: false, timeout: '30m' },
        '--sink-zenko-instance end2end-pra --wait=false --timeout 30m',
    ],
];

for (const [params, expected] of cliParams) {
    const result = paramToCli(params);
    assert.strictEqual(
        result, expected,
        `paramToCli(${JSON.stringify(params)}) = "${result}", expected "${expected}"`,
    );
}
