import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createCheckpoint, listCheckpoints, restoreCheckpoint } from './checkpoint-manager.js';
import { createStateManager } from './state-manager.js';
import { resolveProjectPaths } from './workspace-paths.js';

let workspaceRoot;
let projectPaths;
let stateManager;

async function seedDraft(outlineText = 'outline-v1', slideText = 'slide-v1') {
  await mkdir(projectPaths.draftSlidesDir, { recursive: true });
  await writeFile(projectPaths.draftOutlinePath, outlineText, 'utf8');
  await writeFile(join(projectPaths.draftSlidesDir, 'slide-01.html'), slideText, 'utf8');
}

test.beforeEach(async () => {
  workspaceRoot = await mkdtemp(join(tmpdir(), 'checkpoint-mgr-'));
  projectPaths = resolveProjectPaths(workspaceRoot, 'demo-proj');
  await mkdir(projectPaths.projectRoot, { recursive: true });
  stateManager = createStateManager(projectPaths.projectRoot, 'demo-proj');
  await stateManager.initial({ sourceType: 'file', classification: 'prepared' });
  await seedDraft();
});

test.afterEach(async () => {
  await rm(workspaceRoot, { recursive: true, force: true });
});

test('createCheckpoint copies draft contents into checkpoints directory', async () => {
  const result = await createCheckpoint({ projectPaths, label: 'manual', stateManager, ts: new Date('2026-04-22T01:02:03Z') });
  const outline = await readFile(join(result.checkpointDir, 'outline.md'), 'utf8');
  const slide = await readFile(join(result.checkpointDir, 'slides', 'slide-01.html'), 'utf8');
  assert.equal(outline, 'outline-v1');
  assert.equal(slide, 'slide-v1');
  const state = await stateManager.read();
  assert.equal(state.history.at(-1).event, 'checkpoint_created');
});

test('listCheckpoints returns newest-first checkpoint names', async () => {
  await createCheckpoint({ projectPaths, label: 'older', ts: new Date('2026-04-22T01:00:00Z') });
  await createCheckpoint({ projectPaths, label: 'newer', ts: new Date('2026-04-22T02:00:00Z') });
  const checkpoints = await listCheckpoints({ projectPaths });
  assert.deepEqual(checkpoints, [
    '2026-04-22-020000-newer',
    '2026-04-22-010000-older',
  ]);
});

test('restoreCheckpoint creates safety snapshot and restores draft contents', async () => {
  const first = await createCheckpoint({ projectPaths, label: 'target', ts: new Date('2026-04-22T03:00:00Z') });
  await writeFile(projectPaths.draftOutlinePath, 'outline-v2', 'utf8');
  await writeFile(join(projectPaths.draftSlidesDir, 'slide-01.html'), 'slide-v2', 'utf8');

  await restoreCheckpoint({
    projectPaths,
    checkpointName: first.name,
    stateManager,
    ts: new Date('2026-04-22T04:00:00Z'),
  });

  const restoredOutline = await readFile(projectPaths.draftOutlinePath, 'utf8');
  const restoredSlide = await readFile(join(projectPaths.draftSlidesDir, 'slide-01.html'), 'utf8');
  assert.equal(restoredOutline, 'outline-v1');
  assert.equal(restoredSlide, 'slide-v1');

  const checkpoints = await listCheckpoints({ projectPaths });
  assert.ok(checkpoints.includes('2026-04-22-040000-auto-pre-restore'));

  const state = await stateManager.read();
  assert.equal(state.history.at(-1).event, 'checkpoint_restored');
});
