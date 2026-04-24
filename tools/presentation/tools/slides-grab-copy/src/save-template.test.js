import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { saveTemplate, validateTemplateTarget } from './save-template.js';

let workdir;

test.beforeEach(async () => {
  workdir = await mkdtemp(join(tmpdir(), 'save-template-'));
});

test.afterEach(async () => {
  await rm(workdir, { recursive: true, force: true });
});

test('validateTemplateTarget rejects invalid slot names', () => {
  assert.throws(() => validateTemplateTarget({ archetype: 'warm', slotName: 'Cover/Slide' }), /Invalid layout name/);
});

test('saveTemplate creates archetype directory and writes html file', async () => {
  const target = await saveTemplate({
    baseDir: workdir,
    archetype: 'warm',
    slotName: 'cover',
    html: '<html><body>ok</body></html>',
    mode: 'new',
  });
  const written = await readFile(target, 'utf8');
  assert.match(target, /templates-slide-warm\/cover\.html$/);
  assert.match(written, /ok/);
});
