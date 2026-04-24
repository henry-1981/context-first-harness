import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

function syntheticBbox({ index, text, x = 40, y = 40 }) {
  return {
    x,
    y: y + index * 32,
    width: Math.max(140, String(text || '').length * 10),
    height: 24,
  };
}

function isTableLine(line) {
  return /\t/.test(line) || /\s\|\s/.test(line);
}

function splitTableCells(line) {
  if (/\t/.test(line)) {
    return line.split(/\t+/).map((cell) => cell.trim()).filter(Boolean);
  }
  return line.split(/\s\|\s/).map((cell) => cell.trim()).filter(Boolean);
}

function createTextBlock(line, order) {
  return {
    type: 'text',
    role: 'paragraph',
    text: line,
    order,
    bbox: syntheticBbox({ index: order, text: line }),
  };
}

function createTableBlock(lines, order, startIndex) {
  const rows = lines.map((line, rowIndex) => {
    const cells = splitTableCells(line);
    return {
      cells: cells.map((text, colIndex) => ({
        row: rowIndex,
        col: colIndex,
        text,
        bbox: {
          x: 40 + colIndex * 160,
          y: 40 + startIndex * 32 + rowIndex * 32,
          width: 150,
          height: 24,
        },
        rowspan: 1,
        colspan: 1,
      })),
    };
  });
  const maxCols = Math.max(...rows.map((row) => row.cells.length), 1);
  return {
    type: 'table',
    role: 'table',
    order,
    bbox: {
      x: 40,
      y: 40 + startIndex * 32,
      width: maxCols * 160,
      height: rows.length * 32,
    },
    rows,
  };
}

function buildBlocks(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks = [];
  const tables = [];
  let currentTable = [];
  let currentTableStart = 0;
  let order = 0;

  const flushTable = () => {
    if (currentTable.length === 0) return;
    const table = createTableBlock(currentTable, order, currentTableStart);
    tables.push(table);
    blocks.push(table);
    order += 1;
    currentTable = [];
  };

  lines.forEach((line, index) => {
    if (isTableLine(line)) {
      if (currentTable.length === 0) currentTableStart = index;
      currentTable.push(line);
      return;
    }
    flushTable();
    blocks.push(createTextBlock(line, order));
    order += 1;
  });

  flushTable();
  return { blocks, tables };
}

function blocksToHtml(blocks) {
  const html = blocks.map((block) => {
    if (block.type === 'table') {
      const rows = block.rows
        .map((row) => `<tr>${row.cells.map((cell) => `<td>${escapeHtml(cell.text)}</td>`).join('')}</tr>`)
        .join('');
      return `<table data-block-type="table">${rows}</table>`;
    }
    return `<div data-block-type="text">${escapeHtml(block.text)}</div>`;
  }).join('');
  return `<div data-source-kind="pdf">${html}</div>`;
}

export async function parsePdf(sourcePath, { commandRunner = execFileAsync } = {}) {
  let fallbackUsed = false;
  let text = '';
  try {
    const { stdout } = await commandRunner('pdftotext', ['-layout', sourcePath, '-']);
    text = stdout;
  } catch {
    fallbackUsed = true;
    const workdir = await mkdtemp(join(tmpdir(), 'pdf-ocr-'));
    const ocrPdf = join(workdir, 'ocr.pdf');
    const sidecar = join(workdir, 'ocr.txt');
    try {
      const result = await commandRunner('ocrmypdf', ['--sidecar', sidecar, sourcePath, ocrPdf]);
      try {
        text = await readFile(sidecar, 'utf8');
      } catch {
        text = result?.stdout || '';
      }
    } finally {
      await rm(workdir, { recursive: true, force: true });
    }
  }

  const { blocks, tables } = buildBlocks(text);
  return {
    html_string: blocksToHtml(blocks),
    metadata: {
      source_kind: 'pdf',
      slide_count: 1,
      warnings: fallbackUsed ? ['ocr-fallback-used'] : [],
    },
    extraction_report: {
      blocks,
      tables,
      confidence: fallbackUsed ? 0.45 : 0.8,
      fallback_used: fallbackUsed,
    },
  };
}
