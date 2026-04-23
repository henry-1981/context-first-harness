// editor-select.js — Object selection, hover, tool mode UI

import { state, TOOL_MODE_SELECT, SLIDE_W, SLIDE_H, NON_SELECTABLE_TAGS, SEL_ELEMENT, SEL_SLIDE_WHOLE } from './editor-state.js';
import {
  slideIframe, selectToolbar, editorHint, objectSelectedBox, objectHoverBox,
  resizeHandles,
  toggleBold, toggleItalic, toggleUnderline, toggleStrike,
  alignLeft, alignCenter, alignRight,
  popoverTextInput, popoverApplyText, popoverTextColorInput, popoverBgColorInput,
  popoverSizeInput,
  slideWholeBrackets, slideWholeLabel,
} from './editor-dom.js';
import {
  currentSlideFile, getSlideState, setStatus, clamp,
  normalizeHexColor, parsePixelValue, isBoldFontWeight,
} from './editor-utils.js';
import { scaleSlide, clientToSlidePoint, getXPath } from './editor-geometry.js';
// Hide floating input on selection change (avoid circular import with editor-ai-edit.js)
function dismissFloatingInput() {
  const fi = document.getElementById('floating-ai-input');
  const field = document.getElementById('floating-ai-input-field');
  if (fi) fi.style.display = 'none';
  if (field) { field.value = ''; field.blur(); }
}

function isElementNode(node) {
  return Boolean(node) && node.nodeType === Node.ELEMENT_NODE;
}

export function resolveXPath(doc, xpath) {
  if (!doc || typeof xpath !== 'string' || xpath.trim() === '') return null;
  try {
    return doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  } catch {
    return null;
  }
}

export function getSelectedObjectElement(slide = currentSlideFile()) {
  if (!slide) return null;
  const ss = getSlideState(slide);
  const xpath = ss.selectedObjectXPath;
  if (!xpath) return null;

  const doc = slideIframe.contentDocument;
  const el = resolveXPath(doc, xpath);
  return isElementNode(el) ? el : null;
}

export function isSelectableElement(el) {
  if (!isElementNode(el)) return false;
  const tag = el.tagName.toLowerCase();
  if (NON_SELECTABLE_TAGS.has(tag)) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 1 && rect.height > 1;
}

export function isTextEditableElement(el) {
  if (!isElementNode(el)) return false;
  const tag = el.tagName.toLowerCase();
  if (NON_SELECTABLE_TAGS.has(tag)) return false;

  // Has direct text content (not just whitespace)?
  const hasDirectText = Array.from(el.childNodes).some(
    n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
  );

  // Children are all inline (text-level) elements?
  const INLINE_TAGS = new Set(['BR','B','STRONG','I','EM','U','S','SPAN','A','SMALL','SUB','SUP','MARK','CODE']);
  const allChildrenInline = Array.from(el.children).every(c => INLINE_TAGS.has(c.tagName));

  return hasDirectText && allChildrenInline;
}

let _lastClickPoint = null;
let _lastClickCandidates = [];
let _lastClickIndex = -1;

export function getSelectableTargetAt(clientX, clientY) {
  const doc = slideIframe.contentDocument;
  if (!doc) return null;

  const point = clientToSlidePoint(clientX, clientY);

  // Collect all selectable elements at this point
  const allAtPoint = doc.elementsFromPoint(point.x, point.y);
  const candidates = [];
  const seen = new Set();
  for (const raw of allAtPoint) {
    let node = raw;
    while (node && !isSelectableElement(node)) {
      node = node.parentElement;
    }
    if (node && isElementNode(node) && !seen.has(node)) {
      seen.add(node);
      candidates.push(node);
    }
  }

  if (candidates.length === 0) return null;

  // Same spot clicked again? Cycle to next candidate
  const isSameSpot = _lastClickPoint &&
    Math.abs(point.x - _lastClickPoint.x) < 10 &&
    Math.abs(point.y - _lastClickPoint.y) < 10;

  if (isSameSpot && candidates.length > 1) {
    _lastClickIndex = (_lastClickIndex + 1) % candidates.length;
  } else {
    _lastClickIndex = 0;
  }

  _lastClickPoint = point;
  _lastClickCandidates = candidates;

  return candidates[_lastClickIndex];
}

