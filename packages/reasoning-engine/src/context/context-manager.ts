import type { ContextSession, ContextInfo, QuestionCategory } from '@ghost-docs/types';
import { SessionState } from './session-state.js';
import { TopicResolver } from './topic-resolver.js';
import { ContextValidator } from './context-validator.js';

export interface ContextManagerConfig {
  sessionTTL?: number;
}

export class ContextManager {
  private sessions = new SessionState();
  private topicResolver = new TopicResolver();
  private validator = new ContextValidator();

  constructor(private config: ContextManagerConfig = {}) {
    this.sessions = new SessionState(config.sessionTTL);
  }

  createSession(): ContextSession {
    return this.sessions.create();
  }

  resolveQuestion(question: string, sessionId?: string): {
    resolvedQuestion: string;
    category: QuestionCategory;
    contextInfo: ContextInfo;
    session: ContextSession | null;
  } {
    const session = sessionId ? this.sessions.get(sessionId) : null;
    const validation = this.validator.validate(session);

    const topic = this.topicResolver.resolve(question, validation.valid ? session : null);
    const label = this.topicResolver.getCategoryLabel(topic.category);

    if (session && topic.category !== 'unknown') {
      this.sessions.setTopic(session.sessionId, topic.category);
    }

    return {
      resolvedQuestion: question,
      category: topic.category,
      contextInfo: {
        sessionId: session?.sessionId || 'none',
        currentTopic: topic.category,
        currentTopicLabel: label,
        currentModule: session?.currentModule ?? null,
        currentFile: session?.currentFile ?? null,
        topicDerivedFrom: topic.derivedFrom,
        isFollowUp: topic.isFollowUp,
        referencedPreviousQuestion: topic.referencedQuestion,
      },
      session,
    };
  }

  recordAnswer(sessionId: string, question: string, answer: string, confidence: number, files: string[], modules: string[]): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    this.sessions.pushQuestion(sessionId, question, answer);
    this.sessions.setTopic(sessionId, session.currentTopic);

    if (files.length > 0) {
      this.sessions.update(sessionId, { currentFile: files[0] });
    }
    if (modules.length > 0) {
      this.sessions.update(sessionId, { currentModule: modules[0] });
    }
    session.confidenceHistory.push(confidence);
  }

  getSession(sessionId: string): ContextSession | null {
    return this.sessions.get(sessionId);
  }

  destroySession(sessionId: string): void {
    this.sessions.destroy(sessionId);
  }
}
