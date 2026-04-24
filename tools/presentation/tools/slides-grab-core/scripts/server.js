#!/usr/bin/env node

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { watch as fsWatch } from 'node:fs';
import { basename, resolve, join } from 'node:path';
import { exec } from 'node:child_process';

let express;

async function loadDeps() {
  if (!express) {
    express = (await import('express')).default;
  }
}

export const DEFAULT_PORT = 3456;
export const DEFAULT_SLIDES_DIR = 'slides';
export const SLIDE_FILE_PATTERN = /\.html$/i;

export function printUsage({ name = 'slides-grab' } = {}) {
  process.stdout.write(`Usage: ${name} edit [options]\n\n`);
  process.stdout.write(`Options:\n`);
  process.stdout.write(`  --port <number>           Server port (default: ${DEFAULT_PORT})\n`);
  process.stdout.write(`  --slides-dir <path>       Slide directory (default: ${DEFAULT_SLIDES_DIR})\n`);
  process.stdout.write(`  -h, --help                Show this help message\n`);
}

export function parseArgs(argv) {
  const opts = {
    port: DEFAULT_PORT,
    slidesDir: DEFAULT_SLIDES_DIR,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      opts.help = true;
      continue;
    }
    if (arg === '--port') {
      opts.port = Number(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith('--port=')) {
      opts.port = Number(arg.slice('--port='.length));
      continue;
    }
    if (arg === '--slides-dir') {
      opts.slidesDir = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith('--slides-dir=')) {
      opts.slidesDir = arg.slice('--slides-dir='.length);
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  if (!Number.isInteger(opts.port) || opts.port <= 0) {
    throw new Error('`--port` must be a positive integer.');
  }
  if (typeof opts.slidesDir !== 'string' || opts.slidesDir.trim() === '') {
    throw new Error('`--slides-dir` must be a non-empty path.');
  }

  opts.slidesDir = opts.slidesDir.trim();
  return opts;
}

export async function listSlideFiles(slidesDirectory) {
  const entries = await readdir(slidesDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && SLIDE_FILE_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => {
      const numA = Number.parseInt(a.match(/\d+/)?.[0] ?? '0', 10);
      const numB = Number.parseInt(b.match(/\d+/)?.[0] ?? '0', 10);
      return numA - numB || a.localeCompare(b);
    });
}

function normalizeSlideFilename(rawSlide, source = '`slide`') {
  const slide = typeof rawSlide === 'string' ? basename(rawSlide.trim()) : '';
  if (!slide || !SLIDE_FILE_PATTERN.test(slide)) {
    throw new Error(`Missing or invalid ${source}.`);
  }
  return slide;
}

function normalizeSlideHtml(rawHtml) {
  if (typeof rawHtml !== 'string' || rawHtml.trim() === '') {
    throw new Error('Missing or invalid `html`.');
  }
  return rawHtml;
}

export async function createCoreApp({
  slidesDir,
  editorHtmlPath = null,
  staticJsDir = null,
  onManualSave = null,
} = {}) {
  await loadDeps();
  const slidesDirectory = resolve(process.cwd(), slidesDir || DEFAULT_SLIDES_DIR);
  await mkdir(slidesDirectory, { recursive: true });

  const app = express();
  app.use(express.json({ limit: '5mb' }));

  if (staticJsDir) {
    app.use('/js', express.static(staticJsDir));
  }

  if (editorHtmlPath) {
    app.get('/', async (_req, res) => {
      try {
        const html = await readFile(editorHtmlPath, 'utf-8');
        res.type('html').send(html);
      } catch (err) {
        res.status(500).send(`Failed to load editor: ${err.message}`);
      }
    });
  }

  const sseClients = new Set();
  const noCache = (_req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  };

  const broadcastSSE = (event, data) => {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of sseClients) {
      client.write(payload);
    }
  };

  app.get('/slides/:file', noCache, async (req, res) => {
    let file;
    try {
      file = normalizeSlideFilename(req.params.file, 'slide filename');
    } catch {
      return res.status(400).send('Invalid slide filename');
    }
    const filePath = join(slidesDirectory, file);
    try {
      const html = await readFile(filePath, 'utf-8');
      return res.type('html').send(html);
    } catch {
      return res.status(404).send(`Slide not found: ${file}`);
    }
  });

  app.get('/api/slides', noCache, async (_req, res) => {
    try {
      const files = await listSlideFiles(slidesDirectory);
      return res.json(files);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/slides/:file/save', async (req, res) => {
    let file;
    try {
      file = normalizeSlideFilename(req.params.file, '`slide`');
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const bodySlide = req.body?.slide;
    if (bodySlide !== undefined) {
      let normalizedBodySlide;
      try {
        normalizedBodySlide = normalizeSlideFilename(bodySlide, '`slide`');
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
      if (normalizedBodySlide !== file) {
        return res.status(400).json({ error: '`slide` does not match the requested file.' });
      }
    }

    let html;
    try {
      html = normalizeSlideHtml(req.body?.html);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const filePath = join(slidesDirectory, file);
    try {
      await readFile(filePath, 'utf-8');
    } catch {
      return res.status(404).json({ error: `Slide not found: ${file}` });
    }

    try {
      await writeFile(filePath, html, 'utf8');
      if (onManualSave) {
        await onManualSave({
          file,
          filePath,
          html,
          intent: req.body?.intent || '',
          bytes: Buffer.byteLength(html, 'utf8'),
        });
      }
      return res.json({
        success: true,
        slide: file,
        bytes: Buffer.byteLength(html, 'utf8'),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: `Failed to save ${file}: ${error.message}`,
      });
    }
  });

  app.get('/api/events', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('event: connected\ndata: {}\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
  });

  return { app, slidesDirectory, broadcastSSE, sseClients };
}

export async function startCoreServer({
  port,
  slidesDir,
  editorHtmlPath = null,
  staticJsDir = null,
  onManualSave = null,
  onAppReady = null,
  openBrowser = true,
} = {}) {
  const core = await createCoreApp({ slidesDir, editorHtmlPath, staticJsDir, onManualSave });
  const watcher = fsWatch(core.slidesDirectory, { persistent: true }, (_eventType, filename) => {
    if (!filename || !SLIDE_FILE_PATTERN.test(filename)) return;
    core.broadcastSSE('fileChanged', { file: filename });
  });

  const server = core.app.listen(port, () => {
    const url = `http://localhost:${port}`;
    if (onAppReady) {
      onAppReady({ url, slidesDirectory: core.slidesDirectory });
    } else {
      process.stdout.write('\n  slides-grab editor\n');
      process.stdout.write('  ─────────────────────────────────────\n');
      process.stdout.write(`  Local:       ${url}\n`);
      process.stdout.write(`  Slides:      ${core.slidesDirectory}\n`);
      process.stdout.write('  ─────────────────────────────────────\n\n');
    }
    if (openBrowser) {
      const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      exec(`${cmd} ${url}`);
    }
  });

  async function shutdown() {
    watcher.close();
    for (const client of core.sseClients) {
      client.end();
    }
    core.sseClients.clear();
    server.close();
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { server, watcher };
}
