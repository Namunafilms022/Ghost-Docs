import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { RepoError } from '@ghost-docs/intelligence-engine';

describe('Error Handling', () => {
  it('RepoError includes code and message', () => {
    const err = new RepoError('Test error', 'TEST_CODE');
    expect(err.message).toBe('Test error');
    expect(err.code).toBe('TEST_CODE');
    expect(err.name).toBe('RepoError');
  });

  it('rejects non-existent path', async () => {
    const { extractKnowledge } = await import('@ghost-docs/intelligence-engine');
    await expect(
      extractKnowledge({ repoUrl: '/nonexistent/path/12345' }),
    ).rejects.toThrow();
  });

  it('handles empty directory gracefully', async () => {
    const { scanDirectory } = await import('@ghost-docs/intelligence-engine');
    const { mkdtempSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { tmpdir } = await import('node:os');
    const emptyDir = join(tmpdir(), 'ghost-docs-empty-test');
    mkdtempSync(emptyDir);

    const result = await scanDirectory(emptyDir);
    expect(result.totalFiles).toBe(0);
    expect(result.totalDirs).toBe(0);
  });

  it('handles directory without package.json', async () => {
    const FIXTURE_PATH = resolve(__dirname, 'fixtures/sample-repo');
    const { extractKnowledge } = await import('@ghost-docs/intelligence-engine');
    const kg = await extractKnowledge({ repoUrl: FIXTURE_PATH, tempDir: '/tmp' });
    expect(kg.project_summary).toBeTruthy();
    expect(kg.entry_points).toBeDefined();
    expect(kg.direct_dependencies).toBeDefined();
  });
});
