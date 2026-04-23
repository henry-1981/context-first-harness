// editor-direct-edit.js — Style changes, direct save (debounced)

import { localFileUpdateBySlide } from './editor-state.js';
import { slideIframe } from './editor-dom.js';
import { currentSlideFile, getDirectSaveState, setStatus } from './editor-utils.js';
import { getSelectedObjectElement, renderObjectSelection, updateObjectEditorControls } from './editor-select.js';
import { captureSnapshot, isRestoring } from './editor-history.js';

export function serializeSlideDocument(doc) {
  if (!doc?.documentElement) return '';
  const doctype = doc.doctype ? `<!DOCTYPE ${doc.doctype.name}>` : '<!DOCTYPE html>';
  return `${doctype}\n${doc.documentElement.outerHTML}`;
}

async function persistDirectSlideHtml(slide, html, message) {
  if (!slide || !html) return;

  try {
    const res = await fetch(`/api/slides/${encodeURIComponent(slide)}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slide, html }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Save failed with HTTP ${res.status}`);
    }

    localFileUpdateBySlide.set(slide, Date.now());
    if (slide === currentSlideFile()) {
      setStatus(message || `${slide} saved.`);
    }
  } catch (error) {
    console.error(`[${slide}] Direct edit save failed:`, error);
    setStatus(`Error: ${error.message}`);
  }
}

function queueDirectSave(slide, html, message) {
  const saveState = getDirectSaveState(slide);
  if (!html) return saveState.chain;
  saveState.chain = saveState.chain
    .catch(() => {})
    .then(() => persistDirectSlideHtml(slide, html, message));
  return saveState.chain;
}

export function scheduleDirectSave(delay = 0, message = 'Object updated and saved.') {
  const slide = currentSlideFile();
  const html = serializeSlideDocument(slideIframe.contentDocument);
  if (!slide || !html) return;

  const saveState = getDirectSaveState(slide);
  saveState.pendingHtml = html;
  saveState.pendingMessage = message;
  if (saveState.timer) {
    window.clearTimeout(saveState.timer);
  }
  saveState.timer = window.setTimeout(() => {
    saveState.timer = null;
    const nextHtml = saveState.pendingHtml;
    const nextMessage = saveState.pendingMessage;
    saveState.pendingHtml = '';
    queueDirectSave(slide, nextHtml, nextMessage);
  }, Math.max(0, delay));
}

export async function flushDirectSaveForSlide(slide) {
  if (!slide) return;

  const saveState = getDirectSaveState(slide);
  if (saveState.timer) {
    window.clearTimeout(saveState.timer);
    saveState.timer = null;
    const html = saveState.pendingHtml;
    const message = saveState.pendingMessage;
    saveState.pendingHtml = '';
    await queueDirectSave(slide, html, message);
    return;
  }

  await saveState.chain.catch(() => {});
}

export function applyTextDecorationToken(el, token, shouldEnable) {
  const frameWindow = slideIframe.contentWindow;
  const styles = frameWindow?.getComputedStyle ? frameWindow.getComputedStyle(el) : null;
  const parts = new Set(
    String(styles?.textDecorationLine || '')
      .split(/\s+/)
      .filter((part) => part === 'underline' || part === 'line-through'),
  );
  if (shouldEnable) {
    parts.add(token);
  } else {
    parts.delete(token);
  }
  el.style.textDecorationLine = parts.size > 0 ? Array.from(parts).join(' ') : 'none';
}

export function mutateSelectedObject(mutator, message, { delay = 0, preserveTextInput = false } = {}) {
  const selected = getSelectedObjectElement();
  if (!selected) return;
  mutator(selected);
  renderObjectSelection();
  updateObjectEditorControls({ preserveTextInput });
  scheduleDirectSave(delay, message);
  setStatus('Saving direct edit...');
  // Capture snapshot for undo (skip during restore)
  if (!isRestoring()) {
    captureSnapshot();
  }
}

// Layer 1: iframe 내부 요소에 contenteditable 토글 + execCommand 바인딩
export function enableInlineEditOnDblClick(iframe) {
  const doc = iframe.contentDocument;
  if (!doc) return;
  doc.body.addEventListener('dblclick', (ev) => {
    const target = ev.target;
    // Use nodeType check instead of instanceof HTMLElement to avoid cross-frame prototype mismatch
    if (!target || target.nodeType !== 1) return;
    if (!target.matches('h1, h2, h3, h4, h5, h6, p, li, span, div')) return;
    target.setAttribute('contenteditable', 'true');
    target.focus();
  });
  doc.body.addEventListener('focusout', (ev) => {
    const target = ev.target;
    if (target && target.nodeType === 1 && target.getAttribute('contenteditable') === 'true') {
      target.removeAttribute('contenteditable');
    }
  });
}

export function bindExecCommandButtons(iframe) {
  const doc = iframe.contentDocument;
  if (!doc) return;
  const map = {
    'toggle-bold': 'bold',
    'toggle-italic': 'italic',
    'toggle-underline': 'underline',
    'toggle-strike': 'strikeThrough',
    'align-left': 'justifyLeft',
    'align-center': 'justifyCenter',
    'align-right': 'justifyRight',
  };
  for (const [btnId, cmd] of Object.entries(map)) {
    const btn = document.getElementById(btnId);
    if (!btn) continue;
    btn.addEventListener('click', () => {
      doc.execCommand(cmd, false, null);
    });
  }
}
