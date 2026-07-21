import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@ghost-docs/types': resolve(__dirname, 'packages/types/src'),
      '@ghost-docs/config': resolve(__dirname, 'packages/config/src'),
      '@ghost-docs/llm': resolve(__dirname, 'packages/llm/src'),
      '@ghost-docs/intelligence-engine': resolve(__dirname, 'packages/intelligence-engine/src'),
      '@ghost-docs/parser': resolve(__dirname, 'packages/parser/src'),
      '@ghost-docs/github': resolve(__dirname, 'packages/github/src'),
      '@ghost-docs/docs': resolve(__dirname, 'packages/docs/src'),
      '@ghost-docs/shared': resolve(__dirname, 'packages/shared/src'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
