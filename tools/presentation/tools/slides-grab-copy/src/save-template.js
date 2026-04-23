import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}\s_-]*$/u;

export function validateTemplateTarget({ archetype, slotName }) {
  const normalizedSlot = String(slotName || '').trim();
  const normalizedTemplate = String(archetype || '').trim();
  if (!NAME_PATTERN.test(normalizedSlot)) {
    throw new Error('Invalid layout name.');
  }
  if (!NAME_PATTERN.test(normalizedTemplate)) {
    throw new Error('Invalid template name.');
  }
  return { normalizedTemplate, normalizedSlot };
}

export async function listTemplates(baseDir) {
  const root = resolve(baseDir);
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  const templates = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('templates-slide-')) continue;
    const templateName = entry.name.replace(/^templates-slide-/, '');
    const templateDir = resolve(root, entry.name);
    const layoutEntries = await readdir(templateDir, { withFileTypes: true }).catch(() => []);
    const layouts = layoutEntries
      .filter((item) => item.isFile() && item.name.endsWith('.html'))
      .map((item) => item.name.replace(/\.html$/, ''))
      .sort((a, b) => a.localeCompare(b, 'ko'));
    templates.push({ templateName, layouts });
  }

  return templates.sort((a, b) => a.templateName.localeCompare(b.templateName, 'ko'));
}

export async function saveTemplate({ baseDir, archetype, slotName, html, mode = 'new' }) {
  const { normalizedTemplate, normalizedSlot } = validateTemplateTarget({ archetype, slotName });
  const templateDir = resolve(baseDir, `templates-slide-${normalizedTemplate}`);
  const templateExists = await stat(templateDir).then(() => true).catch(() => false);

  if (mode === 'new' && templateExists) {
    const error = new Error('Template name already exists.');
    error.code = 'TEMPLATE_EXISTS';
    throw error;
  }

  if (mode === 'existing' && !templateExists) {
    const error = new Error('Selected template does not exist.');
    error.code = 'TEMPLATE_MISSING';
    throw error;
  }

  const target = resolve(templateDir, `${normalizedSlot}.html`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html, 'utf8');
  return target;
}
