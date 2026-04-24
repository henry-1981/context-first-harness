import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { parse } from './parser-api.js';

let workdir;

test.beforeEach(async () => {
  workdir = await mkdtemp(join(tmpdir(), 'parser-api-'));
});

test.afterEach(async () => {
  await rm(workdir, { recursive: true, force: true });
});

test('parse() returns html payload for single html source', async () => {
  const source = join(workdir, 'single.html');
  await writeFile(source, '<html><body><h1>hello</h1></body></html>', 'utf8');
  const result = await parse(source);
  assert.equal(result.metadata.source_kind, 'single-html');
  assert.match(result.html_string, /hello/);
  assert.equal(Array.isArray(result.extraction_report.blocks), true);
  assert.equal(result.extraction_report.blocks[0].role, 'html-root');
});

test('parse() extracts template contents for webppt html', async () => {
  const source = join(workdir, 'deck.html');
  await writeFile(source, '<html><body><template><section>slide-a</section></template><template><section>slide-b</section></template></body></html>', 'utf8');
  const result = await parse(source, { mode: 'webppt', slideIndex: 1 });
  assert.equal(result.metadata.source_kind, 'webppt-html');
  assert.equal(result.metadata.slide_count, 2);
  assert.match(result.html_string, /slide-b/);
  assert.equal(Array.isArray(result.extraction_report.blocks), true);
  assert.equal(result.extraction_report.blocks[0].role, 'html-root');
});
