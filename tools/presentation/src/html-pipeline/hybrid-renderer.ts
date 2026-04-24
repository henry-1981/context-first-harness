/**
 * HybridRenderer - Screenshot background + text overlay for editable PPTX
 *
 * Combines Playwright screenshot (preserves CSS gradients, glow, etc.)
 * with DOM text extraction (enables text editing in PowerPoint).
 */

import { type Browser, type Page } from 'playwright';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PptxPresentation = any;

// Constants used inside page.evaluate are redeclared there (no closure access)

// ── Types ──────────────────────────────────────────────────────────────

export interface TextOverlay {
  text: string;
  x: number; // inches
  y: number;
  w: number;
  h: number;
  fontSize: number; // points
  fontFamily: string;
  color: string; // hex without #
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  valign: 'top' | 'middle' | 'bottom';
  margin: [number, number, number, number]; // [T, R, B, L] in inches — CSS padding mapped to PPTX inset
}

export interface HybridResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  slide: any;
  textOverlays: TextOverlay[];
  errors: string[];
}

export interface HybridRendererOptions {
  browser: Browser;
  screenshotOnly?: boolean; // skip text extraction
  widthBuffer?: number; // default 1.05, range 1.0-1.5
}

// ── Text Extraction (runs in browser context) ──────────────────────────

