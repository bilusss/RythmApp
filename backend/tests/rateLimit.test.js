import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit } from '../src/rateLimit.js';

test('rateLimit lets max requests through per key, then answers 429', () => {
  const limit = rateLimit({ windowMs: 60000, max: 2 });
  const run = (ip) => {
    let status = 200;
    let passed = false;
    const res = { set() {}, status: (s) => ((status = s), { json() {} }) };
    limit({ ip }, res, () => (passed = true));
    return passed ? 200 : status;
  };
  assert.deepEqual([run('a'), run('a'), run('a'), run('b')], [200, 200, 429, 200]);
});
