import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createManualCheckpoint,
  listAvailableCheckpoints,
  restoreFromCheckpoint,
} from './checkpoint-orchestrator.js';
import { createStateManager } from './state-manager.js';
import { resolveProjectPaths } from './workspace-paths.js';

let workspaceRoot;
let projectName;
let projectPaths;
let stateManager;

async function seedDraft({ outline = 'outline-v1', slide = 'slide-v1' } = {}) {
  await mkdir(projectPaths.draftSlidesDir, { recursive: true });
  await writeFile(projectPaths.draftOutlinePath, outline, 'utf8');
  await writeFile(join(projectPaths.draftSlidesDir, 'slide-01.html'), slide, 'utf8');
}

test.beforeEach(async () => {
  workspaceRoot = await mkdtemp(join(tmpdir(), 'checkpoint-orchestrator-'));
  projectName = 'demo-proj';
  projectPaths = resolveProjectPaths(workspaceRoot, projectName);
  await mkdir(projectPaths.projectRoot, { recursive: true });
  stateManager = createStateManager(projectPaths.projectRoot, projectName);
  await stateManager.initial({
    sourceType: 'file',
    classification: 'prepared',
    sourcePath: 'slides/source',
  });
  await seedDraft();
});

test.afterEach(async () => {
  await rm(workspaceRoot, { recursive: true, force: true });
});

test('createManualCheckpoint snapshots current draft and appends history', async () => {
  const checkpoint = await createManualCheckpoint({
    workspaceRoot,
    projectName,
    label: 'baseline',
    stateManager,
    ts: new Date('2026-04-23T01:02:03Z'),
  });

  const outline = await readFile(join(checkpoint.checkpointDir, 'outline.md'), 'utf8');
  const slide = await readFile(join(checkpoint.checkpointDir, 'slides', 'slide-01.html'), 'utf8');
  const state = await stateManager.read();

  assert.equal(checkpoint.name, '2026-04-23-010203-baseline');
  assert.equal(outline, 'outline-v1');
  assert.equal(slide, 'slide-v1');
  assert.equal(state.history.at(-1).event, 'checkpoint_created');
});

test('listAvailableCheckpoints returns newest-first checkpoint payload', async () => {
  await createManualCheckpoint({
    workspaceRoot,
    projectName,
    label: 'older',
    ts: new Date('2026-04-23T01:00:00Z'),
  });
  await createManualCheckpoint({
    workspaceRoot,
    projectName,
    label: 'newer',
    ts: new Date('2026-04-23T02:00:00Z'),
  });

  const checkpoints = await listAvailableCheckpoints({ workspaceRoot, projectName });
  assert.deepEqual(
    checkpoints.map((entry) => entry.name),
    ['2026-04-23-020000-newer', '2026-04-23-010000-older'],
  );
});

test('restoreFromCheckpoint creates auto-pre-restore safety snapshot then restores draft', async () => {
  const checkpoint = await createManualCheckpoint({
    workspaceRoot,
    projectName,
    label: 'target',
    stateManager,
    ts: new Date('2026-04-23T03:00:00Z'),
  });
  await seedDraft({ outline: 'outline-v2', slide: 'slide-v2' });

  const result = await restoreFromCheckpoint({
    workspaceRoot,
    projectName,
    checkpointName: checkpoint.name,
    stateManager,
    ts: new Date('2026-04-23T04:00:00Z'),
  });

  const outline = await readFile(projectPaths.draftOutlinePath, 'utf8');
  const slide = await readFile(join(projectPaths.draftSlidesDir, 'slide-01.html'), 'utf8');
  const checkpoints = await listAvailableCheckpoints({ workspaceRoot, projectName });
  const state = await stateManager.read();

  assert.equal(result.restoredFrom, checkpoint.name);
  assert.equal(outline, 'outline-v1');
  assert.equal(slide, 'slide-v1');
  assert.ok(checkpoints.some((entry) => entry.name === '2026-04-23-040000-auto-pre-restore'));
  assert.equal(state.history.at(-1).event, 'checkpoint_restored');
});
