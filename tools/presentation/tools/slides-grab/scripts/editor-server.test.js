// editor-server /api/edit/ai Layer 2 endpoint — HTTP integration test
// Node 20 built-in test runner. 실 codex spawn은 stub으로 치환.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './editor-server.js';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SLIDES_DIR = join(tmpdir(), `slides-grab-test-${Date.now()}`);

before(() => {
  mkdirSync(SLIDES_DIR, { recursive: true });
  writeFileSync(join(SLIDES_DIR, 'slide-01.html'),
    '<html><body><h1 id="t">Original</h1></body></html>', 'utf8');
});

after(() => { rmSync(SLIDES_DIR, { recursive: true, force: true }); });

async function postJson(app, path, body) {
  const server = app.listen(0);
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  server.close();
  return { status: res.status, json };
}

test('POST /api/edit/ai returns 200 with engine=codex stub', async () => {
  process.env.PPT_EDIT_ENGINE_STUB = '1';
  const app = await createApp({ slidesDir: SLIDES_DIR });
  const { status, json } = await postJson(app, '/api/edit/ai', {
    file: 'slide-01.html',
    xpath: '/html/body/h1',
    intent: '제목을 더 짧게',
    engine: 'codex',
  });
  assert.equal(status, 200);
  assert.equal(json.success, true);
  assert.equal(json.engine, 'codex');
  assert.ok(typeof json.diff_bytes === 'number');
  delete process.env.PPT_EDIT_ENGINE_STUB;
});

test('POST /api/edit/ai returns 400 on missing intent', async () => {
  const app = await createApp({ slidesDir: SLIDES_DIR });
  const { status, json } = await postJson(app, '/api/edit/ai', {
    file: 'slide-01.html',
  });
  assert.equal(status, 400);
  assert.match(json.error || '', /intent/i);
});

test('POST /api/edit/ai returns 404 on unknown slide', async () => {
  process.env.PPT_EDIT_ENGINE_STUB = '1';
  const app = await createApp({ slidesDir: SLIDES_DIR });
  const { status, json } = await postJson(app, '/api/edit/ai', {
    file: 'slide-99.html',
    intent: 'foo',
  });
  assert.equal(status, 404);
  delete process.env.PPT_EDIT_ENGINE_STUB;
});
