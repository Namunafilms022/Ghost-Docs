import type { KnowledgeGraph } from '@ghost-docs/types';

export interface Renderer {
  render(kg: KnowledgeGraph): string;
  mimeType: string;
}
