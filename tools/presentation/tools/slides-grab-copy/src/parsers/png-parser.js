import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function parseTesseractTsv(tsvText) {
  const lines = tsvText.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2 || !lines[0].includes('\t')) {
    return [];
  }

  const header = lines[0].split('\t');
  const rows = lines.slice(1).map((line) => {
    const values = line.split('\t');
    return Object.fromEntries(header.map((key, index) => [key, values[index] ?? '']));
  });

  const grouped = new Map();
  for (const row of rows) {
    const text = row.text?.trim();
    const confidence = Number(row.conf || '-1');
    if (!text || confidence < 0) continue;
    const key = [row.block_num, row.par_num, row.line_num].join(':');
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(row);
  }

  return [...grouped.values()].map((group, index) => {
    const left = Math.min(...group.map((item) => Number(item.left || 0)));
    const top = Math.min(...group.map((item) => Number(item.top || 0)));
    const right = Math.max(...group.map((item) => Number(item.left || 0) + Number(item.width || 0)));
    const bottom = Math.max(...group.map((item) => Number(item.top || 0) + Number(item.height || 0)));
    return {
      type: 'text',
      role: 'ocr-line',
      text: group.map((item) => item.text.trim()).join(' '),
      order: index + 1,
      bbox: {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
      },
    };
  });
}

function blocksToHtml(blocks, sourcePath) {
  const image = `<img data-block-type="image" src="${sourcePath}" alt="reference" />`;
  const texts = blocks
    .filter((block) => block.type === 'text')
    .map((block) => `<div data-block-type="text">${escapeHtml(block.text)}</div>`)
    .join('');
  return `<div data-source-kind="png">${image}${texts}</div>`;
}

export async function parsePng(sourcePath, { commandRunner = execFileAsync } = {}) {
  const { stdout } = await commandRunner('tesseract', [sourcePath, 'stdout', 'tsv']);
  const textBlocks = parseTesseractTsv(stdout);
  const blocks = [
    {
      type: 'image',
      role: 'image',
      text: null,
      order: 0,
      bbox: { x: 0, y: 0, width: 1920, height: 1080 },
    },
    ...textBlocks,
  ];

  return {
    html_string: blocksToHtml(blocks, sourcePath),
    metadata: {
      source_kind: 'png',
      slide_count: 1,
      warnings: textBlocks.length === 0 ? ['ocr-empty'] : [],
    },
    extraction_report: {
      blocks,
      tables: [],
      confidence: textBlocks.length > 0 ? 0.62 : 0.3,
      fallback_used: false,
    },
  };
}