async function extractTextOverlays(page: Page, widthBuffer: number = 1.05): Promise<TextOverlay[]> {
  return await page.evaluate((WIDTH_BUFFER_ARG) => {
    const PX_PER_IN = 96;
    const PT_PER_PX = 0.75;

    // Standard PPTX 16:9 dimensions (inches)
    const PPTX_W = 10;
    const PPTX_H = 5.625;

    // Viewport is 1920x1080 → 20x11.25 inches at 96dpi
    // Scale factor to fit into 10x5.625 PPTX layout
    const CONTENT_W_IN = 1920 / PX_PER_IN; // 20
    const CONTENT_H_IN = 1080 / PX_PER_IN; // 11.25
    const SCALE = Math.min(PPTX_W / CONTENT_W_IN, PPTX_H / CONTENT_H_IN); // 0.5

    const pxToInch = (px: number): number => (px / PX_PER_IN) * SCALE;
    const pxToPt = (pxStr: string): number => parseFloat(pxStr) * PT_PER_PX * SCALE;

    // Detect cumulative CSS transform scale for an element
    // getBoundingClientRect() returns post-transform coords, but
    // getComputedStyle().fontSize returns pre-transform values.
    // We need the transform scale to correct font sizes.
    const getCssScale = (el: Element): number => {
      let scale = 1;
      let current: Element | null = el;
      while (current && current !== document.documentElement) {
        const transform = window.getComputedStyle(current).transform;
        if (transform && transform !== 'none') {
          // matrix(a, b, c, d, tx, ty) — scale is sqrt(a² + b²)
          const match = transform.match(/matrix\(([^,]+),\s*([^,]+)/);
          if (match) {
            const a = parseFloat(match[1]);
            const b = parseFloat(match[2]);
            scale *= Math.sqrt(a * a + b * b);
          }
        }
        current = current.parentElement;
      }
      return scale;
    };

    const rgbToHex = (rgbStr: string): string => {
      if (rgbStr === 'rgba(0, 0, 0, 0)' || rgbStr === 'transparent') return 'FFFFFF';
      const match = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match) return 'FFFFFF';
      return match.slice(1).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
    };

    const overlays: TextOverlay[] = [];
    const processed = new Set<Element>();

    // Tags to skip entirely during walk
    const SKIP_TAGS = new Set(['HTML', 'HEAD', 'BODY', 'SCRIPT', 'STYLE', 'META', 'LINK', 'HR', 'IMG', 'SVG', 'CANVAS', 'VIDEO', 'AUDIO', 'IFRAME']);
    // Inline formatting tags — treated as part of parent text, not separate elements
    const INLINE_TAGS = new Set(['SPAN', 'STRONG', 'EM', 'B', 'I', 'U', 'A', 'MARK', 'SUB', 'SUP', 'SMALL', 'CODE', 'BR']);

    // Detect styled badge spans (has visible background color)
    const isBadgeSpan = (el: Element): boolean => {
      const cs = window.getComputedStyle(el);
      const bg = cs.backgroundColor;
      if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return false;
      return true;
    };

    // Extract text content preserving <br> as newlines, excluding badge spans
    const getTextWithBreaks = (el: Element): string => {
      let result = '';
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          result += node.textContent || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const elem = node as Element;
          if (elem.tagName === 'BR') {
            result += '\n';
          } else if (INLINE_TAGS.has(elem.tagName) && isBadgeSpan(elem)) {
            // Skip badge spans — they stay in screenshot only
            continue;
          } else {
            result += getTextWithBreaks(elem);
          }
        }
      }
      return result;
    };

    // Element is a "text block" if it has text and all its text-bearing children are inline
    // NOTE: Use arrow functions to avoid tsx/esbuild __name wrapper in page.evaluate
    const isTextBlock = (el: Element): boolean => {
      if (SKIP_TAGS.has(el.tagName)) return false;

      const text = el.textContent?.trim();
      if (!text) return false;

      // Check children: if any child has text AND is either
      // (a) a non-inline tag, OR (b) an inline tag with display:block
      // then this element is NOT a leaf text block — recurse deeper
      for (const child of el.children) {
        if (SKIP_TAGS.has(child.tagName)) continue;
        const childText = child.textContent?.trim();
        if (!childText || childText.length === 0) continue;

        if (!INLINE_TAGS.has(child.tagName)) return false;

        // Badge spans are excluded from text extraction — skip display check
        if (isBadgeSpan(child)) continue;

        // Inline tag but rendered as block → treat as separate block
        const childDisplay = window.getComputedStyle(child).display;
        if (childDisplay === 'block' || childDisplay === 'flex' || childDisplay === 'grid') {
          return false;
        }
      }

      return true;
    };

    const walk = (el: Element): void => {
      if (SKIP_TAGS.has(el.tagName)) return;
      if (processed.has(el)) return;

      const computed = window.getComputedStyle(el);
      if (computed.display === 'none' || computed.visibility === 'hidden') return;
      if (computed.opacity === '0') return;
      // Skip badge spans entirely — their text stays in screenshot only
      if (INLINE_TAGS.has(el.tagName) && isBadgeSpan(el)) return;

      if (isTextBlock(el)) {
        processed.add(el);

        // Skip gradient text — kept in screenshot, not editable in PPTX
        const bgClip = computed.webkitBackgroundClip || (computed as any).backgroundClip;
        if (bgClip === 'text') return;
        for (const child of el.querySelectorAll('*')) {
          const childBgClip = window.getComputedStyle(child).webkitBackgroundClip || (window.getComputedStyle(child) as any).backgroundClip;
          if (childBgClip === 'text') return;
        }

        const text = getTextWithBreaks(el).trim();
        if (!text) return;

        const rect = el.getBoundingClientRect();
        if (rect.width < 5 || rect.height < 5) return;
        // Skip off-screen elements
        if (rect.right < 0 || rect.bottom < 0 || rect.left > 1920 || rect.top > 1080) return;

        // Extract padding to compute tighter text bounds
        const padTop = parseFloat(computed.paddingTop) || 0;
        const padBottom = parseFloat(computed.paddingBottom) || 0;
        const padLeft = parseFloat(computed.paddingLeft) || 0;
        const padRight = parseFloat(computed.paddingRight) || 0;

        // Account for CSS transform:scale on font sizes
        const cssScale = getCssScale(el);
        const fontSizePx = parseFloat(computed.fontSize) * cssScale;

        const isBold = computed.fontWeight === 'bold' || parseInt(computed.fontWeight) >= 600;

        let align: 'left' | 'center' | 'right' = 'left';
        if (computed.textAlign === 'center') align = 'center';
        else if (computed.textAlign === 'right' || computed.textAlign === 'end') align = 'right';

        // Detect "text on shape" — element has visible background
        const bgColor = computed.backgroundColor;
        const hasVisibleBg = bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent';

        // Detect centered flex container
        const parentStyle = el.parentElement ? window.getComputedStyle(el.parentElement) : null;
        const isCenteredFlex =
          (computed.display.includes('flex') &&
           computed.alignItems === 'center' &&
           computed.justifyContent === 'center') ||
          (parentStyle &&
           parentStyle.display.includes('flex') &&
           parentStyle.alignItems === 'center' &&
           parentStyle.justifyContent === 'center');

        // Text on shape: center both H and V
        if (hasVisibleBg || isCenteredFlex) {
          align = 'center';
        }

        // Vertical alignment
        let valign: 'top' | 'middle' | 'bottom' = 'middle';
        // Multi-line text or long text blocks → top align to match CSS flow
        const textLines = text.split('\n').length;
        if (textLines > 3 || text.length > 100) {
          valign = 'top';
        }

        // Width buffer: PowerPoint renders fonts ~5% wider than CSS
        const WIDTH_BUFFER = WIDTH_BUFFER_ARG;

        // Use full element size (dom-to-pptx convention)
        // CSS padding → PPTX margin (internal inset)
        overlays.push({
          text,
          x: pxToInch(rect.left),
          y: pxToInch(rect.top),
          w: pxToInch(rect.width) * WIDTH_BUFFER,
          h: pxToInch(rect.height),
          fontSize: Math.round(fontSizePx * PT_PER_PX * SCALE * 10) / 10,
          fontFamily: computed.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
          color: rgbToHex(computed.color),
          bold: isBold,
          italic: computed.fontStyle === 'italic',
          align,
          valign,
          margin: [
            pxToInch(padTop),
            pxToInch(padRight),
            pxToInch(padBottom),
            pxToInch(padLeft),
          ],
        });
        return; // leaf — don't descend further
      }

      // Container — recurse into children
      for (const child of el.children) {
        walk(child);
      }
    }

    // Start from body's children (body itself is in LAYOUT_TAGS)
    for (const child of document.body.children) {
      walk(child);
    }
    return overlays;
  }, widthBuffer);
}

