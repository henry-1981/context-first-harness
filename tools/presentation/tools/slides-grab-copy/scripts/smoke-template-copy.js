import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { parse } from '../src/parsers/parser-api.js';
import { saveTemplate } from '../src/save-template.js';

function assertParserContract(label, payload) {
  if (!payload?.html_string) throw new Error(`${label}: html_string missing`);
  if (!payload?.metadata?.source_kind) throw new Error(`${label}: metadata.source_kind missing`);
  if (!Array.isArray(payload?.extraction_report?.blocks) || payload.extraction_report.blocks.length === 0) {
    throw new Error(`${label}: extraction_report.blocks missing`);
  }
}

async function main() {
  const workdir = await mkdtemp(join(tmpdir(), 'template-copy-smoke-'));
  try {
    const baseDir = join(workdir, 'base-templates');
    const singleHtml = join(workdir, 'single.html');
    const webpptHtml = join(workdir, 'deck.html');
    await writeFile(singleHtml, '<html><body><h1>single</h1></body></html>', 'utf8');
    await writeFile(webpptHtml, '<html><body><template><section>deck-a</section></template></body></html>', 'utf8');

    const single = await parse(singleHtml);
    const webppt = await parse(webpptHtml, { mode: 'webppt' });
    assertParserContract('single-html', single);
    assertParserContract('webppt-html', webppt);

    const targetA = await saveTemplate({
      baseDir,
      archetype: 'warm',
      slotName: 'smoke-single',
      html: single.html_string,
      mode: 'new',
    });
    const targetB = await saveTemplate({
      baseDir,
      archetype: 'warm',
      slotName: 'smoke-webppt',
      html: webppt.html_string,
      mode: 'existing',
    });

    console.log(JSON.stringify({
      targets: [targetA, targetB],
      parserReports: {
        single: {
          sourceKind: single.metadata.source_kind,
          blockCount: single.extraction_report.blocks.length,
        },
        webppt: {
          sourceKind: webppt.metadata.source_kind,
          blockCount: webppt.extraction_report.blocks.length,
        },
      },
    }));
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
