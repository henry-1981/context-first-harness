import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateStateAgainstSchema, assertHistorySequence, assertNoLegacyWorkspacePaths, extractHistoryEvents } from './state-checker.js';

let workdir;

test.beforeEach(async () => {
  workdir = await mkdtemp(join(tmpdir(), 'e2e-checker-'));
});

test.afterEach(async () => {
  await rm(workdir, { recursive: true, force: true });
});

test('validateStateAgainstSchema: valid greenfield state passes', async () => {
  const state = minimalValidState();
  const result = await validateStateAgainstSchema(state);
  assert.equal(result.valid, true, result.errors?.map(e => e.message).join('; '));
});

test('validateStateAgainstSchema: missing required field fails', async () => {
  const state = minimalValidState();
  delete state.spec_version;
  const result = await validateStateAgainstSchema(state);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => /spec_version/.test(JSON.stringify(e))));
});

test('extractHistoryEvents: returns event names in order', () => {
  const state = minimalValidState();
  state.history = [
    { ts: '2026-04-21T10:00:00+09:00', event: 'plan_started' },
    { ts: '2026-04-21T10:05:00+09:00', event: 'outline_verifier_pass' },
    { ts: '2026-04-21T10:10:00+09:00', event: 'sample_verifier_pass' }
  ];
  const events = extractHistoryEvents(state);
  assert.deepEqual(events, ['plan_started', 'outline_verifier_pass', 'sample_verifier_pass']);
});

test('assertHistorySequence: throws when expected subsequence missing', () => {
  const state = minimalValidState();
  state.history = [
    { ts: '2026-04-21T10:00:00+09:00', event: 'plan_started' },
    { ts: '2026-04-21T10:10:00+09:00', event: 'sample_verifier_pass' }
  ];
  assert.throws(
    () => assertHistorySequence(state, ['plan_started', 'outline_verifier_pass', 'sample_verifier_pass']),
    /missing event 'outline_verifier_pass'/
  );
});

test('assertHistorySequence: passes when subsequence present (extra events allowed)', () => {
  const state = minimalValidState();
  state.history = [
    { ts: '2026-04-21T10:00:00+09:00', event: 'plan_started' },
    { ts: '2026-04-21T10:02:00+09:00', event: 'outline_verifier_fail', retry: 1 },
    { ts: '2026-04-21T10:05:00+09:00', event: 'outline_verifier_pass' },
    { ts: '2026-04-21T10:10:00+09:00', event: 'sample_verifier_pass' }
  ];
  assert.doesNotThrow(
    () => assertHistorySequence(state, ['plan_started', 'outline_verifier_pass', 'sample_verifier_pass'])
  );
});

test('assertNoLegacyWorkspacePaths: throws on legacy paths', () => {
  const state = minimalValidState();
  state.source.path = '_workspace/foo/00_input.md';
  assert.throws(() => assertNoLegacyWorkspacePaths(state), /legacy workspace paths detected/);
});

test('assertNoLegacyWorkspacePaths: passes on new workspace layout', () => {
  const state = minimalValidState();
  state.source.path = 'input/input.md';
  state.plan = {
    status: 'passed',
    outline: {
      slide_count_declared: 1,
      slide_count_actual: 1,
      slides: [{ n: 1, title: 't', source_range: 'input/input.md:1-1', takeaway: 'k', template: 'cover' }],
    },
  };
  state.design = {
    status: 'passed',
    slides: [{ n: 1, html_path: 'draft/slides/slide-01.html', agent: 'template-filler' }],
  };
  state.export = {
    files: { pdf: 'export/deck.pdf' },
  };
  assert.doesNotThrow(() => assertNoLegacyWorkspacePaths(state));
});

function minimalValidState() {
  return {
    project: 'e2e-test',
    created: '2026-04-21T10:00:00+09:00',
    spec_version: 'presentation-refactor-v1',
    source: { type: 'file', classification: 'prepared', path: '/foo.md' },
    config: { mode: 'pptx', mode_variant: 'templateSet' },
    plan: { status: 'ready' },
    design: { status: 'ready' },
    export: {},
    history: []
  };
}
