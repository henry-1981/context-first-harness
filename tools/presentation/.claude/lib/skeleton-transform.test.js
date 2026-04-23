import test from 'node:test';
import assert from 'node:assert/strict';

import { applyDirectionSkeleton } from './skeleton-transform.js';

test('applyDirectionSkeleton strips inline style tokens and adds direction wrapper', () => {
  const html = '<div style="color:red;background:#fff;font-family:Inter"><span style="color:blue">Text</span></div>';
  const result = applyDirectionSkeleton({ html, direction: 'editorial-magazine' });
  assert.match(result, /data-direction="editorial-magazine"/);
  assert.doesNotMatch(result, /style=/);
  assert.doesNotMatch(result, /background:/i);
  assert.doesNotMatch(result, /font-family:/i);
});
