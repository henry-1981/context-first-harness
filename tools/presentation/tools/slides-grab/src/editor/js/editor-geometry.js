// editor-geometry.js — Shared geometry helpers (extracted from editor-bbox.js)

import { SLIDE_W, SLIDE_H } from './editor-state.js';
import { slideStage, slideWrapper, drawLayer } from './editor-dom.js';
import { clamp } from './editor-utils.js';

export function scaleSlide() {
  const availW = slideStage.clientWidth;
  const availH = slideStage.clientHeight;
  if (availW <= 0 || availH <= 0) return;

  const scale = Math.min(availW / SLIDE_W, availH / SLIDE_H, 1);
  const offsetX = (availW - SLIDE_W * scale) / 2;
  const offsetY = (availH - SLIDE_H * scale) / 2;
  slideWrapper.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

export function clientToSlidePoint(clientX, clientY) {
  const rect = drawLayer.getBoundingClientRect();
  const relX = clamp((clientX - rect.left) / rect.width, 0, 1);
  const relY = clamp((clientY - rect.top) / rect.height, 0, 1);
  return {
    x: Math.round(relX * SLIDE_W),
    y: Math.round(relY * SLIDE_H),
  };
}

export function getXPath(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';

  const segments = [];
  let node = el;
  while (node && node.nodeType === Node.ELEMENT_NODE) {
    const tag = node.tagName.toLowerCase();

    let index = 1;
    let sibling = node.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === node.tagName) index += 1;
      sibling = sibling.previousElementSibling;
    }

    segments.unshift(`${tag}[${index}]`);
    node = node.parentElement;
  }

  return `/${segments.join('/')}`;
}
