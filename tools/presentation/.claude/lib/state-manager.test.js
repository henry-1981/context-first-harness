// presentation/.claude/lib/state-manager.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStateManager } from './state-manager.js';

let workdir;

test.beforeEach(async () => {
  workdir = await mkdtemp(join(tmpdir(), 'state-mgr-'));
});

test.afterEach(async () => {
  await rm(workdir, { recursive: true, force: true });
});

test('initial() creates valid state.json with required fields', async () => {
  const sm = createStateManager(workdir, 'test-project');
  await sm.initial({ sourceType: 'file', classification: 'prepared', sourcePath: '/foo.md' });
  const raw = await readFile(join(workdir, 'state.json'), 'utf8');
  const state = JSON.parse(raw);
  assert.equal(state.project, 'test-project');
  assert.equal(state.spec_version, 'presentation-refactor-v1');
  assert.equal(state.source.classification, 'prepared');
  assert.equal(state.plan.status, 'ready');
  assert.deepEqual(state.history, []);
});

test('writeStage() merges plan sub-object without touching design', async () => {
  const sm = createStateManager(workdir, 'test-project');
  await sm.initial({ sourceType: 'file', classification: 'prepared' });
  await sm.writeStage('plan', { status: 'passed', outline: { slide_count_declared: 7, slide_count_actual: 7, slides: [] } });
  const state = await sm.read();
  assert.equal(state.plan.status, 'passed');
  assert.equal(state.plan.outline.slide_count_declared, 7);
  assert.equal(state.design.status, 'ready'); // untouched
});

test('appendHistory() is atomic and preserves existing events', async () => {
  const sm = createStateManager(workdir, 'test-project');
  await sm.initial({ sourceType: 'file', classification: 'prepared' });
  await sm.appendHistory({ event: 'plan_started' });
  await sm.appendHistory({ event: 'outline_verifier_pass' });
  const state = await sm.read();
  assert.equal(state.history.length, 2);
  assert.equal(state.history[0].event, 'plan_started');
  assert.equal(state.history[1].event, 'outline_verifier_pass');
  assert.ok(state.history[0].ts);
});

test('writeStage() rejects non-owned keys', async () => {
  const sm = createStateManager(workdir, 'test-project');
  await sm.initial({ sourceType: 'file', classification: 'prepared' });
  await assert.rejects(
    sm.writeStage('plan', { design: { status: 'passed' } }),
    /key 'design' not owned by stage 'plan'/
  );
});
