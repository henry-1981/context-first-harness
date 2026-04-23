import { readFile } from 'node:fs/promises';

function extractTemplates(html) {
  return [...html.matchAll(/<template[^>]*>([\s\S]*?)<\/template>/gi)].map((match) => match[1].trim());
}

export async function parseWebPpt(sourcePath, options = {}) {
  const html = await readFile(sourcePath, 'utf8');
  const templates = extractTemplates(html);
  const index = options.slideIndex ?? 0;
  const selected = templates[index] || html;
  return {
    html_string: selected,
    metadata: {
      source_kind: 'webppt-html',
      slide_count: templates.length || 1,
      warnings: templates.length ? [] : ['no-template-tags-detected'],
    },
    extraction_report: {
      blocks: [{ type: 'layout-group', role: 'html-root', order: 0, text: null, bbox: null }],
      tables: [],
      confidence: templates.length ? 0.95 : 0.75,
      fallback_used: false,
    },
  };
}
