const $ = (sel) => document.querySelector(sel);

export const btnUndo = $('#btn-undo');
export const btnRedo = $('#btn-redo');

export const btnPrev = $('#btn-prev');
export const btnNext = $('#btn-next');
export const slideCounter = $('#slide-counter');
export const navFilename = $('#nav-filename');

export const slideIframe = $('#slide-iframe');
export const slidePanel = $('#slide-panel');
export const slideStage = $('#slide-stage');
export const slideWrapper = $('#slide-wrapper');
export const objectLayer = $('#object-layer');
export const objectHoverBox = $('#object-hover-box');
export const objectSelectedBox = $('#object-selected-box');
export const resizeHandles = objectSelectedBox ? objectSelectedBox.querySelectorAll('.resize-handle') : [];
export const drawLayer = $('#draw-layer');
export const toolModeSelectBtn = $('#tool-mode-select');
export const selectToolbar = $('#select-toolbar');

export const toggleBold = $('#toggle-bold');
export const toggleItalic = $('#toggle-italic');
export const toggleUnderline = $('#toggle-underline');
export const toggleStrike = $('#toggle-strike');
export const alignLeft = $('#align-left');
export const alignCenter = $('#align-center');
export const alignRight = $('#align-right');
export const popoverTextInput = $('#popover-text-input');
export const popoverApplyText = $('#popover-apply-text');
export const popoverTextColorInput = $('#popover-text-color-input');
export const popoverBgColorInput = $('#popover-bg-color-input');
export const popoverSizeInput = $('#popover-size-input');

export const editorHint = $('#editor-hint');
export const statusMsg = $('#status-message');
export const slideWholeBrackets = $('#slide-whole-brackets');
export const slideWholeLabel = $('#slide-whole-label');
export const floatingAiInput = $('#floating-ai-input');
export const floatingAiInputLabel = $('#floating-ai-input-label');
export const floatingAiInputField = $('#floating-ai-input-field');
export const aiEditHint = $('#ai-edit-hint');
export const btnAiEditCopyAll = $('#btn-ai-edit-copy-all');
export const aiEditBadge = $('#ai-edit-badge');
export const aiEditStatus = $('#ai-edit-status');
export const aiEditQueue = $('#ai-edit-queue');
export const btnAiEditClear = $('#btn-ai-edit-clear');
