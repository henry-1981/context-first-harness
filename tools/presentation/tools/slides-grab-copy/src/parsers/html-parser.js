import { readFile } from 'node:fs/promises';

export async function parseHtml(sourcePath) {
  const html = await readFile(sourcePath, 'utf8');
  return {
    html_string: html,
    metadata: {
      source_kind: 'single-html',
      slide_count: 1,
      warnings: [],
    },
    extraction_report: {
      blocks: [{ type: 'layout-group', role: 'html-root', order: 0, text: null, bbox: null }],
      tables: [],
      confidence: 1,
      fallback_used: false,
    },
  };
}
