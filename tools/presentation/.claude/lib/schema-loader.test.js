import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadValidator } from './schema-loader.js';
import { join as pathJoin } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const contractsDir = pathJoin(__dirname, '..', 'agents', '_contracts');

let workdir;

test.beforeEach(async () => {
  workdir = await mkdtemp(join(tmpdir(), 'schema-loader-'));
});

test.afterEach(async () => {
  await rm(workdir, { recursive: true, force: true });
});

test('loadValidator() returns function that validates against schema', async () => {
  const schemaPath = join(workdir, 'trivial.schema.json');
  await writeFile(schemaPath, JSON.stringify({
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    required: ['name'],
    properties: { name: { type: 'string' } }
  }));
  const validate = await loadValidator(schemaPath);
  assert.equal(validate({ name: 'foo' }), true);
  assert.equal(validate({ other: 1 }), false);
  assert.ok(Array.isArray(validate.errors));
});

test('loadValidator() supports date-time format via ajv-formats', async () => {
  const schemaPath = join(workdir, 'dt.schema.json');
  await writeFile(schemaPath, JSON.stringify({
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: { ts: { type: 'string', format: 'date-time' } },
    required: ['ts']
  }));
  const validate = await loadValidator(schemaPath);
  assert.equal(validate({ ts: '2026-04-20T14:32:00+09:00' }), true);
  assert.equal(validate({ ts: 'not-a-date' }), false);
});

test('storyteller.schema: valid fixture passes', async () => {
  const validate = await loadValidator(pathJoin(contractsDir, 'storyteller.schema.json'));
  const fixture = JSON.parse(await (await import('node:fs/promises')).readFile(pathJoin(contractsDir, 'fixtures', 'storyteller.valid.json'), 'utf8'));
  assert.equal(validate(fixture), true, JSON.stringify(validate.errors));
});

test('storyteller.schema: invalid fixture (source_range 자연어) fails', async () => {
  const validate = await loadValidator(pathJoin(contractsDir, 'storyteller.schema.json'));
  const fixture = JSON.parse(await (await import('node:fs/promises')).readFile(pathJoin(contractsDir, 'fixtures', 'storyteller.invalid.json'), 'utf8'));
  assert.equal(validate(fixture), false);
  assert.ok(validate.errors.some(e => e.instancePath.includes('source_range')));
});

test('template-filler.schema: valid fixture passes', async () => {
  const validate = await loadValidator(pathJoin(contractsDir, 'template-filler.schema.json'));
  const fixture = JSON.parse(await (await import('node:fs/promises')).readFile(pathJoin(contractsDir, 'fixtures', 'template-filler.valid.json'), 'utf8'));
  assert.equal(validate(fixture), true, JSON.stringify(validate.errors));
});

test('template-filler.schema: invalid mode_variant fails', async () => {
  const validate = await loadValidator(pathJoin(contractsDir, 'template-filler.schema.json'));
  const fixture = JSON.parse(await (await import('node:fs/promises')).readFile(pathJoin(contractsDir, 'fixtures', 'template-filler.invalid.json'), 'utf8'));
  assert.equal(validate(fixture), false);
});

test('visual-designer.schema: valid fixture passes', async () => {
  const validate = await loadValidator(pathJoin(contractsDir, 'visual-designer.schema.json'));
  const fixture = JSON.parse(await (await import('node:fs/promises')).readFile(pathJoin(contractsDir, 'fixtures', 'visual-designer.valid.json'), 'utf8'));
  assert.equal(validate(fixture), true, JSON.stringify(validate.errors));
});

test('visual-designer.schema: invalid mode_target fails', async () => {
  const validate = await loadValidator(pathJoin(contractsDir, 'visual-designer.schema.json'));
  const fixture = JSON.parse(await (await import('node:fs/promises')).readFile(pathJoin(contractsDir, 'fixtures', 'visual-designer.invalid.json'), 'utf8'));
  assert.equal(validate(fixture), false);
  assert.ok(validate.errors.some(e => e.instancePath.includes('mode_target')));
});

test('webppt-designer.schema: valid fixture passes', async () => {
  const validate = await loadValidator(pathJoin(contractsDir, 'webppt-designer.schema.json'));
  const fixture = JSON.parse(await (await import('node:fs/promises')).readFile(pathJoin(contractsDir, 'fixtures', 'webppt-designer.valid.json'), 'utf8'));
  assert.equal(validate(fixture), true, JSON.stringify(validate.errors));
});

