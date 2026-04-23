// editor-init.js — Entry point: imports, event bindings, init()

import { state, TOOL_MODE_SELECT, localFileUpdateBySlide, SEL_ELEMENT, SEL_SLIDE_WHOLE } from './editor-state.js';
import {
  btnPrev, btnNext, slideIframe, drawLayer, slideCounter,
  toggleBold, toggleItalic, toggleUnderline, toggleStrike,
  alignLeft, alignCenter, alignRight,
  popoverTextInput, popoverApplyText, popoverTextColorInput, popoverBgColorInput,
  popoverSizeInput,
  btnUndo, btnRedo,
} from './editor-dom.js';
import {
  currentSlideFile, getSlideState, setStatus, clamp,
} from './editor-utils.js';
import { scaleSlide, getXPath } from './editor-geometry.js';
import {
  updateToolModeUI, renderObjectSelection, updateObjectEditorControls,
  getSelectedObjectElement, setSelectedObjectXPath, updateHoveredObjectFromPointer,
  clearHoveredObject, getSelectableTargetAt, readSelectedObjectStyleState, isSyncing,
  startDragIfSelected, moveDrag, endDrag, isDragging,
  moveResize, endResize, isResizing,
  setSlideWholeSelection, clearSelection, getSelectionType,
} from './editor-select.js';
import {
  mutateSelectedObject, applyTextDecorationToken, scheduleDirectSave,
  enableInlineEditOnDblClick, bindExecCommandButtons,
} from './editor-direct-edit.js';
import { goToSlide } from './editor-navigation.js';
import {
  captureSnapshot, canUndo, canRedo, getUndoEntry, getRedoEntry,
  setRestoring, isRestoring,
} from './editor-history.js';
import { initAiEdit, focusAiEdit } from './editor-ai-edit.js';
import { attachFileChangedListener, fetchSlidesOrThrow } from '../../../../slides-grab-core/src/client/core-init.js';

// --- Undo / Redo ---

export function updateUndoRedoButtons() {
  btnUndo.disabled = !canUndo();
  btnRedo.disabled = !canRedo();
}

let _restoreLock = false;

async function restoreEntry(entry) {
  if (!entry || _restoreLock) return;
  _restoreLock = true;
  setRestoring(true);
  try {
    // Navigate to the correct slide if needed
    if (entry.slideIndex !== state.currentIndex) {
      await goToSlide(entry.slideIndex);
      // Wait for iframe to load before writing HTML
      await new Promise((resolve) => {
        const onLoad = () => { slideIframe.removeEventListener('load', onLoad); resolve(); };
        slideIframe.addEventListener('load', onLoad);
      });
    }
    // Write snapshot HTML into iframe
    const doc = slideIframe.contentDocument;
    doc.open();
    doc.write(entry.html);
    doc.close();
    // Re-sync selection and controls
    renderObjectSelection();
    updateObjectEditorControls();
    // Save restored state to disk
    scheduleDirectSave(0, 'Undo/Redo applied.');
  } finally {
    // Delay clearing restore flag so any pending iframe load events
    // fire while the guard is still active
    await new Promise((r) => setTimeout(r, 0));
    setRestoring(false);
    _restoreLock = false;
    updateUndoRedoButtons();
  }
}

function performUndo() {
  const entry = getUndoEntry();
  if (entry) void restoreEntry(entry);
}

function performRedo() {
  const entry = getRedoEntry();
  if (entry) void restoreEntry(entry);
}

btnUndo.addEventListener('click', performUndo);
btnRedo.addEventListener('click', performRedo);

// Sync button state when history changes (avoids circular dependency)
window.addEventListener('historyChanged', updateUndoRedoButtons);

// Navigation
btnPrev.addEventListener('click', () => { void goToSlide(state.currentIndex - 1); });
btnNext.addEventListener('click', () => { void goToSlide(state.currentIndex + 1); });

