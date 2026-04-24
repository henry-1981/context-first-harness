export function syncNavigationUi({ state, currentSlideFile, slideIframe, slideCounter, navFilename, btnPrev, btnNext }) {
  const slide = currentSlideFile();
  slideIframe.src = `/slides/${slide}?t=${Date.now()}`;
  slideCounter.textContent = `${state.currentIndex + 1} / ${state.slides.length}`;
  navFilename.textContent = slide;
  btnPrev.disabled = state.currentIndex === 0;
  btnNext.disabled = state.currentIndex === state.slides.length - 1;
}
