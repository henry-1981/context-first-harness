// presentation/.claude/lib/token-estimator.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateDeckVerifier, needsGate } from './token-estimator.js';

test('estimateDeckVerifier text-only: n × 3000', () => {
  assert.equal(estimateDeckVerifier(20, { vision: false }), 60_000);
  assert.equal(estimateDeckVerifier(32, { vision: false }), 96_000);
  assert.equal(estimateDeckVerifier(50, { vision: false }), 150_000);
});

test('estimateDeckVerifier with vision: n × 11000', () => {
  assert.equal(estimateDeckVerifier(20, { vision: true }), 220_000);
  assert.equal(estimateDeckVerifier(32, { vision: true }), 352_000);
  assert.equal(estimateDeckVerifier(50, { vision: true }), 550_000);
});

test('needsGate() threshold at n >= 20', () => {
  assert.equal(needsGate(19), false);
  assert.equal(needsGate(20), true);
  assert.equal(needsGate(50), true);
});