test('webppt-designer.schema: animated_props에 layout trigger(width) 포함 시 fails', async () => {
  const validate = await loadValidator(pathJoin(contractsDir, 'webppt-designer.schema.json'));
  const fixture = JSON.parse(await (await import('node:fs/promises')).readFile(pathJoin(contractsDir, 'fixtures', 'webppt-designer.invalid.json'), 'utf8'));
  assert.equal(validate(fixture), false);
  assert.ok(validate.errors.some(e => e.instancePath.includes('animated_props')));
});

test('deck-verifier.schema: valid fixture passes', async () => {
  const validate = await loadValidator(pathJoin(contractsDir, 'deck-verifier.schema.json'));
  const fixture = JSON.parse(await (await import('node:fs/promises')).readFile(pathJoin(contractsDir, 'fixtures', 'deck-verifier.valid.json'), 'utf8'));
  assert.equal(validate(fixture), true, JSON.stringify(validate.errors));
});

test('deck-verifier.schema: summary_line 정규식 미준수 시 fails', async () => {
  const validate = await loadValidator(pathJoin(contractsDir, 'deck-verifier.schema.json'));
  const fixture = JSON.parse(await (await import('node:fs/promises')).readFile(pathJoin(contractsDir, 'fixtures', 'deck-verifier.invalid.json'), 'utf8'));
  assert.equal(validate(fixture), false);
  assert.ok(validate.errors.some(e => e.instancePath.includes('summary_line')));
});

test('outline-verifier.schema: valid fixture passes', async () => {
  const validate = await loadValidator(pathJoin(contractsDir, 'outline-verifier.schema.json'));
  const fixture = JSON.parse(await (await import('node:fs/promises')).readFile(pathJoin(contractsDir, 'fixtures', 'outline-verifier.valid.json'), 'utf8'));
  assert.equal(validate(fixture), true, JSON.stringify(validate.errors));
});

test('outline-verifier.schema: checks 필수 키 누락 시 fails', async () => {
  const validate = await loadValidator(pathJoin(contractsDir, 'outline-verifier.schema.json'));
  const fixture = JSON.parse(await (await import('node:fs/promises')).readFile(pathJoin(contractsDir, 'fixtures', 'outline-verifier.invalid.json'), 'utf8'));
  assert.equal(validate(fixture), false);
  assert.ok(validate.errors.some(e => e.instancePath.includes('checks') || e.schemaPath.includes('required')));
});

test('sample-verifier.schema: valid fixture passes', async () => {
  const validate = await loadValidator(pathJoin(contractsDir, 'sample-verifier.schema.json'));
  const fixture = JSON.parse(await (await import('node:fs/promises')).readFile(pathJoin(contractsDir, 'fixtures', 'sample-verifier.valid.json'), 'utf8'));
  assert.equal(validate(fixture), true, JSON.stringify(validate.errors));
});

test('sample-verifier.schema: sides.slide_count > 2 fails', async () => {
  const validate = await loadValidator(pathJoin(contractsDir, 'sample-verifier.schema.json'));
  const fixture = JSON.parse(await (await import('node:fs/promises')).readFile(pathJoin(contractsDir, 'fixtures', 'sample-verifier.invalid.json'), 'utf8'));
  assert.equal(validate(fixture), false);
  assert.ok(validate.errors.some(e => e.instancePath.includes('slide_count')));
});

test('export-verifier.schema: valid fixture passes', async () => {
  const validate = await loadValidator(pathJoin(contractsDir, 'export-verifier.schema.json'));
  const fixture = JSON.parse(await (await import('node:fs/promises')).readFile(pathJoin(contractsDir, 'fixtures', 'export-verifier.valid.json'), 'utf8'));
  assert.equal(validate(fixture), true, JSON.stringify(validate.errors));
});

test('export-verifier.schema: findings evidence 없는 항목 있으면 fails', async () => {
  const validate = await loadValidator(pathJoin(contractsDir, 'export-verifier.schema.json'));
  const fixture = JSON.parse(await (await import('node:fs/promises')).readFile(pathJoin(contractsDir, 'fixtures', 'export-verifier.invalid.json'), 'utf8'));
  assert.equal(validate(fixture), false);
  assert.ok(validate.errors.some(e => e.schemaPath.includes('anyOf') || e.instancePath.includes('findings')));
});
