#!/usr/bin/env tsx
/**
 * JSON→HTML batch regeneration
 * Usage: npx tsx scripts/generate-from-json.ts <json-path> <output-dir>
 * Example (from presentation/ dir): npx tsx scripts/generate-from-json.ts _workspace/02a_deck_data.json _workspace/output/
 *
 * JSON structure expected:
 * { "templateSet": "healthcare", "slides": [{ "template": "cover.html", "data": { "TITLE": "..." } }] }
 */
import fs from 'fs';
import path from 'path';

const [,, jsonPath, outputDir] = process.argv;

if (!jsonPath || !outputDir) {
  console.error('Usage: generate-from-json.ts <json-path> <output-dir>');
  process.exit(1);
}

interface Slide {
  name?: string;
  template: string;
  data: Record<string, string>;
  overrideCSS?: string;
}

const deckData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
const templateSet: string | undefined = deckData.templateSet;
const slides: Slide[] = deckData.slides;

// Resolve template directory based on templateSet
// Run from presentation/ directory
const templateDir = templateSet
  ? path.join('base-templates', `templates-slide-${templateSet}`)
  : path.join('base-templates', 'templates-slide');

if (!fs.existsSync(templateDir)) {
  console.error(`Template directory not found: ${templateDir}`);
  console.error('Run this script from the presentation/ directory.');
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

slides.forEach((slide: Slide, index: number) => {
  const slideNum = String(index + 1).padStart(2, '0');
  const templatePath = path.join(templateDir, slide.template);

  if (!fs.existsSync(templatePath)) {
    console.error(`Template not found: ${templatePath} (slide ${slideNum})`);
    return;
  }

  let html = fs.readFileSync(templatePath, 'utf-8');

  // Replace all {{KEY}} patterns from slide.data
  for (const [key, value] of Object.entries(slide.data ?? {})) {
    html = html.replaceAll(`{{${key}}}`, value ?? '');
  }

  // Inject overrideCSS if present
  if (slide.overrideCSS) {
    html = html.replace('</head>', `<style>${slide.overrideCSS}</style>\n</head>`);
  }

  const outputPath = path.join(outputDir, `slide-${slideNum}.html`);
  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`✓ slide-${slideNum}.html`);
});

console.log(`\nDone: ${slides.length} slides → ${outputDir}`);
