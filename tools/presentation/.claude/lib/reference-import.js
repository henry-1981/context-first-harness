import { parse } from '../../tools/slides-grab-copy/src/parsers/parser-api.js';
import { applyDirectionSkeleton } from './skeleton-transform.js';

export async function importReferenceSkeleton({ sourcePath, direction, parserOptions = {} }) {
  const parsed = await parse(sourcePath, parserOptions);
  return {
    metadata: parsed.metadata,
    extraction_report: parsed.extraction_report ?? null,
    html: applyDirectionSkeleton({
      html: parsed.html_string,
      direction,
    }),
  };
}
