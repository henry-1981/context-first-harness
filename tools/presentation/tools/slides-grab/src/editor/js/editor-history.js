// editor-history.js — Global undo/redo history stack

import { state } from './editor-state.js';
import { slideIframe } from './editor-dom.js';
import { serializeSlideDocument } from './editor-direct-edit.js';

const MAX_HISTORY = 200;

const _history = [];   // Array of { slideIndex, html }
let _pointer = -1;     // Points to current state in _history
let _restoring = false; // Guard to prevent snapshot during restore

export function isRestoring() { return _restoring; }

export function captureSnapshot() {
  if (_restoring) return;
  const html = serializeSlideDocument(slideIframe.contentDocument);
  if (!html) return;

  // Skip if identical to current top of stack
  if (_pointer >= 0 && _history[_pointer].slideIndex === state.currentIndex
      && _history[_pointer].html === html) return;

  const entry = { slideIndex: state.currentIndex, html };

  // Discard any redo entries beyond pointer
  _history.splice(_pointer + 1);

  // Push new entry
  _history.push(entry);
  _pointer = _history.length - 1;

  // Enforce hard limit — drop oldest
  if (_history.length > MAX_HISTORY) {
    const excess = _history.length - MAX_HISTORY;
    _history.splice(0, excess);
    _pointer -= excess;
  }

  window.dispatchEvent(new CustomEvent('historyChanged'));
}

export function canUndo() { return _pointer > 0; }
export function canRedo() { return _pointer < _history.length - 1; }

export function getUndoEntry() {
  if (!canUndo()) return null;
  _pointer--;
  return _history[_pointer];
}

export function getRedoEntry() {
  if (!canRedo()) return null;
  _pointer++;
  return _history[_pointer];
}

export function setRestoring(value) { _restoring = value; }

export function getHistoryState() {
  return { length: _history.length, pointer: _pointer };
}
