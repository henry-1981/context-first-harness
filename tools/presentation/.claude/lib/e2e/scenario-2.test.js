import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateStateAgainstSchema, assertHistorySequence, extractHistoryEvents } from './state-checker.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, 'fixtures', 'scenario-2-rework.state.json');

test('scenario-2 fixture validates against schema', async () => {
  const state = JSON.parse(await readFile(FIXTURE, 'utf8'));
  const result = await validateStateAgainstSchema(state);
  assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));
});

test('scenario-2 history contains scenario-1 sequence + A/B/C re-entry events', async () => {
  const state = JSON.parse(await readFile(FIXTURE, 'utf8'));
  // 시나리오 1 base sequence
  assert.doesNotThrow(() => assertHistorySequence(state, [
    'plan_started',
    'outline_verifier_pass',
    'sample_verifier_pass',
    'plan_passed',
    'full_deck_generated',
    'deck_verifier_pass',
    'design_passed',
    'export_formats_selected',
    'export_files_written',
    'export_verifier_pass'
  ]));
  // A pain 추가 (outline_verifier_pass 2번째)
  const events = extractHistoryEvents(state);
  const olpCount = events.filter(e => e === 'outline_verifier_pass').length;
  assert.equal(olpCount, 2, `outline_verifier_pass count should be 2 (initial + A pain), got ${olpCount}`);
  // B pain 추가 (editor_save 2개 + design_passed 2번째)
  const editorSaveCount = events.filter(e => e === 'editor_save').length;
  assert.equal(editorSaveCount, 2);
  const designPassedCount = events.filter(e => e === 'design_passed').length;
  assert.equal(designPassedCount, 2);
  // C pain 추가 (export 3종 이벤트 2번째)
  const exportSelectedCount = events.filter(e => e === 'export_formats_selected').length;
  assert.equal(exportSelectedCount, 2);
});

test('scenario-2 full 17-event subsequence in expected order (A→B→C re-entry)', async () => {
  const state = JSON.parse(await readFile(FIXTURE, 'utf8'));
  assert.doesNotThrow(() => assertHistorySequence(state, [
    'plan_started',
    'outline_verifier_pass',
    'sample_verifier_pass',
    'plan_passed',
    'full_deck_generated',
    'deck_verifier_pass',
    'design_passed',
    'export_formats_selected',
    'export_files_written',
    'export_verifier_pass',
    'outline_verifier_pass',     // A pain 재진입
    'editor_save',                // B pain manual save
    'editor_save',                // B pain codex AI save
    'design_passed',              // B pain 종료 후 status 갱신
    'export_formats_selected',    // C pain 포맷 재선택
    'export_files_written',       // C pain 변환
    'export_verifier_pass'        // C pain 재검증
  ]));
});

test('scenario-2 design.editor_history has 2 entries (manual + codex)', async () => {
  const state = JSON.parse(await readFile(FIXTURE, 'utf8'));
  assert.equal(state.design.editor_history.length, 2);
  assert.equal(state.design.editor_history[0].engine, 'manual');
  assert.equal(state.design.editor_history[1].engine, 'codex');
  assert.equal(state.design.editor_history[0].slide, 4);
  assert.equal(state.design.editor_history[1].slide, 4);
});

test('scenario-2 export.formats includes pptx (C pain 추가)', async () => {
  const state = JSON.parse(await readFile(FIXTURE, 'utf8'));
  assert.deepEqual(state.export.formats, ['webppt', 'pdf', 'pptx']);
  assert.ok(state.export.files.pptx);
});

test('scenario-2 plan.outline reflects HB 추가 (8장, slides[5] HB 추가)', async () => {
  const state = JSON.parse(await readFile(FIXTURE, 'utf8'));
  assert.equal(state.plan.outline.slide_count_declared, 8);
  assert.equal(state.plan.outline.slide_count_actual, 8);
  assert.equal(state.plan.outline.slides.length, 8);
  // slides[5]는 0-indexed로 6번째 슬라이드 = "리스크 분석" (HB 추가)
  assert.equal(state.plan.outline.slides[5].title, '리스크 분석');
});
