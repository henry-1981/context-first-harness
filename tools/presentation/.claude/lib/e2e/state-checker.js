import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(__dirname, '..', '..', 'agents', '_contracts', 'project.state.schema.json');

let _validator = null;

async function loadValidator() {
  if (_validator) return _validator;
  const raw = await readFile(SCHEMA_PATH, 'utf8');
  const schema = JSON.parse(raw);
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  _validator = ajv.compile(schema);
  return _validator;
}

export async function validateStateAgainstSchema(state) {
  const validate = await loadValidator();
  const valid = validate(state);
  return valid ? { valid: true } : { valid: false, errors: validate.errors };
}

export function extractHistoryEvents(state) {
  if (!Array.isArray(state.history)) return [];
  return state.history.map(h => h.event);
}

export function assertHistorySequence(state, expected) {
  const actual = extractHistoryEvents(state);
  let cursor = 0;
  for (const want of expected) {
    const idx = actual.indexOf(want, cursor);
    if (idx === -1) {
      throw new Error(`missing event '${want}' in history. actual sequence: [${actual.join(', ')}]`);
    }
    cursor = idx + 1;
  }
}

function collectStrings(value, acc = []) {
  if (typeof value === 'string') {
    acc.push(value);
    return acc;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, acc);
    return acc;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, acc);
  }
  return acc;
}

const LEGACY_PATH_PATTERNS = [
  /_workspace\//,
  /(^|[^a-z])00_input\.md/,
  /(^|[^a-z])01_outline\.md/,
  /02a_/,
  /02b_/,
  /(^|[^a-z])output\/slide-/,
];

export function findLegacyWorkspacePaths(state) {
  return collectStrings(state).filter((entry) => LEGACY_PATH_PATTERNS.some((pattern) => pattern.test(entry)));
}

export function assertNoLegacyWorkspacePaths(state) {
  const matches = findLegacyWorkspacePaths(state);
  if (matches.length > 0) {
    throw new Error(`legacy workspace paths detected: ${matches.join(', ')}`);
  }
}
