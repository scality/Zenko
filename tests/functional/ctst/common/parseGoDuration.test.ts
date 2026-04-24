import assert from 'assert';
import { parseGoDuration } from './utils';

const cases: [string, number][] = [
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

for (const [input, expected] of cases) {
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