// Select drag
drawLayer.addEventListener('mousedown', (event) => {
  if (state.toolMode === TOOL_MODE_SELECT) {
    startDragIfSelected(event.clientX, event.clientY);
  }
});
drawLayer.addEventListener('mousemove', (event) => {
  if (state.toolMode !== TOOL_MODE_SELECT) return;
  if (isDragging()) return; // hover 업데이트 중지
  updateHoveredObjectFromPointer(event.clientX, event.clientY);
});
drawLayer.addEventListener('mouseleave', clearHoveredObject);
drawLayer.addEventListener('click', (event) => {
  if (state.toolMode !== TOOL_MODE_SELECT) return;
  if (isDragging()) return; // 드래그 중 click 무시
  const target = getSelectableTargetAt(event.clientX, event.clientY);
  if (!target) {
    setSlideWholeSelection('Whole slide selected.');
    return;
  }

  const xpath = getXPath(target);
  setSelectedObjectXPath(xpath, `Object selected on ${currentSlideFile()}.`);
});
window.addEventListener('mousemove', (event) => {
  if (isResizing()) { moveResize(event.clientX, event.clientY); return; }
  moveDrag(event.clientX, event.clientY);
});
window.addEventListener('mouseup', () => {
  if (endResize()) {
    scheduleDirectSave(0, 'Object resized and saved.');
    captureSnapshot();
    return;
  }
  const wasDrag = endDrag();
  if (wasDrag) {
    scheduleDirectSave(0, 'Object moved and saved.');
    captureSnapshot();
  }
});

// Text editing
popoverApplyText.addEventListener('click', () => {
  if (popoverApplyText.disabled) return;
  mutateSelectedObject((el) => {
    const escaped = popoverTextInput.value
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    el.innerHTML = escaped.replace(/\n/g, '<br>');
  }, 'Object text updated and saved.', { delay: 120 });
});

function applySize() {
  if (popoverSizeInput.disabled) return;
  const size = clamp(Number.parseInt(popoverSizeInput.value || '24', 10) || 24, 8, 180);
  mutateSelectedObject((el) => {
    el.style.fontSize = `${size}px`;
  }, 'Object font size updated and saved.');
}

popoverSizeInput.addEventListener('change', applySize);

popoverTextInput.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    event.stopPropagation();
    popoverApplyText.click();
  }
});

popoverSizeInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    event.stopPropagation();
    applySize();
  }
});

popoverTextColorInput.addEventListener('input', () => {
  if (popoverTextColorInput.disabled || isSyncing()) return;
  mutateSelectedObject((el) => {
    el.style.color = popoverTextColorInput.value;
  }, 'Text color updated.', { delay: 300 });
});

popoverBgColorInput.addEventListener('input', () => {
  if (popoverBgColorInput.disabled || isSyncing()) return;
  mutateSelectedObject((el) => {
    el.style.backgroundColor = popoverBgColorInput.value;
  }, 'Background color updated.', { delay: 300 });
});

// Style toggles
toggleBold.addEventListener('click', () => {
  mutateSelectedObject((el) => {
    const nextBold = !readSelectedObjectStyleState(el).bold;
    el.style.fontWeight = nextBold ? '700' : '400';
  }, 'Object font weight updated and saved.');
});

toggleItalic.addEventListener('click', () => {
  mutateSelectedObject((el) => {
    const nextItalic = !readSelectedObjectStyleState(el).italic;
    el.style.fontStyle = nextItalic ? 'italic' : 'normal';
  }, 'Object font style updated and saved.');
});

toggleUnderline.addEventListener('click', () => {
  mutateSelectedObject((el) => {
    const nextUnderline = !readSelectedObjectStyleState(el).underline;
    applyTextDecorationToken(el, 'underline', nextUnderline);
  }, 'Object underline updated and saved.');
});

toggleStrike.addEventListener('click', () => {
  mutateSelectedObject((el) => {
    const nextStrike = !readSelectedObjectStyleState(el).strike;
    applyTextDecorationToken(el, 'line-through', nextStrike);
  }, 'Object strikethrough updated and saved.');
});

