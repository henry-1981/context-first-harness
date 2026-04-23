/**
 * Capture individual slide HTML files as PNG, then merge into a single PDF.
 *
 * Usage:
 *   npx tsx scripts/capture-slides-to-pdf.ts <slides_dir> [output.pdf]
 *
 * Requires: playwright, @playwright/test (for PDF not needed, we use sharp or manual merge)
 * Strategy: screenshot each slide at 1920x1080 → combine PNGs into PDF via Playwright print.
 */

import { chromium } from 'playwright';
import { readdirSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';

const slidesDir = process.argv[2];
const outputPath = process.argv[3] || 'deck.pdf';

if (!slidesDir) {
  console.error('Usage: npx tsx scripts/capture-slides-to-pdf.ts <slides_dir> [output.pdf]');
  process.exit(1);
}

const absDir = resolve(slidesDir);
const files = readdirSync(absDir)
  .filter(f => f.match(/^slide[_-]\d+\.html$/))
  .sort();

if (files.length === 0) {
  console.error(`No slide HTML files found in ${absDir}`);
  process.exit(1);
}

async function main() {
  const browser = await chromium.launch();

  // Step 1: Capture PNGs
  const tmpDir = resolve(absDir, '_tmp_captures');
  mkdirSync(tmpDir, { recursive: true });

  const pngPaths: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const htmlPath = join(absDir, files[i]);
    const pngPath = join(tmpDir, `slide_${String(i + 1).padStart(2, '0')}.png`);

    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });

    try {
      await page.evaluate(async () => {
        if ((document as any).fonts?.ready) await (document as any).fonts.ready;
      });
    } catch {}

    await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
      path: pngPath,
    });
    pngPaths.push(pngPath);
    console.log(`Captured: ${files[i]}`);
    await page.close();
    await ctx.close();
  }

  // Step 2: Build a single HTML page with all slides as images, then print to PDF
  const imgTags = pngPaths.map((p, i) => {
    const dataUrl = `file:///${p.replace(/\\/g, '/')}`;
    return `<div class="page"><img src="${dataUrl}"></div>`;
  }).join('\n');

  const mergeHtml = `<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; }
  @page { size: 1920px 1080px; margin: 0; }
  .page { width: 1920px; height: 1080px; page-break-after: always; overflow: hidden; }
  .page img { width: 100%; height: 100%; object-fit: contain; }
</style></head><body>${imgTags}</body></html>`;

  const mergeHtmlPath = join(tmpDir, '_merge.html');
  writeFileSync(mergeHtmlPath, mergeHtml);

  const pdfCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const pdfPage = await pdfCtx.newPage();
  await pdfPage.goto('file:///' + mergeHtmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });

  const absOutput = resolve(outputPath);
  mkdirSync(resolve(absOutput, '..'), { recursive: true });

  await pdfPage.pdf({
    path: absOutput,
    width: '1920px',
    height: '1080px',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  console.log(`\nPDF generated: ${absOutput} (${files.length} slides)`);

  await pdfPage.close();
  await pdfCtx.close();
  await browser.close();

  // Cleanup tmp
  const { rmSync } = await import('fs');
  rmSync(tmpDir, { recursive: true, force: true });
}

main().catch(e => { console.error(e); process.exit(1); });
