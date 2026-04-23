import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateStateAgainstSchema, assertHistorySequence, extractHistoryEvents } from './state-checker.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, 'fixtures', 'scenario-3-partial.state.json');

test('scenario-3 fixture validates against schema', async () => {
  const state = JSON.parse(await readFile(FIXTURE, 'utf8'));
  const result = await validateStateAgainstSchema(state);
  assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));
});

test('scenario-3 history contains partial_regen event', async () => {
  const state = JSON.parse(await readFile(FIXTURE, 'utf8'));
  const events = extractHistoryEvents(state);
  assert.ok(events.includes('partial_regen'));
  // partial_regen은 마지막 이벤트
  assert.equal(events[events.length - 1], 'partial_regen');
});

test('scenario-3 design_passed appears exactly once (no re-append)', async () => {
  const state = JSON.parse(await readFile(FIXTURE, 'utf8'));
  const events = extractHistoryEvents(state);
  const designPassedCount = events.filter(e => e === 'design_passed').length;
  assert.equal(designPassedCount, 1, 'partial_regen은 design.status 전이 없이 수행되므로 design_passed 재append 금지');
});

test('scenario-3 deck-verifier AQL sample forced to [5]', async () => {
  const state = JSON.parse(await readFile(FIXTURE, 'utf8'));
  assert.deepEqual(state.design.verifiers.deck.aql_sample_slides, [5]);
});

test('scenario-3 slides[4].verifier_status == pass + self_check_pngs has slide-05', async () => {
  const state = JSON.parse(await readFile(FIXTURE, 'utf8'));
  const slide5 = state.design.slides[4]; // 0-indexed
  assert.equal(slide5.n, 5);
  assert.equal(slide5.verifier_status, 'pass');
  assert.ok(slide5.self_check_pngs.some(p => p.includes('slide-05')));
});

test('scenario-3 design.editor_history empty (P7 진입 안 함)', async () => {
  const state = JSON.parse(await readFile(FIXTURE, 'utf8'));
  assert.equal(state.design.editor_history.length, 0);
});

test('scenario-3 design.status == passed (전이 없이 유지)', async () => {
  const state = JSON.parse(await readFile(FIXTURE, 'utf8'));
  assert.equal(state.design.status, 'passed');
});
