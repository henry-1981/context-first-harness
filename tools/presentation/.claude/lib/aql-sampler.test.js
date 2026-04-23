// presentation/.claude/lib/aql-sampler.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleSize, stratifiedSlides } from './aql-sampler.js';

test('sampleSize() AQL Level II Ac=0 표 값 일치', () => {
  assert.equal(sampleSize(5), 2);      // code A
  assert.equal(sampleSize(10), 3);     // code B
  assert.equal(sampleSize(20), 5);     // code C
  assert.equal(sampleSize(40), 8);     // code D
  assert.equal(sampleSize(70), 13);    // code E
  assert.equal(sampleSize(100), 20);   // code F
  assert.equal(sampleSize(200), 32);   // code G
  assert.equal(sampleSize(400), 50);   // code H
});

test('stratifiedSlides() includes cover + last + section boundaries', () => {
  const slides = [
    { n: 1, template: 'cover' },
    { n: 2, template: 'agenda' },
    { n: 3, template: 'bullet', section: 1 },
    { n: 4, template: 'bullet', section: 1 },
    { n: 5, template: 'compare', section: 2 },  // section boundary
    { n: 6, template: 'bullet', section: 2 },
    { n: 7, template: 'closing' }
  ];
  const sampled = stratifiedSlides(slides, 5);
  assert.ok(sampled.includes(1)); // cover
  assert.ok(sampled.includes(7)); // last
  assert.ok(sampled.includes(2)); // agenda
  assert.ok(sampled.includes(5)); // section boundary
  assert.equal(sampled.length, 5);
});

test('stratifiedSlides() pads with random when undersized', () => {
  const slides = Array.from({ length: 20 }, (_, i) => ({ n: i + 1, template: 'bullet', section: 1 }));
  const sampled = stratifiedSlides(slides, 5);
  assert.equal(sampled.length, 5);
  assert.ok(sampled.includes(1));
  assert.ok(sampled.includes(20));
});
