import { type Browser } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import path from 'path';

export interface CaptureResult {
  screenshotPath: string;
  screenshotBase64: string;
}

export interface CaptureOptions {
  deviceScaleFactor?: number;
}

export async function captureSlide(
  htmlPath: string,
  browser: Browser,
  options?: CaptureOptions,
): Promise<CaptureResult> {
  const { deviceScaleFactor = 2 } = options ?? {};

  const filePath = path.isAbsolute(htmlPath)
    ? htmlPath
    : path.join(process.cwd(), htmlPath);

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor,
  });
  const page = await context.newPage();

  try {
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });

    // Wait for fonts
    await page.evaluate(async () => {
      if ((document as any).fonts?.ready) {
        await (document as any).fonts.ready;
      }
    });

    // Capture .slide-root element, fallback to full page
    const slideRoot = await page.$('.slide-root');
    const target = slideRoot ?? page;

    const screenshotBuffer = await target.screenshot({ type: 'png' });
    const screenshotBase64 = Buffer.from(screenshotBuffer).toString('base64');

    // Save to temp file
    const screenshotPath = join(
      tmpdir(),
      `slide-capture-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`
    );
    writeFileSync(screenshotPath, screenshotBuffer);

    return { screenshotPath, screenshotBase64 };
  } finally {
    await page.close();
    await context.close();
  }
}
