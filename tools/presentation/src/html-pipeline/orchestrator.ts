import { readdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import PptxGenJSDefault from 'pptxgenjs';
import { chromium } from 'playwright';
import { hybridRender } from './hybrid-renderer.js';

// Handle pptxgenjs dual export
const PptxGen: any = (typeof PptxGenJSDefault === 'function'
  ? PptxGenJSDefault
  : (PptxGenJSDefault as any).default) ?? PptxGenJSDefault;

export type RenderMode = 'hybrid' | 'screenshot';

export interface HtmlPipelineOptions {
  slidesDir: string;
  outputPath: string;
  mode?: RenderMode;
  verbose?: boolean;
  widthBuffer?: number; // default 1.05, range 1.0-1.5
}

export interface HtmlPipelineResult {
  totalSlides: number;
  outputFile: string;
  errors: string[];
}

export class HtmlPipeline {
  async process(options: HtmlPipelineOptions): Promise<HtmlPipelineResult> {
    const { slidesDir, outputPath, mode = 'hybrid', verbose, widthBuffer } = options;

    if (!existsSync(slidesDir)) {
      throw new Error(`Slides directory not found: ${slidesDir}`);
    }

    const htmlFiles = readdirSync(slidesDir)
      .filter(f => f.endsWith('.html'))
      .sort()
      .map(f => join(slidesDir, f));

    if (htmlFiles.length === 0) {
      throw new Error(`No HTML files found in: ${slidesDir}`);
    }

    if (verbose) console.log(`Converting ${htmlFiles.length} slides (mode: ${mode})...`);

    const pres = new PptxGen();
    // Standard 16:9 layout (10" x 5.625") — dom-to-pptx convention
    // HTML 1920x1080px is scaled down to fit via scale factor in hybrid-renderer
    pres.layout = 'LAYOUT_16x9';

    const browser = await chromium.launch();
    const allErrors: string[] = [];

    try {
      for (const file of htmlFiles) {
        if (verbose) console.log(`  Processing: ${file}`);

        const result = await hybridRender(file, pres, {
          browser,
          screenshotOnly: mode === 'screenshot',
          widthBuffer,
        });
        if (result.errors.length > 0) {
          allErrors.push(...result.errors.map((e: string) => `${file}: ${e}`));
        }
      }
    } finally {
      await browser.close();
    }

    const resolvedOutput = resolve(outputPath);
    await pres.writeFile({ fileName: resolvedOutput });

    if (verbose) console.log(`Saved: ${resolvedOutput}`);

    return {
      totalSlides: htmlFiles.length,
      outputFile: resolvedOutput,
      errors: allErrors,
    };
  }
}
