import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('template directory discovery', () => {
  it('has warm and healthcare slide template directories', () => {
    const warmDir = join(__dirname, 'templates-slide-warm');
    const healthcareDir = join(__dirname, 'templates-slide-healthcare');
    expect(existsSync(warmDir)).toBe(true);
    expect(existsSync(healthcareDir)).toBe(true);
  });

  it('contains html templates in both directories', () => {
    const warmTemplates = readdirSync(join(__dirname, 'templates-slide-warm')).filter((entry) => entry.endsWith('.html'));
    const healthcareTemplates = readdirSync(join(__dirname, 'templates-slide-healthcare')).filter((entry) => entry.endsWith('.html'));
    expect(warmTemplates.length).toBeGreaterThan(0);
    expect(healthcareTemplates.length).toBeGreaterThan(0);
  });
});
