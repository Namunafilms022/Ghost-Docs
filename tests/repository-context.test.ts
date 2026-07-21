import { describe, it, expect, beforeEach } from 'vitest';
import { resolve } from 'node:path';
import type { KnowledgeGraph } from '@ghost-docs/types';
import { EntryPointType, EntryPointConfidence, FileCategory, DependencyType } from '@ghost-docs/types';
import { SessionState, TopicResolver, ReferenceResolver, ContextValidator, ContextManager } from '@ghost-docs/reasoning-engine';

function createSampleKG(): KnowledgeGraph {
  return {
    project_summary: 'Web Application project built with TypeScript using React, Express managed by npm.',
    languages: ['TypeScript'],
    modules: [
      { name: 'auth', path: 'src/auth', type: 'service', responsibilities: ['Authentication'], keyFiles: ['src/auth/middleware.ts', 'src/auth/jwt.ts'] },
      { name: 'tests', path: 'tests', type: 'test', responsibilities: ['Testing'], keyFiles: ['tests/app.test.ts'] },
      { name: 'root', path: '.', type: 'config', responsibilities: ['Config'], keyFiles: ['package.json'] },
    ],
    entry_points: [
      { path: 'src/index.ts', type: EntryPointType.Main, confidence: EntryPointConfidence.High, reason: 'main' },
    ],
    authentication: 'Auth libraries: jsonwebtoken, passport',
    database: 'prisma',
    apis: [{ path: '/api', type: 'rest', framework: 'Express' }],
    commands: [{ name: 'test', command: 'npm test', description: 'Run tests' }],
    important_files: [{ path: 'package.json', name: 'package.json', category: FileCategory.PackageConfig }],
    dependencies: { total: 10, production: 7, development: 3 },
  };
}