// ── Main Renderer ──────────────────────────────────────────────────────

export async function hybridRender(
  htmlFile: string,
  pres: PptxPresentation,
  options: HybridRendererOptions,
): Promise<HybridResult> {
  const { browser, screenshotOnly = false, widthBuffer = 1.05 } = options;
  const errors: string[] = [];

  const filePath = path.isAbsolute(htmlFile) ? htmlFile : path.join(process.cwd(), htmlFile);
  const page = await browser.newPage();

  try {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });

    // Wait for fonts
    await page.evaluate(async () => {
      if ((document as any).fonts?.ready) {
        await (document as any).fonts.ready;
      }
    });

    // Extract text overlays BEFORE screenshot (need visible elements for getBoundingClientRect)
    let textOverlays: TextOverlay[] = [];
    if (!screenshotOnly) {
      textOverlays = await extractTextOverlays(page, widthBuffer);

      // Hide text elements so screenshot captures only backgrounds/shapes
      await page.evaluate(() => {
        const SKIP = new Set(['HTML', 'HEAD', 'BODY', 'SCRIPT', 'STYLE', 'META', 'LINK', 'HR', 'IMG', 'SVG', 'CANVAS', 'VIDEO', 'AUDIO', 'IFRAME']);
        const INLINE = new Set(['SPAN', 'STRONG', 'EM', 'B', 'I', 'U', 'A', 'MARK', 'SUB', 'SUP', 'SMALL', 'CODE', 'BR']);

        // NOTE: Use arrow functions to avoid tsx/esbuild __name wrapper in page.evaluate
        const isTextBlock = (el: Element): boolean => {
          if (SKIP.has(el.tagName)) return false;
          const text = el.textContent?.trim();
          if (!text) return false;
          for (const child of el.children) {
            if (SKIP.has(child.tagName) || INLINE.has(child.tagName)) continue;
            if (child.textContent?.trim()) return false;
          }
          return true;
        };

        // Check if element uses gradient text (background-clip: text)
        const hasGradientText = (el: Element): boolean => {
          const cs = window.getComputedStyle(el);
          if (cs.webkitBackgroundClip === 'text' || (cs as any).backgroundClip === 'text') return true;
          for (const child of el.querySelectorAll('*')) {
            const childCs = window.getComputedStyle(child);
            if (childCs.webkitBackgroundClip === 'text' || (childCs as any).backgroundClip === 'text') return true;
          }
          return false;
        };

        // Detect styled badge spans (has visible background color)
        const isBadge = (el: Element): boolean => {
          const cs = window.getComputedStyle(el);
          const bg = cs.backgroundColor;
          if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return false;
          return true;
        };

        const hideText = (el: Element): void => {
          if (SKIP.has(el.tagName)) return;
          if (isTextBlock(el)) {
            // Keep gradient text visible in screenshot (can't be replicated in PPTX)
            if (hasGradientText(el)) return;
            const htmlEl = el as HTMLElement;
            htmlEl.style.color = 'transparent';
            htmlEl.style.setProperty('-webkit-text-fill-color', 'transparent');
            // Also hide inline children text, but keep badge spans visible
            el.querySelectorAll('*').forEach(child => {
              if (INLINE.has(child.tagName) && isBadge(child)) return;
              const childHtml = child as HTMLElement;
              childHtml.style.color = 'transparent';
              childHtml.style.setProperty('-webkit-text-fill-color', 'transparent');
            });
            return;
          }
          for (const child of el.children) hideText(child);
        }

        for (const child of document.body.children) hideText(child);
      });
    }

    // Take screenshot (text-free when hybrid mode)
    const screenshotBuffer = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
      scale: 'device',
    });

    const base64 = Buffer.from(screenshotBuffer).toString('base64');
    const slide = pres.addSlide();

    // Add screenshot as full-slide background
    slide.addImage({
      data: `image/png;base64,${base64}`,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
    });

    // Add text overlays — these are the ONLY source of text in the slide
    for (const overlay of textOverlays) {
      slide.addText(overlay.text, {
        x: overlay.x,
        y: overlay.y,
        w: overlay.w,
        h: overlay.h,
        fontSize: overlay.fontSize,
        fontFace: overlay.fontFamily,
        color: overlay.color,
        bold: overlay.bold,
        italic: overlay.italic,
        align: overlay.align,
        valign: overlay.valign,
        margin: overlay.margin, // CSS padding → PPTX internal inset [T, R, B, L]
        wrap: true,
        autoFit: false,
        fill: { type: 'none' },
        line: { type: 'none' },
      });
    }

    return { slide, textOverlays, errors };
  } catch (error: any) {
    throw new Error(`${htmlFile}: ${error.message}`);
  } finally {
    await page.close();
  }
}
