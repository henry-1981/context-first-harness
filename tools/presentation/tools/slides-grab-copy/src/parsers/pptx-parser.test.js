import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePptx } from './pptx-parser.js';

test('parsePptx returns parsed slide payload', async () => {
  const payload = {
    html_string: '<div data-source-kind="pptx"><div data-block-type="text">R&amp;D &lt;Title&gt;</div><img data-block-type="image" src="asset://image-1" /></div>',
    metadata: {
      source_kind: 'pptx',
      slide_count: 3,
      slide_size: { width: 1280, height: 720 },
      warnings: [],
    },
    extraction_report: {
      blocks: [
        { type: 'text', text: 'R&D <Title>', role: 'title', order: 0, bbox: { x: 10, y: 10, width: 500, height: 80 } },
        { type: 'image', text: null, role: 'image', order: 1, bbox: { x: 50, y: 120, width: 640, height: 360 } },
        {
          type: 'table',
          role: 'table',
          order: 2,
          bbox: { x: 40, y: 520, width: 900, height: 120 },
          rows: [
            { cells: [{ row: 0, col: 0, text: 'Metric', bbox: { x: 40, y: 520, width: 200, height: 40 }, rowspan: 1, colspan: 1 }] },
          ],
        },
      ],
      tables: [
        {
          type: 'table',
          bbox: { x: 40, y: 520, width: 900, height: 120 },
          rows: [
            { cells: [{ row: 0, col: 0, text: 'Metric', bbox: { x: 40, y: 520, width: 200, height: 40 }, rowspan: 1, colspan: 1 }] },
          ],
        },
      ],
      confidence: 0.7,
      fallback_used: false,
    },
  };
  const result = await parsePptx('reference.pptx', {
    commandRunner: async () => ({ stdout: JSON.stringify(payload) }),
  });
  assert.equal(result.metadata.source_kind, 'pptx');
  assert.equal(result.metadata.slide_count, 3);
  assert.equal(result.metadata.slide_size.width, 1280);
  assert.equal(result.extraction_report.blocks[1].type, 'image');
  assert.equal(result.extraction_report.tables[0].rows[0].cells[0].rowspan, 1);
  assert.match(result.html_string, /R&amp;D &lt;Title&gt;/);
});

test('parsePptx raises actionable error when python-pptx is missing', async () => {
  await assert.rejects(
    parsePptx('reference.pptx', {
      commandRunner: async () => ({ stdout: JSON.stringify({ error: 'python-pptx is not installed' }) }),
    }),
    /bootstrap\.sh/
  );
});
