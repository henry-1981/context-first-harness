export async function fetchSlidesOrThrow() {
  const res = await fetch('/api/slides');
  if (!res.ok) {
    throw new Error(`Failed to fetch slide list: ${res.status}`);
  }
  return res.json();
}

export function attachFileChangedListener({ currentSlideFile, slideIframe, localFileUpdateBySlide }) {
  const evtSource = new EventSource('/api/events');
  evtSource.addEventListener('fileChanged', (event) => {
    try {
      const { file } = JSON.parse(event.data);
      if (file === currentSlideFile()) {
        const updatedAt = localFileUpdateBySlide.get(file);
        if (updatedAt && Date.now() - updatedAt < 2000) {
          localFileUpdateBySlide.delete(file);
          return;
        }
        const base = slideIframe.src.split('?')[0];
        slideIframe.src = `${base}?t=${Date.now()}`;
      }
    } catch (error) {
      console.error('fileChanged parse error:', error);
    }
  });
  return evtSource;
}
