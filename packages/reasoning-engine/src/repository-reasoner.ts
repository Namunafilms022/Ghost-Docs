import type { KnowledgeGraph, ReasonedAnswer } from '@ghost-docs/types';
import { ReasoningEngine } from './reasoning-engine.js';
import { AnswerFormatter } from './answer-formatter.js';
import { ContextManager } from './context/context-manager.js';

export interface ReasonerConfig {
  minConfidence?: number;
  sessionTTL?: number;
}

export class RepositoryReasoner {
  private engine = new ReasoningEngine();
  private formatter = new AnswerFormatter();
  private ctxManager: ContextManager;

  constructor(private config: ReasonerConfig = {}) {
    this.ctxManager = new ContextManager({ sessionTTL: config.sessionTTL });
  }

  ask(kg: KnowledgeGraph, question: string, sessionId?: string): ReasonedAnswer {
    const { resolvedQuestion, category, contextInfo, session } = this.ctxManager.resolveQuestion(question, sessionId);

    const result = this.engine.reasonWithCategory(kg, resolvedQuestion, category);
    const formatted = this.formatter.format(result);
    formatted.question = resolvedQuestion;
    formatted.context = contextInfo;

    if (session) {
      this.ctxManager.recordAnswer(
        session.sessionId,
        resolvedQuestion,
        formatted.answer,
        formatted.confidence,
        formatted.supportingFiles,
        formatted.supportingModules,
      );
    }

    return formatted;
  }

  createSession(): string {
    return this.ctxManager.createSession().sessionId;
  }

  getContextManager(): ContextManager {
    return this.ctxManager;
  }
}
