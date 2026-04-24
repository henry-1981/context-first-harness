// presentation/.claude/lib/state-manager.js
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { resolveProjectPaths } from './workspace-paths.js';

// Keys that belong to other stages — blocked from cross-stage writes
const OTHER_STAGE_KEYS = {
  plan: ['design', 'export'],
  design: ['plan', 'export'],
  export: ['plan', 'design']
};

export function createStateManager(workdir, projectName) {
  const statePath = join(workdir, 'state.json');

  async function read() {
    const raw = await readFile(statePath, 'utf8');
    return JSON.parse(raw);
  }

  async function write(state) {
    await writeFile(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
  }

  async function initial({ sourceType, classification, sourcePath }) {
    const now = new Date().toISOString();
    const state = {
      project: projectName,
      created: now,
      spec_version: 'presentation-refactor-v1',
      source: { type: sourceType, classification, ...(sourcePath ? { path: sourcePath } : {}) },
      config: { mode: 'pptx', mode_variant: 'templateSet' },
      plan: { status: 'ready' },
      design: { status: 'ready' },
      export: {},
      history: []
    };
    await write(state);
    return state;
  }

  async function writeStage(stage, partial) {
    const blocked = OTHER_STAGE_KEYS[stage];
    if (!blocked) throw new Error(`unknown stage '${stage}'`);
    for (const k of Object.keys(partial)) {
      if (blocked.includes(k)) {
        throw new Error(`key '${k}' not owned by stage '${stage}'`);
      }
    }
    const state = await read();
    // Merge partial into state[stage] sub-object
    state[stage] = { ...(state[stage] || {}), ...partial };
    await write(state);
  }

  async function appendHistory(event) {
    const state = await read();
    state.history.push({ ts: new Date().toISOString(), ...event });
    await write(state);
  }

  return { read, initial, writeStage, appendHistory, statePath };
}

export function createStateManagerFromWorkspaceRoot(workspaceRoot, projectName) {
  const projectPaths = resolveProjectPaths(workspaceRoot, projectName);
  return createStateManager(projectPaths.projectRoot, projectName);
}