export function elementToSlideRect(el) {
  if (!isElementNode(el)) return null;
  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    x: clamp(Math.round(rect.left), 0, SLIDE_W),
    y: clamp(Math.round(rect.top), 0, SLIDE_H),
    width: Math.max(1, Math.round(rect.width)),
    height: Math.max(1, Math.round(rect.height)),
  };
}

export function applyOverlayRect(node, rect) {
  if (!node || !rect) {
    if (node) node.style.display = 'none';
    return;
  }

  node.style.display = 'block';
  node.style.left = `${rect.x}px`;
  node.style.top = `${rect.y}px`;
  node.style.width = `${rect.width}px`;
  node.style.height = `${rect.height}px`;
}

export function readSelectedObjectStyleState(el) {
  const frameWindow = slideIframe.contentWindow;
  const styles = frameWindow?.getComputedStyle ? frameWindow.getComputedStyle(el) : null;
  const textDecorationLine = styles?.textDecorationLine || '';
  return {
    textEditable: isTextEditableElement(el),
    textValue: (el.innerHTML || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').trim(),
    textColor: normalizeHexColor(styles?.color, '#111111'),
    backgroundColor: normalizeHexColor(styles?.backgroundColor, '#ffffff'),
    fontSize: parsePixelValue(styles?.fontSize, 24),
    bold: isBoldFontWeight(styles?.fontWeight),
    italic: styles?.fontStyle === 'italic',
    underline: /\bunderline\b/.test(textDecorationLine),
    strike: /\bline-through\b/.test(textDecorationLine),
    textAlign: styles?.textAlign || 'left',
  };
}

function setToggleActive(button, active) {
  if (!button) return;
  button.classList.toggle('active', Boolean(active));
  button.setAttribute('aria-pressed', active ? 'true' : 'false');
}

function setControlEnabled(button, enabled) {
  if (!button) return;
  button.disabled = !enabled;
  button.setAttribute('aria-disabled', enabled ? 'false' : 'true');
}

export function getSelectedObjectCapabilities(el) {
  const textEditable = isTextEditableElement(el);
  return {
    textEditable,
    textColorEditable: textEditable,
    backgroundEditable: isElementNode(el),
    sizeEditable: textEditable,
    emphasisEditable: textEditable,
    alignEditable: textEditable,
  };
}

let _syncing = false;
export function isSyncing() { return _syncing; }

function syncInlineInputs(snapshot) {
  _syncing = true;
  try {
    if (!document.activeElement || !document.activeElement.closest?.('#select-toolbar')) {
      popoverTextInput.value = snapshot?.textValue || '';
      popoverSizeInput.value = String(snapshot?.fontSize || 24);
    }
    popoverTextColorInput.value = snapshot?.textColor || '#111111';
    popoverBgColorInput.value = snapshot?.backgroundColor || '#ffffff';
  } finally {
    _syncing = false;
  }
}

export function updateObjectEditorControls() {
  const selected = getSelectedObjectElement();
  const snapshot = selected ? readSelectedObjectStyleState(selected) : null;
  const capabilities = getSelectedObjectCapabilities(selected);

  if (selectToolbar) {
    selectToolbar.hidden = false;
  }

  popoverTextInput.disabled = !capabilities.textEditable;
  popoverApplyText.disabled = !capabilities.textEditable;
  popoverTextColorInput.disabled = !capabilities.textColorEditable;
  popoverBgColorInput.disabled = !capabilities.backgroundEditable;
  popoverSizeInput.disabled = !capabilities.sizeEditable;

  setControlEnabled(toggleBold, capabilities.emphasisEditable);
  setControlEnabled(toggleItalic, capabilities.emphasisEditable);
  setControlEnabled(toggleUnderline, capabilities.emphasisEditable);
  setControlEnabled(toggleStrike, capabilities.emphasisEditable);
  setControlEnabled(alignLeft, capabilities.alignEditable);
  setControlEnabled(alignCenter, capabilities.alignEditable);
  setControlEnabled(alignRight, capabilities.alignEditable);

  setToggleActive(toggleBold, capabilities.emphasisEditable && snapshot?.bold);
  setToggleActive(toggleItalic, capabilities.emphasisEditable && snapshot?.italic);
  setToggleActive(toggleUnderline, capabilities.emphasisEditable && snapshot?.underline);
  setToggleActive(toggleStrike, capabilities.emphasisEditable && snapshot?.strike);
  setToggleActive(alignLeft, capabilities.alignEditable && (snapshot?.textAlign === 'left' || snapshot?.textAlign === 'start'));
  setToggleActive(alignCenter, capabilities.alignEditable && snapshot?.textAlign === 'center');
  setToggleActive(alignRight, capabilities.alignEditable && (snapshot?.textAlign === 'right' || snapshot?.textAlign === 'end'));

  syncInlineInputs(snapshot);
}

export function renderObjectSelection() {
  const slide = currentSlideFile();
  const ss = slide ? getSlideState(slide) : {};
  const selType = ss.selectionType || null;

  const selectedEl = getSelectedObjectElement();
  const hoveredEl = resolveXPath(slideIframe.contentDocument, state.hoveredObjectXPath);

  // Element selection visuals
  const selectedRect = selectedEl ? elementToSlideRect(selectedEl) : null;
  const hoveredRect = hoveredEl && hoveredEl !== selectedEl ? elementToSlideRect(hoveredEl) : null;
  applyOverlayRect(objectSelectedBox, selType === SEL_ELEMENT ? selectedRect : null);
  applyOverlayRect(objectHoverBox, hoveredRect);

  // Resize handles — only for element selection
  const showHandles = selType === SEL_ELEMENT && Boolean(selectedRect);
  resizeHandles.forEach(h => { h.style.display = showHandles ? 'block' : 'none'; });

  // Tag label — disabled per user feedback

  // Slide-whole brackets
  if (slideWholeBrackets) {
    slideWholeBrackets.style.display = selType === SEL_SLIDE_WHOLE ? 'block' : 'none';
  }
  if (slideWholeLabel) {
    slideWholeLabel.style.display = selType === SEL_SLIDE_WHOLE ? 'block' : 'none';
  }
}

export function updateToolModeUI() {
  editorHint.textContent = 'Click an element to select and edit it.';
  renderObjectSelection();
  updateObjectEditorControls();
  scaleSlide();
}

export function getSelectionType(slide = currentSlideFile()) {
  if (!slide) return null;
  const ss = getSlideState(slide);
  return ss.selectionType || null;
}

export function setSelectedObjectXPath(xpath, statusMessage = 'Object selected.') {
  const slide = currentSlideFile();
  if (!slide) return;
  dismissFloatingInput();
  const ss = getSlideState(slide);
  ss.selectedObjectXPath = xpath || '';
  ss.selectionType = xpath ? SEL_ELEMENT : null;
  state.hoveredObjectXPath = xpath || '';
  renderObjectSelection();
  updateObjectEditorControls();
  if (statusMessage) {
    setStatus(statusMessage);
  }
}

export function setSlideWholeSelection(statusMessage = 'Whole slide selected.') {
  const slide = currentSlideFile();
  if (!slide) return;
  dismissFloatingInput();
  const ss = getSlideState(slide);
  ss.selectedObjectXPath = '';
  ss.selectionType = SEL_SLIDE_WHOLE;
  state.hoveredObjectXPath = '';
  renderObjectSelection();
  updateObjectEditorControls();
  if (statusMessage) {
    setStatus(statusMessage);
  }
}

export function clearSelection(statusMessage = '') {
  const slide = currentSlideFile();
  if (!slide) return;
  dismissFloatingInput();
  const ss = getSlideState(slide);
  ss.selectedObjectXPath = '';
  ss.selectionType = null;
  state.hoveredObjectXPath = '';
  renderObjectSelection();
  updateObjectEditorControls();
  if (statusMessage) {
    setStatus(statusMessage);
  }
}

const CURSOR_MAP = { nw: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', se: 'nwse-resize',
  n: 'ns-resize', s: 'ns-resize', w: 'ew-resize', e: 'ew-resize' };

export function updateHoveredObjectFromPointer(clientX, clientY) {
  if (state.toolMode !== TOOL_MODE_SELECT) return;

  // Update cursor for resize hint
  const sel = getSelectedObjectElement();
  const drawLayerEl = document.getElementById('draw-layer');
  if (sel && drawLayerEl) {
    const point = clientToSlidePoint(clientX, clientY);
    const rect = elementToSlideRect(sel);
    const handle = rect ? detectHandle(point, rect) : null;
    if (handle) {
      drawLayerEl.style.cursor = CURSOR_MAP[handle];
    } else {
      // Inside selected element → move cursor, outside → default
      const inside = rect &&
        point.x >= rect.x && point.x <= rect.x + rect.width &&
        point.y >= rect.y && point.y <= rect.y + rect.height;
      drawLayerEl.style.cursor = inside ? 'move' : 'default';
    }
  }

  const target = getSelectableTargetAt(clientX, clientY);
  state.hoveredObjectXPath = target ? getXPath(target) : '';
  renderObjectSelection();
}

export function clearHoveredObject() {
  state.hoveredObjectXPath = '';
  renderObjectSelection();
}

// --- Drag-to-move ---

let _dragState = null;
const DRAG_THRESHOLD = 4; // px in slide coords before drag starts
const EDGE_ZONE = 6; // px from edge to trigger resize (conservative)

function detectHandle(point, rect) {
  const dx0 = point.x - rect.x;               // distance from left edge
  const dx1 = (rect.x + rect.width) - point.x; // distance from right edge
  const dy0 = point.y - rect.y;               // distance from top edge
  const dy1 = (rect.y + rect.height) - point.y; // distance from bottom edge

  // Must be clearly on the edge — inside element = no handle
  const onL = dx0 >= -EDGE_ZONE && dx0 <= EDGE_ZONE;
  const onR = dx1 >= -EDGE_ZONE && dx1 <= EDGE_ZONE;
  const onT = dy0 >= -EDGE_ZONE && dy0 <= EDGE_ZONE;
  const onB = dy1 >= -EDGE_ZONE && dy1 <= EDGE_ZONE;

  // Corners (must be near both edges)
  if (onT && onL) return 'nw';
  if (onT && onR) return 'ne';
  if (onB && onL) return 'sw';
  if (onB && onR) return 'se';

  // Edges (must be near one edge AND inside the other axis)
  const insideX = dx0 > EDGE_ZONE && dx1 > EDGE_ZONE;
  const insideY = dy0 > EDGE_ZONE && dy1 > EDGE_ZONE;
  if (onT && insideX) return 'n';
  if (onB && insideX) return 's';
  if (onL && insideY) return 'w';
  if (onR && insideY) return 'e';

  return null; // inside element → drag, not resize
}

export function startDragIfSelected(clientX, clientY) {
  if (state.toolMode !== TOOL_MODE_SELECT) return;
  const el = getSelectedObjectElement();
  if (!el) return;

  const point = clientToSlidePoint(clientX, clientY);
  const rect = elementToSlideRect(el);
  if (!rect) return;

  // Outside the selected element (with edge zone margin)?
  const expanded = {
    x: rect.x - EDGE_ZONE, y: rect.y - EDGE_ZONE,
    width: rect.width + EDGE_ZONE * 2, height: rect.height + EDGE_ZONE * 2,
  };
  if (point.x < expanded.x || point.x > expanded.x + expanded.width ||
      point.y < expanded.y || point.y > expanded.y + expanded.height) return;

  // Near edge? Start resize instead of drag
  const handle = detectHandle(point, rect);
  if (handle) {
    startResize(handle, clientX, clientY);
    return;
  }

  const frameWindow = slideIframe.contentWindow;
  const styles = frameWindow?.getComputedStyle ? frameWindow.getComputedStyle(el) : null;
  const origLeft = parseFloat(styles?.left) || 0;
  const origTop = parseFloat(styles?.top) || 0;
  const origPos = styles?.position || 'static';

  _dragState = {
    el,
    startPoint: point,
    origLeft,
    origTop,
    origPos,
    dragging: false,
  };
}

export function moveDrag(clientX, clientY) {
  if (!_dragState) return;
  const point = clientToSlidePoint(clientX, clientY);
  const dx = point.x - _dragState.startPoint.x;
  const dy = point.y - _dragState.startPoint.y;

  if (!_dragState.dragging) {
    if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
    _dragState.dragging = true;
    const drawLayerEl = document.getElementById('draw-layer');
    if (drawLayerEl) drawLayerEl.style.cursor = 'move';
    // Ensure element can be moved
    if (_dragState.origPos === 'static') {
      _dragState.el.style.position = 'relative';
      _dragState.origLeft = 0;
      _dragState.origTop = 0;
    }
  }

  _dragState.el.style.left = `${_dragState.origLeft + dx}px`;
  _dragState.el.style.top = `${_dragState.origTop + dy}px`;
  renderObjectSelection();
}

export function endDrag() {
  if (!_dragState) return;
  const wasDragging = _dragState.dragging;
  _dragState = null;
  if (wasDragging) {
    renderObjectSelection();
    updateObjectEditorControls();
  }
  return wasDragging;
}

export function isDragging() {
  return _dragState?.dragging === true;
}

// --- Resize ---

let _resizeState = null;

export function startResize(handle, clientX, clientY) {
  if (state.toolMode !== TOOL_MODE_SELECT) return;
  const el = getSelectedObjectElement();
  if (!el) return;

  const point = clientToSlidePoint(clientX, clientY);
  const rect = elementToSlideRect(el);
  if (!rect) return;

  const frameWindow = slideIframe.contentWindow;
  const styles = frameWindow?.getComputedStyle ? frameWindow.getComputedStyle(el) : null;

  _resizeState = {
    el,
    handle,
    startPoint: point,
    origRect: { ...rect },
    origWidth: parseFloat(styles?.width) || rect.width,
    origHeight: parseFloat(styles?.height) || rect.height,
    origLeft: parseFloat(styles?.left) || 0,
    origTop: parseFloat(styles?.top) || 0,
    origPos: styles?.position || 'static',
  };
}

export function moveResize(clientX, clientY) {
  if (!_resizeState) return;
  const point = clientToSlidePoint(clientX, clientY);
  const dx = point.x - _resizeState.startPoint.x;
  const dy = point.y - _resizeState.startPoint.y;
  const { el, handle, origWidth, origHeight, origLeft, origTop, origPos } = _resizeState;

  if (origPos === 'static') {
    el.style.position = 'relative';
  }

  let newW = origWidth, newH = origHeight, newL = origLeft, newT = origTop;

  // Horizontal
  if (handle.includes('e')) { newW = Math.max(20, origWidth + dx); }
  if (handle.includes('w')) { newW = Math.max(20, origWidth - dx); newL = origLeft + dx; }

  // Vertical
  if (handle.includes('s')) { newH = Math.max(20, origHeight + dy); }
  if (handle.includes('n')) { newH = Math.max(20, origHeight - dy); newT = origTop + dy; }

  el.style.width = `${newW}px`;
  el.style.height = `${newH}px`;
  if (handle.includes('w') || handle.includes('n')) {
    el.style.left = `${newL}px`;
    el.style.top = `${newT}px`;
  }

  renderObjectSelection();
}

export function endResize() {
  if (!_resizeState) return false;
  _resizeState = null;
  renderObjectSelection();
  updateObjectEditorControls();
  return true;
}

export function isResizing() {
  return _resizeState !== null;
}
