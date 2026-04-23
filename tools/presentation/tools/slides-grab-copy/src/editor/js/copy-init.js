import { copyState } from './copy-state.js';

function populateCheckpointSelect() {
  const select = document.querySelector('#checkpoint-name');
  if (!select) return;
  select.innerHTML = '';

  if (copyState.checkpoints.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '저장된 checkpoint 없음';
    select.appendChild(option);
    copyState.selectedCheckpoint = '';
    return;
  }

  for (const checkpoint of copyState.checkpoints) {
    const option = document.createElement('option');
    option.value = checkpoint.name;
    option.textContent = checkpoint.name;
    select.appendChild(option);
  }

  if (!copyState.checkpoints.some((item) => item.name === copyState.selectedCheckpoint)) {
    copyState.selectedCheckpoint = copyState.checkpoints[0].name;
  }
  select.value = copyState.selectedCheckpoint;
}

function syncCheckpointUi() {
  const restoreButton = document.querySelector('#restore-checkpoint');
  if (restoreButton) {
    restoreButton.disabled = !copyState.selectedCheckpoint;
  }
}

async function refreshCheckpoints({ selectedName = copyState.selectedCheckpoint } = {}) {
  const res = await fetch('/api/checkpoints');
  const json = await res.json();
  copyState.checkpoints = json.checkpoints || [];
  copyState.selectedCheckpoint = selectedName;
  populateCheckpointSelect();
  syncCheckpointUi();
}

function populateTemplateSelect() {
  const select = document.querySelector('#existing-template-name');
  if (!select) return;
  select.innerHTML = '';
  for (const template of copyState.templates) {
    const option = document.createElement('option');
    option.value = template.templateName;
    option.textContent = template.templateName;
    select.appendChild(option);
  }
}

function populateLayoutSuggestions() {
  const datalist = document.querySelector('#layout-name-options');
  if (!datalist) return;
  datalist.innerHTML = '';

  const defaults = ['cover', '목차', 'closing', '본문'];
  const currentTemplate = copyState.templates.find((item) => item.templateName === copyState.templateMeta.templateName);
  const names = new Set([
    ...defaults,
    ...(currentTemplate?.layouts || []),
  ]);

  for (const name of names) {
    const option = document.createElement('option');
    option.value = name;
    datalist.appendChild(option);
  }
}

function syncSaveModeUi() {
  const existingSection = document.querySelector('#existing-template-section');
  const newSection = document.querySelector('#new-template-section');
  const saveButton = document.querySelector('#save-template');
  const status = document.querySelector('#copy-status-message');

  const isExisting = copyState.templateMeta.saveMode === 'existing';
  if (existingSection) existingSection.hidden = !isExisting;
  if (newSection) newSection.hidden = isExisting;

  let hasError = false;
  if (!isExisting) {
    const duplicate = copyState.templates.some((item) => item.templateName === copyState.templateMeta.templateName);
    if (duplicate) {
      hasError = true;
      if (status) status.textContent = '이미 같은 템플릿 이름이 있습니다. 다른 이름을 입력하세요.';
    }
  }

  if (saveButton) {
    saveButton.disabled = hasError || !copyState.templateMeta.templateName || !copyState.templateMeta.layoutName;
  }
}

async function saveCurrentTemplate() {
  const iframe = document.querySelector('#copy-slide-iframe');
  const status = document.querySelector('#copy-status-message');
  const doc = iframe?.contentDocument;
  const html = doc?.documentElement?.outerHTML;
  if (!html) return;

  const res = await fetch('/api/template/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      saveMode: copyState.templateMeta.saveMode,
      templateName: copyState.templateMeta.templateName,
      layoutName: copyState.templateMeta.layoutName,
      html,
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    if (status) status.textContent = json.error || '저장 실패';
    return;
  }
  if (status) status.textContent = `저장 완료: ${json.target}`;
}

async function createCheckpoint() {
  const status = document.querySelector('#copy-status-message');
  const res = await fetch('/api/checkpoints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label: 'manual' }),
  });
  const json = await res.json();
  if (!res.ok) {
    if (status) status.textContent = json.error || 'checkpoint 저장 실패';
    return;
  }
  await refreshCheckpoints({ selectedName: json.checkpoint.name });
  if (status) status.textContent = `Checkpoint 저장 완료: ${json.checkpoint.name}`;
}

async function restoreCheckpoint() {
  const status = document.querySelector('#copy-status-message');
  if (!copyState.selectedCheckpoint) return;
  if (!window.confirm(`선택한 checkpoint(${copyState.selectedCheckpoint})로 복원할까요?`)) {
    return;
  }

  const res = await fetch('/api/checkpoints/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checkpointName: copyState.selectedCheckpoint }),
  });
  const json = await res.json();
  if (!res.ok) {
    if (status) status.textContent = json.error || 'checkpoint 복원 실패';
    return;
  }

  const currentIndex = copyState.slides.indexOf(copyState.currentSlide);
  await refreshCheckpoints({ selectedName: copyState.selectedCheckpoint });
  if (currentIndex >= 0) {
    loadSlide(currentIndex);
  }
  if (status) status.textContent = `Checkpoint 복원 완료: ${json.restored.restoredFrom}`;
}

