import { test } from 'node:test';
import assert from 'node:assert/strict';
import { awakeHours, slots, windowEnd } from '../src/scheduler.js';

test('awakeHours: normal day', () => {
  assert.equal(awakeHours('07:00', '23:00'), 16);
});

test('awakeHours: going to bed after midnight', () => {
  assert.equal(awakeHours('10:00', '02:00'), 16);
  assert.equal(awakeHours('04:25:00', '02:25:00'), 22);
});

test('windowEnd rolls over to the next day', () => {
  assert.equal(windowEnd(600, 120), 120 + 1440);
  assert.equal(windowEnd(420, 1380), 1380);
});

test('slots stay inside the window when sleep is after midnight', () => {
  const start = 10 * 60;
  const end = windowEnd(start, 2 * 60);
  const result = slots(5, start, end, () => 0.5);
  assert.equal(result.length, 5);
  assert.ok(result.every((m) => m >= start && m <= end));
  assert.deepEqual([...result].sort((a, b) => a - b), result);
});
