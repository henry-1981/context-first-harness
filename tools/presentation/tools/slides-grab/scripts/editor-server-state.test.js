// editor_save event append 테스트 — /api/slides/:file/save 호출 시
// state.json design.editor_history[]에 새 entry가 append되는지 확인.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './editor-server.js';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TEST_ROOT = join(tmpdir(), `slides-grab-state-${Date.now()}`);
const SLIDES_DIR = join(TEST_ROOT, 'output');
const STATE_PATH = join(TEST_ROOT, 'proj.state.json');

before(() => {
  mkdirSync(SLIDES_DIR, { recursive: true });
  writeFileSync(join(SLIDES_DIR, 'slide-03.html'), '<html><body><h1>x</h1></body></html>', 'utf8');
  writeFileSync(STATE_PATH, JSON.stringify({
    project: 'proj',
    created: new Date().toISOString(),
    spec_version: 'presentation-refactor-v1',
    design: { status: 'ready', slides: [], editor_history: [] },
    history: [],
  }, null, 2), 'utf8');
});
after(() => { rmSync(TEST_ROOT, { recursive: true, force: true }); });

async function post(app, path, body) {
  const server = app.listen(0);
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  server.close();
  return { status: res.status, json };
}

test('manual save appends editor_save event with engine=manual', async () => {
  process.env.PPT_STATE_PATH = STATE_PATH;
  const app = await createApp({ slidesDir: SLIDES_DIR });
  const { status } = await post(app, '/api/slides/slide-03.html/save', {
    html: '<html><body><h1>edited</h1></body></html>',
  });
  assert.equal(status, 200);

  const state = JSON.parse(readFileSync(STATE_PATH, 'utf8'));
  assert.equal(state.design.editor_history.length, 1);
  const ev = state.design.editor_history[0];
  assert.equal(ev.event, 'editor_save');
  assert.equal(ev.engine, 'manual');
  assert.equal(ev.slide, 3);
  assert.equal(typeof ev.diff_bytes, 'number');
  assert.ok(ev.ts);
  delete process.env.PPT_STATE_PATH;
});

test('PPT_STATE_PATH unset → save still 200, no state.json side effect', async () => {
  delete process.env.PPT_STATE_PATH;
  const app = await createApp({ slidesDir: SLIDES_DIR });
  const { status } = await post(app, '/api/slides/slide-03.html/save', {
    html: '<html><body><h1>another</h1></body></html>',
  });
  assert.equal(status, 200);
  // state.json은 이전 테스트의 1건만 유지 (append 없음)
  const state = JSON.parse(readFileSync(STATE_PATH, 'utf8'));
  assert.equal(state.design.editor_history.length, 1);
});

test('/api/edit/ai STUB mode appends editor_save event with engine=codex', async () => {
  process.env.PPT_STATE_PATH = STATE_PATH;
  process.env.PPT_EDIT_ENGINE_STUB = '1';
  const app = await createApp({ slidesDir: SLIDES_DIR });
  const { status } = await post(app, '/api/edit/ai', {
    file: 'slide-03.html',
    intent: '단순화',
    engine: 'codex',
  });
  assert.equal(status, 200);

  const state = JSON.parse(readFileSync(STATE_PATH, 'utf8'));
  assert.equal(state.design.editor_history.length, 2);
  const ev = state.design.editor_history[1];
  assert.equal(ev.engine, 'codex');
  assert.equal(ev.intent, '단순화');
  delete process.env.PPT_STATE_PATH;
  delete process.env.PPT_EDIT_ENGINE_STUB;
});
