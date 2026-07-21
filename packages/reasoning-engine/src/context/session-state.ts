import type { ContextSession, QuestionCategory } from '@ghost-docs/types';

let counter = 0;

export class SessionState {
  private sessions = new Map<string, ContextSession>();
  private sessionTTL: number;

  readonly DEFAULT_TTL_MS = 5 * 60 * 1000;

  constructor(ttl?: number) {
    this.sessionTTL = ttl ?? this.DEFAULT_TTL_MS;
  }

  create(): ContextSession {
    counter++;
    const session: ContextSession = {
      sessionId: `ctx_${Date.now()}_${counter}`,
      currentTopic: null,
      currentModule: null,
      currentFile: null,
      previousQuestions: [],
      previousAnswers: [],
      reasoningPath: [],
      confidenceHistory: [],
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  get(sessionId: string): ContextSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (this.isExpired(session)) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }

  update(sessionId: string, updates: Partial<ContextSession>): ContextSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    Object.assign(session, updates, { lastActivityAt: Date.now() });
    return session;
  }

  pushQuestion(sessionId: string, question: string, answer: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.previousQuestions.push(question);
    session.previousAnswers.push(answer);
    session.lastActivityAt = Date.now();
  }

  setTopic(sessionId: string, topic: QuestionCategory | null, module?: string | null, file?: string | null): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.currentTopic = topic;
    if (module !== undefined) session.currentModule = module;
    if (file !== undefined) session.currentFile = file;
    if (topic) session.reasoningPath.push(`topic:${topic}`);
    session.lastActivityAt = Date.now();
  }

  isExpired(session: ContextSession): boolean {
    return Date.now() - session.lastActivityAt > this.sessionTTL;
  }

  destroy(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
