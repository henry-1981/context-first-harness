import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createCoreApp, listSlideFiles } from './server.js';

const TEST_ROOT = join(tmpdir(), `slides-grab-core-${Date.now()}`);
const SLIDES_DIR = join(TEST_ROOT, 'slides');

mkdirSync(SLIDES_DIR, { recursive: true });
writeFileSync(join(SLIDES_DIR, 'slide-02.html'), '<html><body>two</body></html>', 'utf8');
writeFileSync(join(SLIDES_DIR, 'slide-01.html'), '<html><body>one</body></html>', 'utf8');

test.after(() => {
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

test('listSlideFiles returns slides in numeric order', async () => {
  const slides = await listSlideFiles(SLIDES_DIR);
  assert.deepEqual(slides, ['slide-01.html', 'slide-02.html']);
});

test('GET /api/slides returns slide list', async () => {
  const { app } = await createCoreApp({ slidesDir: SLIDES_DIR });
  await withServer(app, async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/slides`);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.deepEqual(json, ['slide-01.html', 'slide-02.html']);
  });
});

test('GET /slides/:file serves slide html', async () => {
  const { app } = await createCoreApp({ slidesDir: SLIDES_DIR });
  await withServer(app, async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/slides/slide-01.html`);
    const text = await res.text();
    assert.equal(res.status, 200);
    assert.match(text, /one/);
  });
});

test('POST /api/slides/:file/save writes updated html', async () => {
  const { app } = await createCoreApp({ slidesDir: SLIDES_DIR });
  await withServer(app, async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/slides/slide-01.html/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: '<html><body>updated</body></html>' }),
    });
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
  });
});
