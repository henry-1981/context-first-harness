import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { resolveProjectPaths, resolveStatePath, resolveWorkspaceRoot } from './workspace-paths.js';

let repoRoot;

test.beforeEach(async () => {
  repoRoot = await mkdtemp(join(tmpdir(), 'workspace-paths-'));
  await writeFile(join(repoRoot, '.git'), 'gitdir: fake\n', 'utf8');
  await mkdir(join(repoRoot, 'tools', 'presentation'), { recursive: true });
});

test.afterEach(async () => {
  await rm(repoRoot, { recursive: true, force: true });
});

test('resolveWorkspaceRoot prefers PPT_WORKSPACE_ROOT when set', () => {
  const result = resolveWorkspaceRoot({
    env: { PPT_WORKSPACE_ROOT: 'deliverables/presentations' },
    cwd: join(repoRoot, 'presentation'),
  });
  assert.equal(result, join(repoRoot, 'deliverables', 'presentations'));
});

test('resolveWorkspaceRoot falls back to tools/presentation/_workspace when unset', () => {
  const result = resolveWorkspaceRoot({
    env: {},
    cwd: join(repoRoot, 'tools', 'presentation'),
  });
  assert.equal(result, join(repoRoot, 'tools', 'presentation', '_workspace'));
});

test('resolveProjectPaths returns the 6-category workspace shape', () => {
  const paths = resolveProjectPaths(join(repoRoot, 'tools', 'presentation', '_workspace-root'), 'demo-proj');
  assert.equal(paths.projectRoot, join(repoRoot, 'tools', 'presentation', '_workspace-root', 'demo-proj'));
  assert.equal(paths.inputDir, join(paths.projectRoot, 'input'));
  assert.equal(paths.draftDir, join(paths.projectRoot, 'draft'));
  assert.equal(paths.checkpointsDir, join(paths.projectRoot, 'checkpoints'));
  assert.equal(paths.samplesDir, join(paths.projectRoot, 'samples'));
  assert.equal(paths.exportDir, join(paths.projectRoot, 'export'));
  assert.equal(paths.verifyDir, join(paths.projectRoot, 'verify'));
  assert.equal(paths.logsDir, join(paths.projectRoot, 'logs'));
});

test('resolveStatePath returns project state path from workspace root', () => {
  const result = resolveStatePath({
    env: { PPT_WORKSPACE_ROOT: resolve(repoRoot, 'drafts/presentations') },
    cwd: join(repoRoot, 'tools', 'presentation'),
    projectName: 'demo-proj',
  });
  assert.equal(result, join(repoRoot, 'drafts', 'presentations', 'demo-proj', 'state.json'));
});
