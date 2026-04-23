import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePdf } from './pdf-parser.js';
import { parsePng } from './png-parser.js';

test('parsePdf builds text blocks from pdftotext output', async () => {
  const result = await parsePdf('reference.pdf', {
    commandRunner: async () => ({ stdout: 'Revenue <Growth>\nQuarterly & Outlook\nProduct\tQ1\tQ2\nA\t10\t20\n' }),
  });
  assert.equal(result.metadata.source_kind, 'pdf');
  assert.equal(result.extraction_report.blocks[0].bbox !== null, true);
  assert.equal(result.extraction_report.blocks[0].role, 'paragraph');
  assert.equal(result.extraction_report.tables.length, 1);
  assert.equal(result.extraction_report.tables[0].rows[0].cells.length, 3);
  assert.match(result.html_string, /Revenue &lt;Growth&gt;/);
  assert.match(result.html_string, /Quarterly &amp; Outlook/);
});

test('parsePdf uses OCR fallback when pdftotext fails', async () => {
  let call = 0;
  const result = await parsePdf('reference.pdf', {
    commandRunner: async (_cmd, _args) => {
      call += 1;
      if (call === 1) throw new Error('pdftotext failed');
      return { stdout: 'OCR Revenue\nOCR Outlook\n' };
    },
  });
  assert.equal(result.extraction_report.fallback_used, true);
  assert.equal(result.metadata.warnings.includes('ocr-fallback-used'), true);
  assert.equal(result.extraction_report.confidence < 0.5, true);
  assert.match(result.html_string, /OCR Revenue/);
});

test('parsePng builds image + OCR text blocks', async () => {
  const result = await parsePng('reference.png', {
    commandRunner: async () => ({
      stdout: [
        'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext',
        '5\t1\t1\t1\t1\t1\t10\t20\t110\t20\t96\tQuarterly',
        '5\t1\t1\t1\t1\t2\t130\t20\t100\t20\t96\tRevenue',
        '5\t1\t2\t1\t1\t1\t10\t70\t60\t20\t92\t2026',
        '5\t1\t2\t1\t1\t2\t80\t70\t60\t20\t92\tPlan',
        '5\t1\t3\t1\t1\t1\t10\t120\t60\t20\t92\tA&B',
      ].join('\n'),
    }),
  });
  assert.equal(result.metadata.source_kind, 'png');
  assert.equal(result.extraction_report.blocks[0].type, 'image');
  assert.equal(result.extraction_report.blocks[1].bbox !== null, true);
  assert.equal(result.extraction_report.blocks[1].role, 'ocr-line');
  assert.match(result.html_string, /Quarterly Revenue/);
  assert.match(result.html_string, /A&amp;B/);
});