// Alignment
alignLeft.addEventListener('click', () => {
  mutateSelectedObject((el) => {
    el.style.textAlign = 'left';
  }, 'Object alignment updated and saved.');
});

alignCenter.addEventListener('click', () => {
  mutateSelectedObject((el) => {
    el.style.textAlign = 'center';
  }, 'Object alignment updated and saved.');
});

alignRight.addEventListener('click', () => {
  mutateSelectedObject((el) => {
    el.style.textAlign = 'right';
  }, 'Object alignment updated and saved.');
});

// Global keyboard
document.addEventListener('keydown', (event) => {
  // Undo / Redo (always active, regardless of tool mode)
  if ((event.ctrlKey || event.metaKey) && !event.altKey) {
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      performUndo();
      return;
    }
    if (key === 'z' && event.shiftKey) {
      event.preventDefault();
      performRedo();
      return;
    }
  }

  if (state.toolMode === TOOL_MODE_SELECT && (event.ctrlKey || event.metaKey)) {
    const key = event.key.toLowerCase();
    if (key === 'b') { event.preventDefault(); if (!toggleBold.disabled) toggleBold.click(); return; }
    if (key === 'i') { event.preventDefault(); if (!toggleItalic.disabled) toggleItalic.click(); return; }
    if (key === 'u') { event.preventDefault(); if (!toggleUnderline.disabled) toggleUnderline.click(); return; }
  }

  if (event.key === 'Escape') {
    const slide = currentSlideFile();
    if (slide) {
      const selType = getSelectionType(slide);
      if (selType === SEL_ELEMENT) {
        setSlideWholeSelection('Whole slide selected.');
        return;
      }
      if (selType === SEL_SLIDE_WHOLE) {
        clearSelection('Selection cleared.');
        return;
      }
    }
    if (document.activeElement) document.activeElement.blur();
    return;
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    void goToSlide(state.currentIndex - 1);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    void goToSlide(state.currentIndex + 1);
  }

  // Global printable key → AI Edit focus
  if (
    event.key.length === 1 &&
    !event.ctrlKey && !event.metaKey && !event.altKey &&
    !(document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.isContentEditable))
  ) {
    const slide = currentSlideFile();
    if (slide) {
      const selType = getSelectionType(slide);
      if (selType === SEL_ELEMENT || selType === SEL_SLIDE_WHOLE) {
        event.preventDefault();
        // Delay focus to next frame so IME composition starts fresh on the input
        requestAnimationFrame(() => focusAiEdit());
      }
    }
  }
});

// Resize
window.addEventListener('resize', scaleSlide);

// Iframe load
slideIframe.addEventListener('load', () => {
  const slide = currentSlideFile();
  if (slide) {
    const ss = getSlideState(slide);
    if (ss.selectedObjectXPath && !getSelectedObjectElement(slide)) {
      ss.selectedObjectXPath = '';
    }
  }
  state.hoveredObjectXPath = '';
  renderObjectSelection();
  updateObjectEditorControls();
  // Layer 1: activate inline contenteditable editing on the loaded slide
  enableInlineEditOnDblClick(slideIframe);
  bindExecCommandButtons(slideIframe);
  // Capture baseline snapshot for undo history (skip if restoring)
  if (!isRestoring()) {
    captureSnapshot();
  }
});


// Init
async function init() {
  setStatus('Loading slide list...');

  try {
    state.slides = await fetchSlidesOrThrow();

    if (state.slides.length === 0) {
      setStatus('No slides found.');
      slideCounter.textContent = '0 / 0';
      return;
    }

    updateToolModeUI();
    await goToSlide(0);
    scaleSlide();

    // Listen for external file changes
    attachFileChangedListener({ currentSlideFile, slideIframe, localFileUpdateBySlide });

    initAiEdit();
    setStatus('Ready.');
  } catch (error) {
    setStatus(`Error loading slides: ${error.message}`);
    console.error('Init error:', error);
  }
}

init();
