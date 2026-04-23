import test from 'node:test';
import assert from 'node:assert/strict';

import { listVariableTokens, replaceTextWithVariable, revertVariable } from './entity-gate.js';

test('replaceTextWithVariable replaces selected text with variable token', () => {
  const html = '<div>Quarterly Revenue</div>';
  const result = replaceTextWithVariable(html, 'Quarterly Revenue', 'TITLE');
  assert.equal(result, '<div>{{TITLE}}</div>');
});

test('revertVariable restores original text', () => {
  const html = '<div>{{TITLE}}</div>';
  const result = revertVariable(html, 'TITLE', 'Quarterly Revenue');
  assert.equal(result, '<div>Quarterly Revenue</div>');
});

test('listVariableTokens returns all variable names', () => {
  const html = '<div>{{TITLE}}</div><span>{{DATE}}</span>';
  assert.deepEqual(listVariableTokens(html), ['TITLE', 'DATE']);
});
