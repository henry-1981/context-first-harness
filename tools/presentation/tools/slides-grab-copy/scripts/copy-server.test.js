import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createCopyApp } from './copy-server.js';

const TEST_ROOT = join(tmpdir(), `slides-grab-copy-${Date.now()}`);
const SLIDES_DIR = join(TEST_ROOT, 'slides');
const TEMPLATE_DIR = join(TEST_ROOT, 'templates');

mkdirSync(SLIDES_DIR, { recursive: true });
writeFileSync(join(SLIDES_DIR, 'slide-01.html'), '<html><body><h1>copy</h1></body></html>', 'utf8');

test.after(() => {
  delete process.env.PPT_TEMPLATE_BASE_DIR;
  rmSync(TEST_ROOT, { recursive: true, force: true });
});

async function withServer(app, fn) {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    await fn(port);
  } finally {
    server.close();
  }
}

test('copy editor root renders metadata form shell', async () => {
  const { app } = await createCopyApp({ slidesDir: SLIDES_DIR });
  await withServer(app, async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/`);
    const text = await res.text();
    assert.equal(res.status, 200);
    assert.match(text, /템플릿 저장/);
    assert.match(text, /save-mode-existing/);
    assert.match(text, /existing-template-name/);
    assert.match(text, /new-template-name/);
    assert.match(text, /layout-name/);
    assert.match(text, /value="본문"/);
    assert.match(text, /checkpoint-name/);
    assert.match(text, /create-checkpoint/);
    assert.match(text, /restore-checkpoint/);
  });
});

test('copy app creates isolated session root', async () => {
  const { sessionRoot } = await createCopyApp({ slidesDir: SLIDES_DIR });
  assert.match(sessionRoot, /_workspace-copy\/session-/);
});

test('GET /api/session returns session metadata', async () => {
  const { app } = await createCopyApp({ slidesDir: SLIDES_DIR });
  await withServer(app, async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/session`);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.match(json.sessionId, /^session-/);
  });
});

test('GET /api/templates returns template list with layouts', async () => {
  process.env.PPT_TEMPLATE_BASE_DIR = TEMPLATE_DIR;
  mkdirSync(join(TEMPLATE_DIR, 'templates-slide-warm'), { recursive: true });
  writeFileSync(join(TEMPLATE_DIR, 'templates-slide-warm', 'cover.html'), '<html></html>', 'utf8');
  const { app } = await createCopyApp({ slidesDir: SLIDES_DIR });
  await withServer(app, async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/templates`);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.templates[0].templateName, 'warm');
    assert.deepEqual(json.templates[0].layouts, ['cover']);
  });
});

test('GET /api/checkpoints returns newest-first checkpoint list', async () => {
  const { app } = await createCopyApp({ slidesDir: SLIDES_DIR });
  await withServer(app, async (port) => {
    await fetch(`http://127.0.0.1:${port}/api/checkpoints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'baseline' }),
    });

    const res = await fetch(`http://127.0.0.1:${port}/api/checkpoints`);
    const json = await res.json();

    assert.equal(res.status, 200);
    assert.equal(Array.isArray(json.checkpoints), true);
    assert.equal(json.checkpoints.length, 1);
    assert.match(json.checkpoints[0].name, /baseline$/);
  });
});

test('POST /api/checkpoints/restore restores draft slide content', async () => {
  const { app } = await createCopyApp({ slidesDir: SLIDES_DIR });
  await withServer(app, async (port) => {
    const createRes = await fetch(`http://127.0.0.1:${port}/api/checkpoints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'baseline' }),
    });
    const created = await createRes.json();

    const saveRes = await fetch(`http://127.0.0.1:${port}/api/slides/slide-01.html/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slide: 'slide-01.html',
        html: '<html><body><h1>changed</h1></body></html>',
      }),
    });
    assert.equal(saveRes.status, 200);

    const restoreRes = await fetch(`http://127.0.0.1:${port}/api/checkpoints/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkpointName: created.checkpoint.name }),
    });
    const restored = await restoreRes.json();
    assert.equal(restoreRes.status, 200);
    assert.equal(restored.success, true);

    const slideRes = await fetch(`http://127.0.0.1:${port}/slides/slide-01.html`);
    const html = await slideRes.text();
    assert.match(html, /<h1>copy<\/h1>/);
  });
});

test('POST /api/template/save writes template into base-templates', async () => {
  process.env.PPT_TEMPLATE_BASE_DIR = TEMPLATE_DIR;
  mkdirSync(join(TEMPLATE_DIR, 'templates-slide-warm'), { recursive: true });
  const { app } = await createCopyApp({ slidesDir: SLIDES_DIR });
  await withServer(app, async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/template/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        saveMode: 'existing',
        templateName: 'warm',
        layoutName: 'copy-server-test',
        html: '<html><body>copy template</body></html>',
      }),
    });
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert.match(json.target, /templates-slide-warm\/copy-server-test\.html$/);
  });
});

test('POST /api/template/save rejects duplicate template name in new mode', async () => {
  process.env.PPT_TEMPLATE_BASE_DIR = TEMPLATE_DIR;
  mkdirSync(join(TEMPLATE_DIR, 'templates-slide-warm'), { recursive: true });
  const { app } = await createCopyApp({ slidesDir: SLIDES_DIR });
  await withServer(app, async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/template/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        saveMode: 'new',
        templateName: 'warm',
        layoutName: '새 본문',
        html: '<html><body>copy template</body></html>',
      }),
    });
    const json = await res.json();
    assert.equal(res.status, 409);
    assert.equal(json.code, 'TEMPLATE_EXISTS');
  });
});
