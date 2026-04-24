#!/usr/bin/env node

import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { watch as fsWatch } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

import { createCoreApp, listSlideFiles, parseArgs, printUsage } from '../../slides-grab-core/scripts/server.js';
import { listTemplates, saveTemplate } from '../src/save-template.js';
import { createStateManager } from '../../../.claude/lib/state-manager.js';
import {
  createManualCheckpoint,
  listAvailableCheckpoints,
  restoreFromCheckpoint,
} from '../../../.claude/lib/checkpoint-orchestrator.js';
import { resolveProjectPaths } from '../../../.claude/lib/workspace-paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '..');

function buildSessionId() {
  return `session-${Date.now()}`;
}

async function bootstrapSessionProject({ workspaceRoot, sessionId, sourceSlidesDir }) {
  const projectPaths = resolveProjectPaths(workspaceRoot, sessionId);
  await mkdir(projectPaths.projectRoot, { recursive: true });
  await mkdir(projectPaths.inputDir, { recursive: true });
  await mkdir(projectPaths.draftSlidesDir, { recursive: true });
  await mkdir(projectPaths.checkpointsDir, { recursive: true });

  const stateManager = createStateManager(projectPaths.projectRoot, sessionId);
  await stateManager.initial({
    sourceType: 'file',
    classification: 'prepared',
    sourcePath: resolve(process.cwd(), sourceSlidesDir),
  });

  const sourceRoot = resolve(process.cwd(), sourceSlidesDir);
  const slides = await listSlideFiles(sourceRoot);
  for (const slide of slides) {
    await copyFile(join(sourceRoot, slide), join(projectPaths.draftSlidesDir, slide));
  }

  return { projectPaths, stateManager };
}

export async function createCopyApp(opts) {
  const workspaceRoot = resolve(process.cwd(), '_workspace-copy');
  const sessionId = buildSessionId();
  const { projectPaths, stateManager } = await bootstrapSessionProject({
    workspaceRoot,
    sessionId,
    sourceSlidesDir: opts.slidesDir,
  });
  const sessionRoot = projectPaths.projectRoot;

  const core = await createCoreApp({
    slidesDir: projectPaths.draftSlidesDir,
    editorHtmlPath: join(PACKAGE_ROOT, 'src', 'editor', 'copy-editor.html'),
    staticJsDir: join(PACKAGE_ROOT, 'src', 'editor', 'js'),
  });

  const { app, broadcastSSE } = core;
  app.locals.__slidesGrabCore = core;
  app.locals.copySession = { sessionId, sessionRoot, workspaceRoot, projectPaths, stateManager };

  app.get('/api/session', (_req, res) => {
    res.json({ sessionId, sessionRoot, statePath: projectPaths.statePath });
  });

  app.get('/api/template-meta', (_req, res) => {
    res.json({
      saveMode: 'existing',
      templateName: '',
      layoutName: '',
    });
  });

  app.get('/api/templates', async (_req, res) => {
    const templates = await listTemplates(process.env.PPT_TEMPLATE_BASE_DIR || resolve(process.cwd(), 'base-templates'));
    res.json({ templates });
  });

  app.get('/api/checkpoints', async (_req, res) => {
    const checkpoints = await listAvailableCheckpoints({ workspaceRoot, projectName: sessionId });
    res.json({ checkpoints });
  });

  app.post('/api/checkpoints', async (req, res) => {
    try {
      const checkpoint = await createManualCheckpoint({
        workspaceRoot,
        projectName: sessionId,
        label: req.body?.label || 'manual',
        stateManager,
      });
      return res.json({ success: true, checkpoint });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message, code: error.code || 'CHECKPOINT_CREATE_FAILED' });
    }
  });

  app.post('/api/checkpoints/restore', async (req, res) => {
    try {
      const restored = await restoreFromCheckpoint({
        workspaceRoot,
        projectName: sessionId,
        checkpointName: req.body?.checkpointName,
        stateManager,
      });
      broadcastSSE('checkpointRestored', { checkpointName: req.body?.checkpointName });
      return res.json({ success: true, restored });
    } catch (error) {
      const status = error.code === 'CHECKPOINT_NOT_FOUND' ? 404 : 400;
      return res.status(status).json({ success: false, error: error.message, code: error.code || 'CHECKPOINT_RESTORE_FAILED' });
    }
  });

  app.post('/api/template/save', async (req, res) => {
    try {
      const target = await saveTemplate({
        baseDir: process.env.PPT_TEMPLATE_BASE_DIR || resolve(process.cwd(), 'base-templates'),
        archetype: req.body?.templateName,
        slotName: req.body?.layoutName,
        html: req.body?.html || '',
        mode: req.body?.saveMode || 'existing',
      });
      return res.json({ success: true, target });
    } catch (error) {
      const status = error.code === 'TEMPLATE_EXISTS' ? 409 : 400;
      return res.status(status).json({ success: false, error: error.message, code: error.code || 'SAVE_FAILED' });
    }
  });

  return { app, sessionId, sessionRoot, projectPaths };
}

export async function startCopyServer(opts) {
  const { app } = await createCopyApp(opts);
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
    process.stdout.write('\n  slides-grab-copy editor\n');
    process.stdout.write('  ─────────────────────────────────────\n');
    process.stdout.write(`  Local:       ${url}\n`);
    process.stdout.write(`  Slides:      ${slidesDirectory}\n`);
    process.stdout.write('  ─────────────────────────────────────\n\n');
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${cmd} ${url}`);
  });

  async function shutdown() {
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

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('copy-server.js')) {
  const args = process.argv.slice(2);
  let opts;
  try {
    opts = parseArgs(args);
  } catch (error) {
    process.stderr.write(`[copy-editor] ${error.message}\n`);
    process.exit(1);
  }
  if (opts.help) {
    printUsage({ name: 'slides-grab-copy' });
    process.exit(0);
  }
  startCopyServer(opts).catch((err) => {
    process.stderr.write(`[copy-editor] Fatal: ${err.message}\n`);
    process.exit(1);
  });
}
