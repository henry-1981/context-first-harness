import test from 'node:test';
import assert from 'node:assert/strict';

import { deleteBlock, moveBlock, resizeBlock, restoreBlock } from './layout-edit.js';

test('moveBlock updates coordinates', () => {
  const moved = moveBlock({ id: 'a', x: 0, y: 0 }, 100, 200);
  assert.deepEqual(moved, { id: 'a', x: 100, y: 200 });
});

test('resizeBlock updates dimensions', () => {
  const resized = resizeBlock({ id: 'a', width: 10, height: 20 }, 30, 40);
  assert.deepEqual(resized, { id: 'a', width: 30, height: 40 });
});

test('deleteBlock removes target block', () => {
  const remaining = deleteBlock([{ id: 'a' }, { id: 'b' }], 'a');
  assert.deepEqual(remaining, [{ id: 'b' }]);
});

test('restoreBlock inserts block at original index', () => {
  const blocks = restoreBlock([{ id: 'b' }], { id: 'a' }, 0);
  assert.deepEqual(blocks, [{ id: 'a' }, { id: 'b' }]);
});
