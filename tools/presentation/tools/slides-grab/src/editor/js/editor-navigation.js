// editor-navigation.js — Slide navigation (goToSlide, persistDraft)

import { state } from './editor-state.js';
import { slideIframe, slideCounter, btnPrev, btnNext, navFilename } from './editor-dom.js';
import { currentSlideFile, setStatus } from './editor-utils.js';
import { renderObjectSelection, updateObjectEditorControls } from './editor-select.js';
import { flushDirectSaveForSlide } from './editor-direct-edit.js';
import { syncNavigationUi } from '../../../../slides-grab-core/src/client/core-navigation.js';

export async function goToSlide(index) {
  if (index < 0 || index >= state.slides.length) return;

  const previousSlide = currentSlideFile();
  if (previousSlide) {
    await flushDirectSaveForSlide(previousSlide);
  }

  state.currentIndex = index;
  const slide = currentSlideFile();
  syncNavigationUi({ state, currentSlideFile, slideIframe, slideCounter, navFilename, btnPrev, btnNext });

  state.hoveredObjectXPath = '';
  renderObjectSelection();
  updateObjectEditorControls();
  setStatus(`Loaded ${slide}`);
}
