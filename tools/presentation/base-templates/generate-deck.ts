import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { chromium } from 'playwright';
import { parseArgs } from 'util';

function fill(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

// CLI args
const { values } = parseArgs({
  options: {
    input: { type: 'string', default: resolve(import.meta.dirname, '../workspace-default/default-project/draft/deck-data.json') },
    templateSet: { type: 'string' },
    output: { type: 'string', default: resolve(import.meta.dirname, '../workspace-default/default-project/draft/slides') },
  },
});

const inputPath = resolve(values.input!);
if (!existsSync(inputPath)) {
  console.error(`Error: Input file not found: ${inputPath}`);
  process.exit(1);
}

const deckData = JSON.parse(readFileSync(inputPath, 'utf8'));
const templateSet = values.templateSet || deckData.templateSet || 'warm';

// Resolve template directory based on templateSet
const TEMPLATE_DIRS: Record<string, string> = {
  'warm': resolve(import.meta.dirname, 'templates-slide-warm'),
  'healthcare-soft': resolve(import.meta.dirname, 'templates-slide-healthcare'),
  'healthcare': resolve(import.meta.dirname, 'templates-slide-healthcare'),
};
const TEMPLATES_DIR = TEMPLATE_DIRS[templateSet];
if (!TEMPLATES_DIR || !existsSync(TEMPLATES_DIR)) {
  console.error(`Error: Unknown templateSet "${templateSet}". Available: ${Object.keys(TEMPLATE_DIRS).join(', ')}`);
  process.exit(1);
}

const OUTPUT_DIR = resolve(values.output!);

interface SlideEntry {
  template: string;
  data: Record<string, string>;
  name?: string;
}

const slides: SlideEntry[] = deckData.slides;
if (!Array.isArray(slides) || slides.length === 0) {
  console.error('Error: deck_data.json must have a non-empty "slides" array');
  process.exit(1);
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  // Generate slide HTML (960x540 x scale(2) = 1920x1080)
  for (let i = 0; i < slides.length; i++) {
    const { template, data } = slides[i];
    const templatePath = resolve(TEMPLATES_DIR, template);
    if (!existsSync(templatePath)) {
      console.error(`Warning: Template not found: ${template} — skipping slide ${i + 1}`);
      continue;
    }
    const slideHtml = fill(readFileSync(templatePath, 'utf8'), data);
    writeFileSync(resolve(OUTPUT_DIR, `slide-${String(i + 1).padStart(2, '0')}.html`), slideHtml);
  }

  // Capture PNGs (full viewport 1920x1080)
  const browser = await chromium.launch();
  for (let i = 0; i < slides.length; i++) {
    const htmlPath = resolve(OUTPUT_DIR, `slide-${String(i + 1).padStart(2, '0')}.html`);
    if (!existsSync(htmlPath)) continue;
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
    try { await page.evaluate(async () => { if ((document as any).fonts?.ready) await (document as any).fonts.ready; }); } catch {}

    const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    writeFileSync(resolve(OUTPUT_DIR, `slide-${String(i + 1).padStart(2, '0')}.png`), buf);
    console.log(`Generated: slide-${String(i + 1).padStart(2, '0')} (${slides[i].name || slides[i].template})`);
    await page.close();
    await context.close();
  }
  await browser.close();

  console.log(`\nDone! ${slides.length} slides generated (templateSet: ${templateSet})`);
}
main();
