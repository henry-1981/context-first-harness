import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { saveTemplate } from '../../../tools/slides-grab-copy/src/save-template.js';

let workdir;

test.beforeEach(async () => {
  workdir = await mkdtemp(join(tmpdir(), 'template-ingest-'));
});

test.afterEach(async () => {
  await rm(workdir, { recursive: true, force: true });
});

test('saved template is discoverable under templates-slide-* glob shape', async () => {
  await saveTemplate({
    baseDir: workdir,
    archetype: 'warm',
    slotName: 'cover',
    html: '<html><body>cover</body></html>',
  });
  const entries = await readdir(join(workdir, 'templates-slide-warm'));
  assert.ok(entries.includes('cover.html'));
});
