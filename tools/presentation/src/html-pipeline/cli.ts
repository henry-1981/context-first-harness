import { HtmlPipeline, type RenderMode } from './orchestrator.js';

const args = process.argv.slice(2);
// --slidesDir=<path> 플래그 우선, 없으면 positional argument, 없으면 기본값
// Usage:
//   node dist/html-pipeline/cli.js --slidesDir=<dir> --output=<path> [--mode=hybrid|screenshot] [--verbose]
//   node dist/html-pipeline/cli.js <dir> --output=<path>  (positional, legacy)
const slidesDirFlag = args.find(a => a.startsWith('--slidesDir='))?.split('=').slice(1).join('=');
const slidesDir = slidesDirFlag ?? args.find(a => !a.startsWith('--')) ?? 'slides';
const outputPath = args.find(a => a.startsWith('--output='))?.split('=').slice(1).join('=') ?? 'output.pptx';
const modeArg = args.find(a => a.startsWith('--mode='))?.split('=')[1];
const mode: RenderMode = (modeArg === 'screenshot' || modeArg === 'hybrid') ? modeArg : 'hybrid';
const widthBufferArg = args.find(a => a.startsWith('--width-buffer='))?.split('=')[1];
const widthBuffer = widthBufferArg ? parseFloat(widthBufferArg) : undefined;
const verbose = args.includes('--verbose');

const pipeline = new HtmlPipeline();

pipeline.process({ slidesDir, outputPath, mode, verbose, widthBuffer })
  .then(result => {
    console.log(`\n✓ ${result.totalSlides} slides → ${result.outputFile} (mode: ${mode})`);
    if (result.errors.length > 0) {
      console.log(`\n⚠ ${result.errors.length} warnings:`);
      result.errors.forEach(e => console.log(`  - ${e}`));
    }
  })
  .catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
  });
