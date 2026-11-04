// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const { validateManifest } = createRequire(import.meta.url)('../scripts/validate-office-manifest.cjs');
const manifest = readFileSync(new URL('../public/office/quizzz-manifest.xml', import.meta.url), 'utf8');

describe('PowerPoint content add-in manifest dimensions', () => {
  it('accepts the released manifest and preserves the existing add-in ID', () => {
    expect(validateManifest(manifest)).toBe(true);
    expect(manifest).toContain('<Id>b613fe44-4b37-421a-a39e-cd8597aeaa71</Id>');
  });
  it('rejects the previous 1280-pixel width before packaging the installer', () => {
    expect(() => validateManifest(manifest.replace('<RequestedWidth>960', '<RequestedWidth>1280'))).toThrow(/RequestedWidth/);
  });
  it('rejects missing, fractional, too small and oversized dimensions', () => {
    for (const name of ['RequestedWidth', 'RequestedHeight']) {
      for (const value of ['31', '1001', '540.5', '']) {
        expect(() => validateManifest(manifest.replace(new RegExp(`<${name}>\\d+</${name}>`), `<${name}>${value}</${name}>`))).toThrow(name);
      }
    }
  });
});
