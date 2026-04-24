// presentation/.claude/lib/token-estimator.js
const PER_SLIDE_TEXT = 3000;
const PER_SLIDE_VISION_EXTRA = 8000;
const GATE_THRESHOLD = 20;

export function estimateDeckVerifier(n, { vision = false } = {}) {
  const base = n * PER_SLIDE_TEXT;
  return vision ? base + n * PER_SLIDE_VISION_EXTRA : base;
}

export function needsGate(n) {
  return n >= GATE_THRESHOLD;
}
