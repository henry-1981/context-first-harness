import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export const DEFAULT_OUTPUT_DIR = join(homedir(), 'Desktop');

export function getOutputDir(): string {
  // Check CLAUDE.md for outputDir setting
  const claudeMdPath = join(process.cwd(), 'CLAUDE.md');
  if (existsSync(claudeMdPath)) {
    const content = readFileSync(claudeMdPath, 'utf-8');
    const match = content.match(/outputDir:\s*(.+)/);
    if (match) {
      const dir = match[1].trim();
      if (existsSync(dir)) return dir;
    }
  }
  return DEFAULT_OUTPUT_DIR;
}
