import type { KnowledgeGraph } from '@ghost-docs/types';
import type { Renderer } from './types.js';
import { generateExplainReport } from '../markdown-generator.js';

export const markdownRenderer: Renderer = {
  mimeType: 'text/markdown',
  render(kg: KnowledgeGraph): string {
    return generateExplainReport(kg);
  },
};
