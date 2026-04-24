import { existsSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';

function findRepoRoot(startCwd) {
  let current = resolve(startCwd);
  while (true) {
    if (existsSync(join(current, '.git'))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      return resolve(startCwd);
    }
    current = parent;
  }
}

export function resolveWorkspaceRoot({ env = process.env, cwd = process.cwd(), defaultRoot = 'tools/presentation/_workspace' } = {}) {
  const repoRoot = findRepoRoot(cwd);
  const configured = env.PPT_WORKSPACE_ROOT?.trim();
  if (configured) {
    return isAbsolute(configured) ? configured : resolve(repoRoot, configured);
  }
  return resolve(repoRoot, defaultRoot);
}

export function resolveProjectPaths(workspaceRoot, projectName) {
  const projectRoot = resolve(workspaceRoot, projectName);
  const inputDir = join(projectRoot, 'input');
  const draftDir = join(projectRoot, 'draft');
  return {
    workspaceRoot: resolve(workspaceRoot),
    projectName,
    projectRoot,
    statePath: join(projectRoot, 'state.json'),
    inputDir,
    inputFile: join(inputDir, 'input.md'),
    inputImagesDir: join(inputDir, 'images'),
    inputReferencesDir: join(inputDir, 'references'),
    draftDir,
    draftOutlinePath: join(draftDir, 'outline.md'),
    draftSlidesDir: join(draftDir, 'slides'),
    checkpointsDir: join(projectRoot, 'checkpoints'),
    samplesDir: join(projectRoot, 'samples'),
    exportDir: join(projectRoot, 'export'),
    verifyDir: join(projectRoot, 'verify'),
    logsDir: join(projectRoot, 'logs'),
  };
}

export function resolveStatePath({ env = process.env, cwd = process.cwd(), defaultRoot = 'tools/presentation/_workspace', projectName }) {
  return resolveProjectPaths(resolveWorkspaceRoot({ env, cwd, defaultRoot }), projectName).statePath;
}
