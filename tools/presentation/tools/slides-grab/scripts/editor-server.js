#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { watch as fsWatch } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { createCoreApp, parseArgs, printUsage } from '../../slides-grab-core/scripts/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = process.env.PPT_AGENT_PACKAGE_ROOT || resolve(__dirname, '..');

function normalizeSlideFilename(rawSlide, source = '`slide`') {
  const slide = typeof rawSlide === 'string' ? basename(rawSlide.trim()) : '';
  if (!slide || !/\.html$/i.test(slide)) {
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

function extractSlideNumber(filename) {
  const m = (filename || '').match(/(\d+)/);
  return m ? Number.parseInt(m[1], 10) : 0;
}

async function appendEditorSaveEvent({ slide, engine, intent, diffBytes }) {
  const statePath = process.env.PPT_STATE_PATH;
  if (!statePath) {
    // 에디터 단독 실행 호환. PPT_STATE_PATH 미지정 시 state.json append skip
    return;
  }
  const ev = {
    event: 'editor_save',
    slide,
    engine,
    intent: intent || '',
    diff_bytes: diffBytes,
    ts: new Date().toISOString(),
  };

  // 경로 A: state-manager 경유 (Chunk 1 API와 정합)
  try {
    const { createStateManager } = await import('../../../.claude/lib/state-manager.js');
    const sm = createStateManager(dirname(statePath), basename(statePath).replace(/\.state\.json$/, ''));
    const state = await sm.read();
    const current = Array.isArray(state.design?.editor_history) ? state.design.editor_history : [];
    current.push(ev);
    // ⚠ 순서 중요: writeStage가 editor_history를 먼저 기록, appendHistory가 그 결과를 읽어 history[] append
    await sm.writeStage('design', { editor_history: current });
    await sm.appendHistory(ev);
    return;
  } catch (err) {
    if (err.code !== 'ERR_MODULE_NOT_FOUND' && err.code !== 'ENOENT') {
      // state.json append 실패는 HTML save를 막지 않는다 (HTML 무결성 우선)
      console.error(`[editor-server] state.json append 실패 (경로 A): ${err.message}`);
      return;
    }
  }

  // 경로 B: pure fs fallback (state-manager 미구현 환경)
  try {
    const raw = await readFile(statePath, 'utf8');
    const state = JSON.parse(raw);
    if (!state.design) state.design = {};
    if (!Array.isArray(state.design.editor_history)) state.design.editor_history = [];
    if (!Array.isArray(state.history)) state.history = [];
    state.design.editor_history.push(ev);
    state.history.push({ ts: ev.ts, ...ev });
    await writeFile(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
  } catch (err) {
    console.error(`[editor-server] state.json append 실패 (경로 B): ${err.message}`);
  }
}

// ── Layer 2 helper: stdin/stdout streaming wrapper (Task 5.3 edit-subprocess 의존) ──
async function runEngineStdio(spawnEngine, { filePath, xpath, intent, engine }) {
  const proc = spawnEngine([
    '--prompt-file', resolve(PACKAGE_ROOT, 'src', 'editor', 'editor-codex-prompt.md'),
    '--file', filePath,
    ...(xpath ? ['--xpath', xpath] : []),
  ], { stdio: ['pipe', 'pipe', 'pipe'] });

  return new Promise((resolveP, rejectP) => {
    const chunks = [];
    const errChunks = [];
    proc.stdout.on('data', (c) => chunks.push(c));
    proc.stderr.on('data', (c) => errChunks.push(c));
    proc.stdin.write(intent + '\n');
    proc.stdin.end();
    proc.on('error', rejectP);
    proc.on('close', (code) => {
      if (code !== 0) {
        rejectP(new Error(`${engine} exit ${code}: ${Buffer.concat(errChunks).toString()}`));
        return;
      }
      resolveP(Buffer.concat(chunks).toString('utf8'));
    });
  });
}

export async function createApp(opts) {
  const core = await createCoreApp({
    slidesDir: opts.slidesDir,
    editorHtmlPath: join(PACKAGE_ROOT, 'src', 'editor', 'editor.html'),
    staticJsDir: join(PACKAGE_ROOT, 'src', 'editor', 'js'),
    onManualSave: async ({ file, html, intent, bytes }) => {
      await appendEditorSaveEvent({
        slide: extractSlideNumber(file),
        engine: 'manual',
        intent: intent || '',
        diffBytes: bytes ?? Buffer.byteLength(html, 'utf8'),
      });
    },
  });
  const { app } = core;
  app.locals.__slidesGrabCore = core;

  const slidesDirectory = resolve(process.cwd(), opts.slidesDir);

  // ── Layer 2: POST /api/edit/ai ──
  app.post('/api/edit/ai', async (req, res) => {
    const file = req.body?.file;
    const intent = req.body?.intent;
    const xpath = req.body?.xpath ?? null;
    const engine = req.body?.engine ?? (process.env.PPT_EDIT_ENGINE || 'codex');

    if (typeof intent !== 'string' || intent.trim() === '') {
      return res.status(400).json({ success: false, error: '`intent` is required.' });
    }
    let normalizedFile;
    try {
      normalizedFile = normalizeSlideFilename(file, '`file`');
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    const filePath = join(slidesDirectory, normalizedFile);
    try {
      await readFile(filePath, 'utf-8');
    } catch {
      return res.status(404).json({ success: false, error: `Slide not found: ${normalizedFile}` });
    }

    const startedAt = Date.now();
    try {
      // STUB 모드: 테스트 격리용. PPT_EDIT_ENGINE_STUB=1 시 실제 spawn 생략
      let newHtml;
      let diffBytes;
      if (process.env.PPT_EDIT_ENGINE_STUB === '1') {
        newHtml = await readFile(filePath, 'utf-8');
        diffBytes = Buffer.byteLength(newHtml, 'utf8');
      } else {
        const { spawnEngine } = await import('../src/editor/edit-subprocess.js');
        newHtml = await runEngineStdio(spawnEngine, { filePath, xpath, intent, engine });
        await writeFile(filePath, newHtml, 'utf8');
        diffBytes = Buffer.byteLength(newHtml, 'utf8');
      }
      await appendEditorSaveEvent({
        slide: extractSlideNumber(normalizedFile),
        engine,
        intent,
        diffBytes,
      });
      return res.json({
        success: true,
        file: normalizedFile,
        engine,
        diff_bytes: diffBytes,
        duration_ms: Date.now() - startedAt,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  return app;
}

export async function startServer(opts) {
  const app = await createApp(opts);
  const { slidesDirectory, broadcastSSE, sseClients } = app.locals.__slidesGrabCore;

  let debounceTimer = null;
  const watcher = fsWatch(slidesDirectory, { persistent: true }, (_eventType, filename) => {
    if (!filename || !/\.html$/i.test(filename)) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      broadcastSSE('fileChanged', { file: filename });
    }, 300);
  });

  const server = app.listen(opts.port, () => {
    const url = `http://localhost:${opts.port}`;
    process.stdout.write('\n  slides-grab editor\n');
    process.stdout.write('  ─────────────────────────────────────\n');
    process.stdout.write(`  Local:       ${url}\n`);
    process.stdout.write(`  Slides:      ${slidesDirectory}\n`);
    process.stdout.write('  ─────────────────────────────────────\n\n');
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${cmd} ${url}`);
  });

  async function shutdown() {
    process.stdout.write('\n[editor] Shutting down...\n');
    watcher.close();
    for (const client of sseClients) {
      client.end();
    }
    sseClients.clear();
    server.close();
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// CLI 직접 실행에서만 기동. 테스트에서 import 시에는 실행 skip
if (import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1]?.endsWith('editor-server.js')) {
  const args = process.argv.slice(2);
  let opts;
  try {
    opts = parseArgs(args);
  } catch (error) {
    process.stderr.write(`[editor] ${error.message}\n`);
    process.exit(1);
  }
  if (opts.help) {
    printUsage();
    process.exit(0);
  }
  startServer(opts).catch((err) => {
    process.stderr.write(`[editor] Fatal: ${err.message}\n`);
    process.exit(1);
  });
}
