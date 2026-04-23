import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateStateAgainstSchema, assertHistorySequence } from './state-checker.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, 'fixtures', 'scenario-1-greenfield.state.json');

test('scenario-1 fixture validates against project.state.schema.json', async () => {
  const state = JSON.parse(await readFile(FIXTURE, 'utf8'));
  const result = await validateStateAgainstSchema(state);
  assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));
});

test('scenario-1 history sequence contains all 10 required events in order', async () => {
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
    'export_verifier_pass'
  ]));
});

test('scenario-1 final statuses all transitioned to passed/pass', async () => {
  const state = JSON.parse(await readFile(FIXTURE, 'utf8'));
  assert.equal(state.plan.status, 'passed');
  assert.equal(state.design.status, 'passed');
  assert.equal(state.export.verifiers.export.status, 'pass');
  assert.ok(state.export.formats.length >= 1);
});

test('scenario-1 design.editor_history empty (P6-B n response)', async () => {
  const state = JSON.parse(await readFile(FIXTURE, 'utf8'));
  assert.equal(state.design.editor_history.length, 0);
});
