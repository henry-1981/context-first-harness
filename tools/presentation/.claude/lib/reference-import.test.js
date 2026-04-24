import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { importReferenceSkeleton } from './reference-import.js';

let workdir;

test.beforeEach(async () => {
  workdir = await mkdtemp(join(tmpdir(), 'reference-import-'));
});

test.afterEach(async () => {
  await rm(workdir, { recursive: true, force: true });
});

test('importReferenceSkeleton parses html and wraps direction skeleton', async () => {
  const source = join(workdir, 'ref.html');
  await writeFile(source, '<html><body><div style="color:red">Title</div></body></html>', 'utf8');
  const result = await importReferenceSkeleton({
    sourcePath: source,
    direction: 'editorial-magazine',
  });
  assert.equal(result.metadata.source_kind, 'single-html');
  assert.match(result.html, /reference-skeleton/);
  assert.match(result.html, /data-direction="editorial-magazine"/);
});

test('importReferenceSkeleton supports webppt parser mode', async () => {
  const source = join(workdir, 'deck.html');
  await writeFile(source, '<html><body><template><section style="background:#fff">Slide A</section></template></body></html>', 'utf8');
  const result = await importReferenceSkeleton({
    sourcePath: source,
    direction: 'editorial-magazine',
    parserOptions: { mode: 'webppt' },
  });
  assert.equal(result.metadata.source_kind, 'webppt-html');
  assert.match(result.html, /Slide A/);
});
