import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function pad(value) {
  return String(value).padStart(2, '0');
}

function timestamp(ts = new Date()) {
  return [
    ts.getUTCFullYear(),
    '-',
    pad(ts.getUTCMonth() + 1),
    '-',
    pad(ts.getUTCDate()),
    '-',
    pad(ts.getUTCHours()),
    pad(ts.getUTCMinutes()),
    pad(ts.getUTCSeconds()),
  ].join('');
}

async function copyDraftEntries(srcDir, destDir) {
  await mkdir(destDir, { recursive: true });
  const entries = await readdir(srcDir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    await cp(join(srcDir, entry.name), join(destDir, entry.name), { recursive: true });
  }
}

async function resetDraftDir(draftDir) {
  const entries = await readdir(draftDir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    await rm(join(draftDir, entry.name), { recursive: true, force: true });
  }
}

export async function createCheckpoint({ projectPaths, label = 'manual', stateManager = null, ts = new Date() }) {
  const name = `${timestamp(ts)}-${label}`;
  const checkpointDir = join(projectPaths.checkpointsDir, name);
  await copyDraftEntries(projectPaths.draftDir, checkpointDir);
  if (stateManager) {
    await stateManager.appendHistory({ event: 'checkpoint_created', checkpoint: name, label });
  }
  return { name, checkpointDir };
}

export async function listCheckpoints({ projectPaths }) {
  const entries = await readdir(projectPaths.checkpointsDir, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));
}

export async function restoreCheckpoint({ projectPaths, checkpointName, stateManager = null, ts = new Date() }) {
  const sourceDir = join(projectPaths.checkpointsDir, checkpointName);
  await createCheckpoint({ projectPaths, label: 'auto-pre-restore', stateManager, ts });
  await mkdir(projectPaths.draftDir, { recursive: true });
  await resetDraftDir(projectPaths.draftDir);
  await copyDraftEntries(sourceDir, projectPaths.draftDir);
  if (stateManager) {
    await stateManager.appendHistory({ event: 'checkpoint_restored', checkpoint: checkpointName });
  }
  return { restoredFrom: checkpointName };
}
