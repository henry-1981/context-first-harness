import { chromium } from 'playwright';
import { readdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

async function main() {
  const browser = await chromium.launch();
  const dirs = [
    { name: 'executive-corp', path: resolve('slides/executive-corp') },
    { name: 'bento-grid', path: resolve('slides/bento-grid') },
  ];
  const outDir = resolve('slides/calibration-captures');

  for (const dir of dirs) {
    const files = readdirSync(dir.path).filter(f => f.endsWith('.html')).sort();
    for (const file of files) {
      const htmlPath = join(dir.path, file);
      const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      await page.goto(fileUrl, { waitUntil: 'networkidle' });
      try {
        await page.evaluate(async () => {
          if ((document as any).fonts?.ready) await (document as any).fonts.ready;
        });
      } catch { /* font API may not exist */ }
      const slideRoot = await page.$('.slide-root');
      const target = slideRoot ?? page;
      const buf = await target.screenshot({ type: 'png' });
      const outName = dir.name + '-' + file.replace('.html', '.png');
      writeFileSync(join(outDir, outName), buf);
      console.log('Captured: ' + outName);
      await page.close();
      await context.close();
    }
  }
  await browser.close();
  console.log('Done! Captured 10 slides.');
}
main();
