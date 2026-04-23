import { extname } from 'node:path';

import { parseHtml } from './html-parser.js';
import { parsePdf } from './pdf-parser.js';
import { parsePng } from './png-parser.js';
import { parsePptx } from './pptx-parser.js';
import { parseWebPpt } from './webppt-parser.js';

export async function parse(sourcePath, options = {}) {
  const ext = extname(sourcePath).toLowerCase();
  if (ext === '.html') {
    if (options.mode === 'webppt' || options.sourceKind === 'webppt-html') {
      return parseWebPpt(sourcePath, options);
    }
    return parseHtml(sourcePath, options);
  }
  if (ext === '.pdf') return parsePdf(sourcePath, options);
  if (ext === '.png') return parsePng(sourcePath, options);
  if (ext === '.pptx') return parsePptx(sourcePath, options);
  throw new Error(`Unsupported parser extension: ${ext}`);
}
