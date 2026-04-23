// editor-state.js — State variables, constants, Maps/Sets

export const SLIDE_W = 1920;
export const SLIDE_H = 1080;
export const TOOL_MODE_SELECT = 'select';
export const SEL_ELEMENT = 'element';
export const SEL_SLIDE_WHOLE = 'slide-whole';
export const POPOVER_TEXT = 'text';
export const POPOVER_TEXT_COLOR = 'text-color';
export const POPOVER_BG_COLOR = 'bg-color';
export const POPOVER_SIZE = 'size';
export const NON_SELECTABLE_TAGS = new Set(['html', 'head', 'body', 'script', 'style', 'link', 'meta', 'noscript']);

export const slideStates = new Map();
export const directSaveStateBySlide = new Map();
export const localFileUpdateBySlide = new Map();

export const state = {
  slides: [],
  currentIndex: 0,
  toolMode: TOOL_MODE_SELECT,
  hoveredObjectXPath: '',
};
