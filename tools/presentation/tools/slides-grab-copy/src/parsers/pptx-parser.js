import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function parsePptx(sourcePath, { slideIndex = 0, commandRunner = execFileAsync, pythonBin = 'python3' } = {}) {
  const scriptPath = resolve(process.cwd(), 'tools/slides-grab-copy/parsers/python/pptx_parser.py');
  try {
    const { stdout } = await commandRunner(pythonBin, [scriptPath, sourcePath, String(slideIndex)]);
    const parsed = JSON.parse(stdout);
    if (parsed.error) {
      throw new Error(parsed.error);
    }
    return parsed;
  } catch (error) {
    if (/python-pptx is not installed/i.test(error.message)) {
      throw new Error('python-pptx is not installed. Run bash tools/slides-grab-copy/parsers/python/bootstrap.sh first.');
    }
    throw error;
  }
}
