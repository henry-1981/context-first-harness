import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';
import { hybridRender, type TextOverlay } from '../hybrid-renderer.js';
import PptxGenJSDefault from 'pptxgenjs';
import { resolve } from 'path';

const PptxGen: any = (typeof PptxGenJSDefault === 'function'
  ? PptxGenJSDefault
  : (PptxGenJSDefault as any).default) ?? PptxGenJSDefault;

const FIXTURES = resolve(import.meta.dirname, 'fixtures');

async function extractOverlays(browser: Browser, fixtureName: string): Promise<TextOverlay[]> {
  const pres = new PptxGen();
  pres.defineLayout({ name: 'L', width: 20, height: 11.25 });
  pres.layout = 'L';

  const result = await hybridRender(
    resolve(FIXTURES, fixtureName),
    pres,
    { browser, screenshotOnly: false }
  );
  return result.textOverlays;
}

describe('Text extraction - display:block splitting', () => {
  let browser: Browser;
  beforeAll(async () => { browser = await chromium.launch(); });
  afterAll(async () => { await browser.close(); });

  it('bullet-list: title and .sub are separate overlays', async () => {
    const overlays = await extractOverlays(browser, 'bullet-list.html');
    const texts = overlays.map(o => o.text);

    // Must NOT be concatenated
    expect(texts).not.toContain('제목 텍스트설명 텍스트입니다.');
    // Both must exist as separate entries
    expect(texts.some(t => t.includes('제목 텍스트'))).toBe(true);
    expect(texts.some(t => t.includes('설명 텍스트입니다.'))).toBe(true);
  });

  it('bullet-list: title overlay is bold', async () => {
    const overlays = await extractOverlays(browser, 'bullet-list.html');
    const titleOverlay = overlays.find(o => o.text.includes('제목 텍스트'));
    expect(titleOverlay?.bold).toBe(true);
  });
});

describe('Text extraction - BR line breaks', () => {
  let browser: Browser;
  beforeAll(async () => { browser = await chromium.launch(); });
  afterAll(async () => { await browser.close(); });

  it('tree: BR-separated text includes newlines', async () => {
    const overlays = await extractOverlays(browser, 'custom-shell-tree.html');
    const treeOverlay = overlays.find(o => o.text.includes('line-1'));

    expect(treeOverlay?.text).toContain('\n');
    expect(treeOverlay?.text).not.toContain('line-1line-2');
  });

  it('tree: overlay height is reasonable', async () => {
    const overlays = await extractOverlays(browser, 'custom-shell-tree.html');
    const treeOverlay = overlays.find(o => o.text.includes('line-1'));

    expect(treeOverlay!.h).toBeLessThan(6);
  });
});

describe('Text extraction - badge span exclusion', () => {
  let browser: Browser;
  beforeAll(async () => { browser = await chromium.launch(); });
  afterAll(async () => { await browser.close(); });

  it('badge-title: badge text excluded from overlay', async () => {
    const overlays = await extractOverlays(browser, 'badge-title.html');
    const texts = overlays.map(o => o.text);

    expect(texts.some(t => t === '섹션1')).toBe(false);
    expect(texts.some(t => t.includes('테스트 타이틀'))).toBe(true);
  });

  it('badge-title: title overlay does not include badge text', async () => {
    const overlays = await extractOverlays(browser, 'badge-title.html');
    const titleOverlay = overlays.find(o => o.text.includes('테스트 타이틀'));

    expect(titleOverlay?.text).not.toContain('섹션1');
  });
});