function scaleSlide() {
  const stage = document.querySelector('#copy-slide-stage');
  const wrapper = document.querySelector('#copy-slide-wrapper');
  if (!stage || !wrapper) return;
  const availW = stage.clientWidth;
  const availH = stage.clientHeight;
  if (availW <= 0 || availH <= 0) return;
  const slideW = 1920;
  const slideH = 1080;
  const scale = Math.min(availW / slideW, availH / slideH, 1);
  const offsetX = (availW - slideW * scale) / 2;
  const offsetY = (availH - slideH * scale) / 2;
  wrapper.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

function syncNav() {
  const total = copyState.slides.length;
  const currentIndex = copyState.currentSlide ? copyState.slides.indexOf(copyState.currentSlide) : -1;
  const filename = document.querySelector('#copy-nav-filename');
  const counter = document.querySelector('#copy-slide-counter');
  const prev = document.querySelector('#copy-btn-prev');
  const next = document.querySelector('#copy-btn-next');
  if (filename) filename.textContent = copyState.currentSlide || '';
  if (counter) counter.textContent = total ? `${currentIndex + 1} / ${total}` : '0 / 0';
  if (prev) prev.disabled = currentIndex <= 0;
  if (next) next.disabled = currentIndex < 0 || currentIndex >= total - 1;
}

function loadSlide(index) {
  copyState.currentSlide = copyState.slides[index] || null;
  const iframe = document.querySelector('#copy-slide-iframe');
  if (copyState.currentSlide && iframe) {
    iframe.src = `/slides/${copyState.currentSlide}?t=${Date.now()}`;
  }
  syncNav();
}

async function init() {
  const [sessionRes, slidesRes, templatesRes, templateMetaRes, checkpointsRes] = await Promise.all([
    fetch('/api/session'),
    fetch('/api/slides'),
    fetch('/api/templates'),
    fetch('/api/template-meta'),
    fetch('/api/checkpoints'),
  ]);
  copyState.session = await sessionRes.json();
  copyState.slides = await slidesRes.json();
  copyState.templates = (await templatesRes.json()).templates || [];
  copyState.templateMeta = await templateMetaRes.json();
  copyState.checkpoints = (await checkpointsRes.json()).checkpoints || [];

  const sessionId = document.querySelector('#copy-session-id');
  const sessionRoot = document.querySelector('#copy-session-root');
  const status = document.querySelector('#copy-status-message');
  if (sessionId) sessionId.textContent = `Session: ${copyState.session.sessionId}`;
  if (sessionRoot) sessionRoot.textContent = `Root: ${copyState.session.sessionRoot}`;

  populateTemplateSelect();

  const existingTemplateSelect = document.querySelector('#existing-template-name');
  const newTemplateInput = document.querySelector('#new-template-name');
  const layoutNameInput = document.querySelector('#layout-name');
  const saveModeExisting = document.querySelector('#save-mode-existing');
  const saveModeNew = document.querySelector('#save-mode-new');
  const saveButton = document.querySelector('#save-template');
  const checkpointSelect = document.querySelector('#checkpoint-name');
  const createCheckpointButton = document.querySelector('#create-checkpoint');
  const restoreCheckpointButton = document.querySelector('#restore-checkpoint');

  if (copyState.templates.length > 0) {
    copyState.templateMeta.templateName = copyState.templates[0].templateName;
  } else {
    copyState.templateMeta.saveMode = 'new';
  }

  if (existingTemplateSelect) {
    existingTemplateSelect.value = copyState.templateMeta.templateName || '';
    existingTemplateSelect.addEventListener('change', (event) => {
      copyState.templateMeta.templateName = event.target.value;
      populateLayoutSuggestions();
      syncSaveModeUi();
    });
  }

  if (newTemplateInput) {
    newTemplateInput.addEventListener('input', (event) => {
      copyState.templateMeta.templateName = event.target.value.trim();
      syncSaveModeUi();
    });
  }

  if (layoutNameInput) {
    layoutNameInput.addEventListener('input', (event) => {
      copyState.templateMeta.layoutName = event.target.value.trim();
      syncSaveModeUi();
    });
  }

  if (saveModeExisting) {
    saveModeExisting.addEventListener('change', () => {
      copyState.templateMeta.saveMode = 'existing';
      copyState.templateMeta.templateName = existingTemplateSelect?.value || copyState.templateMeta.templateName;
      populateLayoutSuggestions();
      syncSaveModeUi();
    });
  }

  if (saveModeNew) {
    saveModeNew.addEventListener('change', () => {
      copyState.templateMeta.saveMode = 'new';
      copyState.templateMeta.templateName = newTemplateInput?.value.trim() || '';
      populateLayoutSuggestions();
      syncSaveModeUi();
    });
  }

  populateLayoutSuggestions();
  syncSaveModeUi();
  populateCheckpointSelect();
  syncCheckpointUi();
  saveButton?.addEventListener('click', () => {
    void saveCurrentTemplate();
  });
  checkpointSelect?.addEventListener('change', (event) => {
    copyState.selectedCheckpoint = event.target.value;
    syncCheckpointUi();
  });
  createCheckpointButton?.addEventListener('click', () => {
    void createCheckpoint();
  });
  restoreCheckpointButton?.addEventListener('click', () => {
    void restoreCheckpoint();
  });

  document.querySelector('#copy-btn-prev')?.addEventListener('click', () => {
    const currentIndex = copyState.slides.indexOf(copyState.currentSlide);
    if (currentIndex > 0) loadSlide(currentIndex - 1);
  });

  document.querySelector('#copy-btn-next')?.addEventListener('click', () => {
    const currentIndex = copyState.slides.indexOf(copyState.currentSlide);
    if (currentIndex < copyState.slides.length - 1) loadSlide(currentIndex + 1);
  });

  const iframe = document.querySelector('#copy-slide-iframe');
  iframe?.addEventListener('load', () => {
    scaleSlide();
    if (status && !saveButton?.disabled) status.textContent = copyState.currentSlide ? `Loaded ${copyState.currentSlide}` : 'No slides found.';
  });

  if (copyState.slides.length > 0) {
    loadSlide(0);
  } else if (status) {
    status.textContent = 'No slides found.';
  }

  window.addEventListener('resize', scaleSlide);
}

void init();
