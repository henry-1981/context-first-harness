import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, copyFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStateManager } from '../state-manager.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_S1 = join(__dirname, 'fixtures', 'scenario-1-greenfield.state.json');

let workdir;

test.beforeEach(async () => {
  workdir = await mkdtemp(join(tmpdir(), 'stage-reentry-'));
});

test.afterEach(async () => {
  await rm(workdir, { recursive: true, force: true });
});

test('A pain re-entry: plan stage owner write does not touch design sub-object', async () => {
  await copyFile(FIXTURE_S1, join(workdir, 'state.json'));
  const sm = createStateManager(workdir, 'e2e-greenfield-20260421');
  const before = await sm.read();
  assert.equal(before.design.status, 'passed');
  assert.ok(before.design.slides.length === 7);

  // A pain: plan.outline 갱신 (사용자가 슬라이드 추가)
  // writeStage('plan', partial) merges partial keys into state.plan directly
  await sm.writeStage('plan', {
    status: 'passed',
    outline: { ...before.plan.outline, slide_count_actual: 8 }
  });

  const after = await sm.read();
  // plan.outline 갱신 확인
  assert.equal(after.plan.outline.slide_count_actual, 8);
  // design 영역 불변 확인
  assert.equal(after.design.status, 'passed');
  assert.equal(after.design.slides.length, 7);
});

test('B pain re-entry: design stage owner write does not touch plan/export', async () => {
  await copyFile(FIXTURE_S1, join(workdir, 'state.json'));
  const sm = createStateManager(workdir, 'e2e-greenfield-20260421');
  const before = await sm.read();

  // B pain: design.editor_history 갱신
  await sm.writeStage('design', {
    status: 'passed',
    editor_history: [{ ts: new Date().toISOString(), slide: 4, engine: 'manual', intent: 'test', diff_bytes: 10 }]
  });

  const after = await sm.read();
  // design 갱신 확인
  assert.equal(after.design.editor_history.length, 1);
  // plan·export 불변 확인
  assert.equal(after.plan.outline.slide_count_actual, 7);
  assert.equal(after.export.formats[0], 'webppt');
});

test('C pain re-entry: export stage owner write does not touch plan/design', async () => {
  await copyFile(FIXTURE_S1, join(workdir, 'state.json'));
  const sm = createStateManager(workdir, 'e2e-greenfield-20260421');
  const before = await sm.read();

  // C pain: export.formats에 pptx 추가
  await sm.writeStage('export', {
    formats: [...before.export.formats, 'pptx'],
    files: { ...before.export.files, pptx: 'export/deck.pptx' }
  });

  const after = await sm.read();
  assert.deepEqual(after.export.formats, ['webppt', 'pdf', 'pptx']);
  assert.ok(after.export.files.pptx);
  // plan·design 불변
  assert.equal(after.plan.outline.slide_count_actual, 7);
  assert.equal(after.design.status, 'passed');
});

test('cross-stage write reject: plan stage cannot write design sub-object', async () => {
  await copyFile(FIXTURE_S1, join(workdir, 'state.json'));
  const sm = createStateManager(workdir, 'e2e-greenfield-20260421');

  // plan stage가 design 키를 쓰려고 시도 → reject
  await assert.rejects(
    sm.writeStage('plan', { design: { status: 'failed' } }),
    /key 'design' not owned by stage 'plan'/
  );
});

test('history append from any stage works (spec §3.4 history 공통 append)', async () => {
  await copyFile(FIXTURE_S1, join(workdir, 'state.json'));
  const sm = createStateManager(workdir, 'e2e-greenfield-20260421');
  const before = await sm.read();
  const beforeHistoryLen = before.history.length;

  await sm.appendHistory({ event: 'editor_save', slide: 4, engine: 'manual' });
  await sm.appendHistory({ event: 'partial_regen', slide: 5 });

  const after = await sm.read();
  assert.equal(after.history.length, beforeHistoryLen + 2);
  assert.equal(after.history[after.history.length - 2].event, 'editor_save');
  assert.equal(after.history[after.history.length - 1].event, 'partial_regen');
});

test('design/export skills document auto checkpoint milestones', async () => {
  const designSkill = await readFile(join(__dirname, '..', '..', 'skills', 'presentation', 'design', 'SKILL.md'), 'utf8');
  const exportSkill = await readFile(join(__dirname, '..', '..', 'skills', 'presentation', 'export', 'SKILL.md'), 'utf8');

  assert.match(designSkill, /auto-post-deck-verifier-pass/);
  assert.match(exportSkill, /auto-pre-export/);
});
