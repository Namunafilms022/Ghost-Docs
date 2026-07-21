import type { KnowledgeGraph, ReasonedAnswer, QuestionCategory } from '@ghost-docs/types';
import { ReasoningEngine } from './reasoning-engine.js';
import { AnswerFormatter } from './answer-formatter.js';

export interface ReasonerConfig {
  minConfidence?: number;
}

export class RepositoryReasoner {
  private engine = new ReasoningEngine();
  private formatter = new AnswerFormatter();

  constructor(private config: ReasonerConfig = {}) {}

  ask(kg: KnowledgeGraph, question: string): ReasonedAnswer {
    const result = this.engine.reason(kg, question);
    const formatted = this.formatter.format(result);
    formatted.question = question;
    return formatted;
  }
}
