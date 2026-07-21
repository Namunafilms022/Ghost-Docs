import type { KnowledgeGraph } from '@ghost-docs/types';
import type { Renderer } from './types.js';

export const jsonRenderer: Renderer = {
  mimeType: 'application/json',
  render(kg: KnowledgeGraph): string {
    return JSON.stringify(kg, null, 2);
  },
};
