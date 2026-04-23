import { stat } from 'node:fs/promises';
import { join } from 'node:path';

import { createCheckpoint, listCheckpoints, restoreCheckpoint } from './checkpoint-manager.js';
import { resolveProjectPaths } from './workspace-paths.js';

function withProjectPaths(workspaceRoot, projectName) {
  return resolveProjectPaths(workspaceRoot, projectName);
}

export async function createManualCheckpoint({
  workspaceRoot,
  projectName,
  label = 'manual',
  stateManager = null,
  ts = new Date(),
}) {
  const projectPaths = withProjectPaths(workspaceRoot, projectName);
  return createCheckpoint({ projectPaths, label, stateManager, ts });
}

export async function listAvailableCheckpoints({ workspaceRoot, projectName }) {
  const projectPaths = withProjectPaths(workspaceRoot, projectName);
  const names = await listCheckpoints({ projectPaths });
  return names.map((name) => ({
    name,
    checkpointDir: join(projectPaths.checkpointsDir, name),
  }));
}

export async function restoreFromCheckpoint({
  workspaceRoot,
  projectName,
  checkpointName,
  stateManager = null,
  ts = new Date(),
}) {
  const projectPaths = withProjectPaths(workspaceRoot, projectName);
  try {
    await stat(join(projectPaths.checkpointsDir, checkpointName));
  } catch {
    const error = new Error('Checkpoint not found.');
    error.code = 'CHECKPOINT_NOT_FOUND';
    throw error;
  }
  return restoreCheckpoint({ projectPaths, checkpointName, stateManager, ts });
}
