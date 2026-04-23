// editor-utils.js — Helper functions

import { state, slideStates, directSaveStateBySlide } from './editor-state.js';
import { statusMsg } from './editor-dom.js';

export function setStatus(message) {
  statusMsg.textContent = message;
}

export function currentSlideFile() {
  return state.slides[state.currentIndex] || null;
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function getDirectSaveState(slide) {
  if (!directSaveStateBySlide.has(slide)) {
    directSaveStateBySlide.set(slide, {
      timer: null,
      pendingHtml: '',
      pendingMessage: '',
      chain: Promise.resolve(),
    });
  }
  return directSaveStateBySlide.get(slide);
}

export function normalizeHexColor(value, fallback = '#111111') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();

  // #rrggbb
  const hexMatch = trimmed.match(/^#([0-9a-f]{6})$/i);
  if (hexMatch) return `#${hexMatch[1].toLowerCase()}`;

  // #rgb shorthand
  const hex3Match = trimmed.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  if (hex3Match) return `#${hex3Match[1]}${hex3Match[1]}${hex3Match[2]}${hex3Match[2]}${hex3Match[3]}${hex3Match[3]}`.toLowerCase();

  // transparent / rgba with 0 alpha
  if (trimmed === 'transparent' || trimmed === 'rgba(0, 0, 0, 0)') return fallback;

  // rgb(r, g, b) / rgba(r, g, b, a) — tolerant of extra spaces
  const rgbMatch = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!rgbMatch) return fallback;
  const toHex = (part) => Number(part).toString(16).padStart(2, '0');
  return `#${toHex(rgbMatch[1])}${toHex(rgbMatch[2])}${toHex(rgbMatch[3])}`;
}

export function parsePixelValue(value, fallback = 24) {
  const parsed = Number.parseFloat(String(value || '').replace('px', ''));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.round(parsed);
}

export function isBoldFontWeight(value) {
  const numeric = Number.parseInt(value, 10);
  if (Number.isFinite(numeric)) return numeric >= 600;
  return /bold/i.test(String(value || ''));
}

export function getSlideState(slide) {
  if (!slideStates.has(slide)) {
    slideStates.set(slide, {
      selectedObjectXPath: '',
    });
  }
  return slideStates.get(slide);
}