describe('Repository Context Engine', () => {
  describe('SessionState', () => {
    let state: SessionState;

    beforeEach(() => {
      state = new SessionState();
    });

    it('creates a session', () => {
      const session = state.create();
      expect(session.sessionId).toBeTruthy();
      expect(session.currentTopic).toBeNull();
      expect(session.previousQuestions).toEqual([]);
    });

    it('retrieves a session', () => {
      const created = state.create();
      const retrieved = state.get(created.sessionId);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.sessionId).toBe(created.sessionId);
    });

    it('returns null for non-existent session', () => {
      expect(state.get('nonexistent')).toBeNull();
    });

    it('updates session fields', () => {
      const session = state.create();
      state.update(session.sessionId, { currentTopic: 'authentication' });
      const updated = state.get(session.sessionId);
      expect(updated!.currentTopic).toBe('authentication');
    });

    it('pushes question and answer history', () => {
      const session = state.create();
      state.pushQuestion(session.sessionId, 'How auth works?', 'Auth uses JWT');
      const s = state.get(session.sessionId)!;
      expect(s.previousQuestions).toEqual(['How auth works?']);
      expect(s.previousAnswers).toEqual(['Auth uses JWT']);
    });

    it('sets topic with module tracking', () => {
      const session = state.create();
      state.setTopic(session.sessionId, 'authentication', 'auth', 'src/auth/jwt.ts');
      const s = state.get(session.sessionId)!;
      expect(s.currentTopic).toBe('authentication');
      expect(s.currentModule).toBe('auth');
      expect(s.currentFile).toBe('src/auth/jwt.ts');
    });

    it('marks sessions as expired after TTL', () => {
      const state = new SessionState(100);
      const session = state.create();
      session.lastActivityAt = Date.now() - 200;
      expect(state.isExpired(session)).toBe(true);
    });

    it('destroys sessions', () => {
      const session = state.create();
      state.destroy(session.sessionId);
      expect(state.get(session.sessionId)).toBeNull();
    });
  });

  describe('ReferenceResolver', () => {
    const resolver = new ReferenceResolver();
    const session = new SessionState().create();

    it('detects pronoun references', () => {
      const s = { ...session, previousQuestions: ['How does auth work?'] };
      const r = resolver.resolve('Where is it implemented?', s);
      expect(r.isFollowUp).toBe(true);
      expect(r.inheritedTopic).toBe(true);
    });

    it('detects follow-up patterns', () => {
      const s = { ...session, previousQuestions: ['How does auth work?'] };
      const r = resolver.resolve('Then where is JWT stored?', s);
      expect(r.isFollowUp).toBe(true);
    });

    it('detects "what about" follow-ups', () => {
      const s = { ...session, previousQuestions: ['How does auth work?'] };
      const r = resolver.resolve('What about the database?', s);
      expect(r.isFollowUp).toBe(true);
    });

    it('returns no follow-up for first question', () => {
      const r = resolver.resolve('How does auth work?', null);
      expect(r.isFollowUp).toBe(false);
      expect(r.inheritedTopic).toBe(false);
    });

    it('detects standalone question', () => {
      const s = { ...session, previousQuestions: ['How does auth work?'] };
      const r = resolver.resolve('What database is used?', s);
      expect(r.isFollowUp).toBe(false);
      expect(r.inheritedTopic).toBe(false);
    });
  });

  describe('TopicResolver', () => {
    const resolver = new TopicResolver();
    const session = new SessionState().create();
    const sessionWithTopic = { ...session, currentTopic: 'authentication' as const, previousQuestions: ['How auth works?'] };

    it('classifies direct question', () => {
      const r = resolver.resolve('What database is used?', null);
      expect(r.category).toBe('database-layer');
      expect(r.derivedFrom).toBe('question');
    });

    it('inherits topic from context for vague questions', () => {
      const r = resolver.resolve('Where is it implemented?', sessionWithTopic);
      expect(r.category).toBe('authentication');
      expect(r.derivedFrom).toBe('context');
      expect(r.isFollowUp).toBe(true);
    });

    it('returns unknown for gibberish without context', () => {
      const r = resolver.resolve('asdfgh', null);
      expect(r.category).toBe('unknown');
    });

    it('provides category label', () => {
      expect(resolver.getCategoryLabel('authentication')).toBe('Authentication');
      expect(resolver.getCategoryLabel('database-layer')).toBe('Database Layer');
    });
  });

  describe('ContextValidator', () => {
    const validator = new ContextValidator();

    it('validates null session', () => {
      const r = validator.validate(null);
      expect(r.valid).toBe(false);
    });

    it('validates fresh session', () => {
      const session = new SessionState().create();
      const r = validator.validate(session);
      expect(r.valid).toBe(true);
    });
  });

  describe('ContextManager', () => {
    const kg = createSampleKG();

    it('creates sessions', () => {
      const cm = new ContextManager();
      const session = cm.createSession();
      expect(session.sessionId).toBeTruthy();
    });

    it('resolves first question without context', () => {
      const cm = new ContextManager();
      const r = cm.resolveQuestion('How does authentication work?');
      expect(r.category).toBe('authentication');
      expect(r.contextInfo.topicDerivedFrom).toBe('question');
      expect(r.contextInfo.isFollowUp).toBe(false);
    });

    it('inherits context for vague follow-up question', () => {
      const cm = new ContextManager();
      const session = cm.createSession();

      cm.resolveQuestion('How does authentication work?', session.sessionId);
      cm.recordAnswer(session.sessionId, 'How does authentication work?', 'Auth uses JWT', 0.95, ['src/auth/jwt.ts'], ['auth']);

      const r = cm.resolveQuestion('Where is it validated?', session.sessionId);
      expect(r.category).toBe('authentication');
      expect(r.contextInfo.topicDerivedFrom).toBe('context');
      expect(r.contextInfo.isFollowUp).toBe(true);
    });

    it('tracks current module and file', () => {
      const cm = new ContextManager();
      const session = cm.createSession();

      cm.resolveQuestion('How does authentication work?', session.sessionId);
      cm.recordAnswer(session.sessionId, 'How does authentication work?', 'Auth via JWT', 0.95, ['src/auth/jwt.ts'], ['auth']);

      const s = cm.getSession(session.sessionId)!;
      expect(s.currentFile).toBe('src/auth/jwt.ts');
      expect(s.currentModule).toBe('auth');
    });

    it('detects topic switches', () => {
      const cm = new ContextManager();
      const session = cm.createSession();

      cm.resolveQuestion('How does authentication work?', session.sessionId);
      cm.recordAnswer(session.sessionId, 'How does authentication work?', 'Auth via JWT', 0.95, [], []);

      const r = cm.resolveQuestion('What database is used?', session.sessionId);
      expect(r.category).toBe('database-layer');
      expect(r.contextInfo.topicDerivedFrom).toBe('question');
    });

    it('stores confidence history', () => {
      const cm = new ContextManager();
      const session = cm.createSession();

      cm.resolveQuestion('Q1', session.sessionId);
      cm.recordAnswer(session.sessionId, 'Q1', 'A1', 0.95, [], []);
      cm.resolveQuestion('Q2', session.sessionId);
      cm.recordAnswer(session.sessionId, 'Q2', 'A2', 0.8, [], []);

      const s = cm.getSession(session.sessionId)!;
      expect(s.confidenceHistory).toEqual([0.95, 0.8]);
    });

    it('destroys sessions', () => {
      const cm = new ContextManager();
      const session = cm.createSession();
      cm.destroySession(session.sessionId);
      expect(cm.getSession(session.sessionId)).toBeNull();
    });
  });

  describe('RepositoryReasoner with Context (Integration)', () => {
    it('includes context info in answer', async () => {
      const FIXTURE_PATH = resolve(__dirname, 'fixtures/sample-repo');
      const { extractKnowledge } = await import('@ghost-docs/intelligence-engine');
      const kg = await extractKnowledge({ repoUrl: FIXTURE_PATH, tempDir: '/tmp' });

      const { RepositoryReasoner } = await import('@ghost-docs/reasoning-engine');
      const reasoner = new RepositoryReasoner();
      const sid = reasoner.createSession();

      const first = reasoner.ask(kg, 'How does authentication work?', sid);
      expect(first.context).toBeDefined();
      expect(first.context!.isFollowUp).toBe(false);

      const second = reasoner.ask(kg, 'Where is it implemented?', sid);
      expect(second.context).toBeDefined();
      expect(second.context!.isFollowUp).toBe(true);
      expect(second.context!.referencedPreviousQuestion).toBeTruthy();
    });

    it('maintains topic across follow-ups', async () => {
      const FIXTURE_PATH = resolve(__dirname, 'fixtures/sample-repo');
      const { extractKnowledge } = await import('@ghost-docs/intelligence-engine');
      const kg = await extractKnowledge({ repoUrl: FIXTURE_PATH, tempDir: '/tmp' });

      const { RepositoryReasoner } = await import('@ghost-docs/reasoning-engine');
      const reasoner = new RepositoryReasoner();
      const sid = reasoner.createSession();

      reasoner.ask(kg, 'How does authentication work?', sid);
      const followUp = reasoner.ask(kg, 'Then what files handle this?', sid);

      expect(followUp.context!.currentTopic).toBe('authentication');
      expect(followUp.context!.topicDerivedFrom).toBe('context');
    });
  });
});
