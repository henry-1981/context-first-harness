import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ParsedSlide {
  slideNumber: number;
  title: string;
  takeaway: string;
  layoutIntent: string;
  rawContent: string;
}

export interface ParsedOutline {
  archetype: string;
  slideCount: number;
  slides: ParsedSlide[];
}

export const SKELETON_IDS = [
  'title-only',
  'title-bullets',
  'kpi-highlight',
  'table',
  'card-grid-2',
  'card-grid-3',
  'card-grid-4plus',
  'process-flow',
  'composite-kpi-table',
  'composite-kpi-bullets',
  'composite-cards-footer',
] as const;

export type SkeletonId = (typeof SKELETON_IDS)[number];

export interface SlotSpec {
  name: string;
}

export interface ContentPatternSuggestion {
  slotName: string;
  patternId: string;
  patternHtml: string;
}

export interface ResolvedSlide {
  slideNumber: number;
  skeletonId: SkeletonId;
  skeletonHtml: string;
  slots: SlotSpec[];
  parsedSlide: ParsedSlide;
  suggestedContentPatterns: ContentPatternSuggestion[];
}

// ---------------------------------------------------------------------------
// Task 3: parseOutline
// ---------------------------------------------------------------------------

export function parseOutline(markdown: string): ParsedOutline {
  const lines = markdown.split('\n');

  // Parse header fields
  let archetype = '';
  let slideCount = 0;

  for (const line of lines) {
    const archetypeMatch = line.match(/^ARCHETYPE:\s*(.+)$/);
    if (archetypeMatch) {
      archetype = archetypeMatch[1].trim();
    }
    const slidesMatch = line.match(/^SLIDES:\s*(\d+)$/);
    if (slidesMatch) {
      slideCount = parseInt(slidesMatch[1], 10);
    }
  }

  // Split into slide blocks by "## Slide N:" headings
  const slideBlockRegex = /^##\s+Slide\s+(\d+):\s*(.+)$/m;
  const parts = markdown.split(/^(?=##\s+Slide\s+\d+:)/m);

  const slides: ParsedSlide[] = [];

  for (const part of parts) {
    const headerMatch = part.match(/^##\s+Slide\s+(\d+):\s*(.+)$/m);
    if (!headerMatch) continue;

    const slideNumber = parseInt(headerMatch[1], 10);
    const title = headerMatch[2].trim();

    // Extract takeaway (🔒 line)
    const takeawayMatch = part.match(/🔒\s+\*\*takeaway\*\*:\s*(.+)$/m);
    const takeaway = takeawayMatch ? takeawayMatch[1].trim() : '';

    // Extract layout_intent (💡 line)
    const intentMatch = part.match(/💡\s+\*\*layout_intent\*\*:\s*(.+)$/m);
    const layoutIntent = intentMatch ? intentMatch[1].trim() : '';

    // rawContent = entire slide block text
    const rawContent = part.trim();

    slides.push({ slideNumber, title, takeaway, layoutIntent, rawContent });
  }

  // Sort by slide number (blocks may not be ordered)
  slides.sort((a, b) => a.slideNumber - b.slideNumber);

  return { archetype, slideCount, slides };
}

// ---------------------------------------------------------------------------
// Task 4: resolveSkeletonId
// ---------------------------------------------------------------------------

export function resolveSkeletonId(layoutIntent: string): SkeletonId {
  const s = layoutIntent.toLowerCase();

  // Rule 1: title-only — 표지, section divider, 구분, 인트로, outro
  if (/표지|section divider|구분|인트로|outro/.test(s)) {
    return 'title-only';
  }

  // Rule 2: process-flow — 프로세스, 흐름, 단계별, flow, step, timeline
  if (/프로세스|흐름|단계별|flow|step|timeline/.test(s)) {
    return 'process-flow';
  }

  // Rule 3: composite-kpi-table — KPI+표, KPI+table, 숫자+표, 강조+표
  if (/kpi.*(표|table)|숫자.*표|강조.*표/.test(s)) {
    return 'composite-kpi-table';
  }

  // Rule 4: composite-kpi-bullets — KPI+설명, KPI+불릿, 숫자+설명
  if (/kpi.*(설명|불릿)|숫자.*설명/.test(s)) {
    return 'composite-kpi-bullets';
  }

  // Rule 6: kpi-highlight — KPI, 핵심 수치, 숫자 강조, 임팩트
  if (/kpi|핵심 수치|숫자 강조|임팩트/.test(s)) {
    return 'kpi-highlight';
  }

  // Rule 7: table — 테이블, 표 (with space/end), 비교표, 매트릭스, matrix
  if (/테이블|표 |표$|비교표|매트릭스|matrix/.test(s)) {
    return 'table';
  }

  // Rule 8: card-grid-2 — 2개, 두 개, 2항목, 양자, vs, 대비
  if (/2개|두 개|2항목|양자|\bvs\b|대비/.test(s)) {
    return 'card-grid-2';
  }

  // Rule 9: card-grid-3 — 3개, 세 개, 3항목, 3카드
  if (/3개|세 개|3항목|3카드/.test(s)) {
    return 'card-grid-3';
  }

  // Rule 10: card-grid-4plus — 4-9개, 4-9항목, 4-9카드, 다수, 여러
  if (/[4-9]개|[4-9]항목|[4-9]카드|다수|여러/.test(s)) {
    return 'card-grid-4plus';
  }

  // Rule 5 (moved after count rules): composite-cards-footer — 카드+요약, 카드+결론, 카드+footer
  if (/카드.*(요약|결론|footer)/.test(s)) {
    return 'composite-cards-footer';
  }

  // Fallback
  return 'title-bullets';
}

// ---------------------------------------------------------------------------
// Content Pattern System
// ---------------------------------------------------------------------------

export function loadContentPattern(id: string, patternsDir: string): string | null {
  const filePath = resolve(patternsDir, `${id}.html`);
  if (existsSync(filePath)) {
    return readFileSync(filePath, 'utf8');
  }
  return null;
}

const CONTENT_SLOT_PREFIXES = ['card-', 'kpi-', 'step-'];

function isContentSlot(slotName: string): boolean {
  return CONTENT_SLOT_PREFIXES.some(prefix => slotName.startsWith(prefix));
}

function resolveContentPatternId(slotName: string, rawContent: string): string {
  if (slotName.startsWith('kpi-')) return 'kpi-number';
  if (slotName.startsWith('step-')) return 'step-item';
  const lower = rawContent.toLowerCase();
  if (/불릿|bullet|리스트|list|항목/.test(lower)) return 'badge-title-list';
  if (slotName.startsWith('card-')) return 'icon-title-desc';
  return 'icon-title-desc';
}

export function suggestContentPatterns(
  slots: SlotSpec[],
  rawContent: string,
  patternsDir: string
): ContentPatternSuggestion[] {
  return slots
    .filter(slot => isContentSlot(slot.name))
    .map(slot => {
      const patternId = resolveContentPatternId(slot.name, rawContent);
      const patternHtml = loadContentPattern(patternId, patternsDir);
      return {
        slotName: slot.name,
        patternId,
        patternHtml: patternHtml ?? '',
      };
    })
    .filter(s => s.patternHtml !== '');
}

// ---------------------------------------------------------------------------
// Task 5: resolveLayout helpers
// ---------------------------------------------------------------------------

function loadSkeleton(id: SkeletonId, dir: string): string {
  const filePath = resolve(dir, `${id}.html`);
  if (existsSync(filePath)) {
    return readFileSync(filePath, 'utf8');
  }
  // Fallback to title-bullets
  const fallbackPath = resolve(dir, 'title-bullets.html');
  return readFileSync(fallbackPath, 'utf8');
}

function extractSlots(html: string): SlotSpec[] {
  // Match <!-- SLOT: name --> but NOT <!-- SLOTS: ... --> (plural header)
  const slotRegex = /<!--\s*SLOT:\s*([\w-]+)\s*-->/g;
  const slots: SlotSpec[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = slotRegex.exec(html)) !== null) {
    const name = match[1].trim();
    if (!seen.has(name)) {
      seen.add(name);
      slots.push({ name });
    }
  }

  return slots;
}

// ---------------------------------------------------------------------------
// Task 5: resolveLayout
// ---------------------------------------------------------------------------

export function resolveLayout(
  outlineMarkdown: string,
  skeletonsDir: string,
  contentPatternsDir?: string,
): ResolvedSlide[] {
  const patternsDir = contentPatternsDir ?? resolve(skeletonsDir, '../content-patterns');
  const patternsAvailable = existsSync(patternsDir);
  const { slides } = parseOutline(outlineMarkdown);

  return slides.map((parsedSlide) => {
    const skeletonId = resolveSkeletonId(parsedSlide.layoutIntent);
    const skeletonHtml = loadSkeleton(skeletonId, skeletonsDir);
    const slots = extractSlots(skeletonHtml);
    const suggestedContentPatterns = patternsAvailable && contentPatternsDir
      ? suggestContentPatterns(slots, parsedSlide.rawContent, patternsDir)
      : [];

    return {
      slideNumber: parsedSlide.slideNumber,
      skeletonId,
      skeletonHtml,
      slots,
      parsedSlide,
      suggestedContentPatterns,
    };
  });
}
