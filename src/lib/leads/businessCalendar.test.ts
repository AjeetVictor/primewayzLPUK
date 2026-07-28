import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addUkBusinessDays,
  calculateOneBusinessDaySlaDueAt,
  isSlaBreached,
  isUkBusinessDay,
} from './businessCalendar';

test('Friday submission SLA skips weekend', () => {
  const friday = new Date('2026-07-24T15:00:00.000Z');
  const due = calculateOneBusinessDaySlaDueAt(friday);
  assert.ok(isUkBusinessDay(due));
  assert.notEqual(due.getUTCDay(), 0);
  assert.notEqual(due.getUTCDay(), 6);
});

test('same-day contact meets SLA', () => {
  const due = new Date('2026-07-28T17:00:00.000Z');
  const contacted = new Date('2026-07-28T10:00:00.000Z');
  assert.equal(isSlaBreached(due, contacted, new Date('2026-07-28T18:00:00.000Z')), false);
});

test('late contact after due breaches SLA', () => {
  const due = new Date('2026-07-27T17:00:00.000Z');
  const contacted = new Date('2026-07-28T10:00:00.000Z');
  assert.equal(isSlaBreached(due, contacted, new Date('2026-07-28T18:00:00.000Z')), true);
});

test('addUkBusinessDays advances over weekend', () => {
  const friday = new Date('2026-07-24T12:00:00.000Z');
  const result = addUkBusinessDays(friday, 1);
  assert.ok(result.getTime() > friday.getTime());
});
