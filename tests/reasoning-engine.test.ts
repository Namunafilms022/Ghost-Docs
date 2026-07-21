import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { RepositoryReasoner, QuestionClassifier, ReasoningEngine, ConfidenceCalculator, SourceResolver, AnswerFormatter } from '@ghost-docs/reasoning-engine';
import type { KnowledgeGraph } from '@ghost-docs/types';
import { EntryPointType, EntryPointConfidence, FileCategory, DependencyType, FrameworkCategory, FrameworkConfidence } from '@ghost-docs/types';

function createSampleKG(): KnowledgeGraph {
  return {
    project_summary: 'Web Application project built with TypeScript using React, Express managed by npm.',
    languages: ['TypeScript', 'JavaScript'],
    modules: [
      { name: 'src', path: 'src', type: 'application', responsibilities: ['Main application source code'], keyFiles: ['src/index.ts', 'src/app.ts'] },
      { name: 'auth', path: 'src/auth', type: 'service', responsibilities: ['Authentication and authorization'], keyFiles: ['src/auth/middleware.ts', 'src/auth/jwt.ts'] },
      { name: 'db', path: 'src/db', type: 'config', responsibilities: ['Database layer and migrations'], keyFiles: ['src/db/schema.ts', 'src/db/migrations'] },
      { name: 'tests', path: 'tests', type: 'test', responsibilities: ['Automated tests and test utilities'], keyFiles: ['tests/app.test.ts'] },
      { name: 'root', path: '.', type: 'config', responsibilities: ['Project root configuration'], keyFiles: ['package.json', 'README.md'] },
    ],
    entry_points: [
      { path: 'src/index.ts', type: EntryPointType.Main, confidence: EntryPointConfidence.High, reason: 'Main entry' },
      { path: 'src/server.ts', type: EntryPointType.Server, confidence: EntryPointConfidence.High, reason: 'Server entry' },
    ],
    authentication: 'Auth libraries: jsonwebtoken, passport. Auth files: src/auth/middleware.ts',
    database: 'prisma, postgresql',
    apis: [
      { path: '/api', type: 'rest', framework: 'Express' },
      { path: '/graphql', type: 'graphql', framework: null },
    ],
    commands: [
      { name: 'install', command: 'npm install', description: 'Install dependencies' },
      { name: 'build', command: 'npm run build', description: 'Build the project' },
      { name: 'test', command: 'npm test', description: 'Run the test suite' },
      { name: 'dev', command: 'npm run dev', description: 'Start development server' },
    ],
    important_files: [
      { path: 'README.md', name: 'README.md', category: FileCategory.Readme },
      { path: 'package.json', name: 'package.json', category: FileCategory.PackageConfig },
      { path: 'Dockerfile', name: 'Dockerfile', category: FileCategory.Dockerfile },
    ],
    direct_dependencies: { total: 24, production: 18, development: 6 },
  };
}

describe('Repository Reasoning Engine', () => {
  describe('QuestionClassifier', () => {
    const classifier = new QuestionClassifier();

    it('classifies project purpose questions', () => {
      const r = classifier.classify('What does this repository do?');
      expect(r.category).toBe('project-purpose');
      expect(r.score).toBeGreaterThan(0);
    });

    it('classifies authentication questions', () => {
      const r = classifier.classify('Where is authentication implemented?');
      expect(r.category).toBe('authentication');
    });

    it('classifies startup flow questions', () => {
      const r = classifier.classify('How does startup work?');
      expect(r.category).toBe('startup-flow');
    });

    it('classifies entry point questions', () => {
      const r = classifier.classify('Which file should I read first?');
      expect(r.category).toBe('entry-points');
    });

    it('classifies API questions', () => {
      const r = classifier.classify('Where are REST APIs?');
      expect(r.category).toBe('api-locations');
    });

    it('classifies database questions', () => {
      const r = classifier.classify('Which folder handles database logic?');
      expect(r.category).toBe('database-layer');
    });

    it('classifies testing questions', () => {
      const r = classifier.classify('What testing framework is used?');
      expect(r.category).toBe('testing');
    });

    it('returns unknown for gibberish', () => {
      const r = classifier.classify('asdfghjkl qwerty');
      expect(r.category).toBe('unknown');
    });
  });

  describe('ConfidenceCalculator', () => {
    const calc = new ConfidenceCalculator();
    const kg = createSampleKG();

    it('high confidence for project purpose', () => {
      const r = calc.calculate(kg, 'project-purpose');
      expect(r.score).toBeGreaterThan(0.9);
    });

    it('high confidence for authentication with data', () => {
      const r = calc.calculate(kg, 'authentication');
      expect(r.score).toBeGreaterThan(0.9);
    });

    it('low confidence for authentication without data', () => {
      const noAuthKG = { ...kg, authentication: 'Not detected' };
      const r = calc.calculate(noAuthKG, 'authentication');
      expect(r.score).toBeLessThan(0.5);
    });

    it('high confidence for dependencies', () => {
      const r = calc.calculate(kg, 'dependencies');
      expect(r.score).toBeGreaterThan(0.9);
    });
  });

  describe('SourceResolver', () => {
    const resolver = new SourceResolver();
    const kg = createSampleKG();

    it('resolves auth sources', () => {
      const r = resolver.resolve(kg, 'authentication');
      expect(r.files.length).toBeGreaterThanOrEqual(0);
      expect(r.path.some(p => p.includes('Authentication'))).toBe(true);
    });

    it('resolves entry point sources', () => {
      const r = resolver.resolve(kg, 'entry-points');
      expect(r.files.length).toBeGreaterThan(0);
      expect(r.files.some(f => f.includes('index.ts'))).toBe(true);
    });

    it('resolves testing sources', () => {
      const r = resolver.resolve(kg, 'testing');
      expect(r.modules).toContain('tests');
    });
  });

  describe('ReasoningEngine', () => {
    const engine = new ReasoningEngine();
    const kg = createSampleKG();

    it('answers project purpose', () => {
      const r = engine.reason(kg, 'What does this repository do?');
      expect(r.category).toBe('project-purpose');
      expect(r.answer.length).toBeGreaterThan(10);
      expect(r.confidence).toBeGreaterThan(0);
    });

    it('answers authentication question', () => {
      const r = engine.reason(kg, 'Where is authentication?');
      expect(r.category).toBe('authentication');
      expect(r.answer.toLowerCase()).toContain('auth');
      expect(r.confidence).toBeGreaterThan(0.9);
    });

    it('answers startup flow question', () => {
      const r = engine.reason(kg, 'How does startup work?');
      expect(r.category).toBe('startup-flow');
      expect(r.answer).toContain('src/index.ts');
    });

    it('answers entry points question', () => {
      const r = engine.reason(kg, 'Which file should I read first?');
      expect(r.category).toBe('entry-points');
      expect(r.supportingFiles.length).toBeGreaterThan(0);
    });

    it('answers API question', () => {
      const r = engine.reason(kg, 'Where are REST APIs?');
      expect(r.category).toBe('api-locations');
      expect(r.answer.toLowerCase()).toContain('express');
    });

    it('answers database question', () => {
      const r = engine.reason(kg, 'What database is used?');
      expect(r.category).toBe('database-layer');
      expect(r.answer).toContain('prisma');
    });

    it('answers testing question', () => {
      const r = engine.reason(kg, 'What testing framework?');
      expect(r.category).toBe('testing');
      expect(r.answer).toContain('npm test');
    });

    it('answers build commands question', () => {
      const r = engine.reason(kg, 'How to build?');
      expect(r.category).toBe('build-commands');
      expect(r.answer).toContain('npm run build');
    });

    it('answers folder responsibilities', () => {
      const r = engine.reason(kg, 'What are the folders?');
      expect(r.category).toBe('folder-responsibilities');
      expect(r.supportingModules.length).toBeGreaterThan(0);
    });

    it('handles unknown gracefully', () => {
      const r = engine.reason(kg, 'asdfghjkl');
      expect(r.category).toBe('unknown');
      expect(r.answer).toContain('could not classify');
    });
  });

  describe('AnswerFormatter', () => {
    const formatter = new AnswerFormatter();
    const engine = new ReasoningEngine();
    const kg = createSampleKG();

    it('formats with transparency section', () => {
      const result = engine.reason(kg, 'How does authentication work?');
      const formatted = formatter.format(result);
      expect(formatted.transparency.length).toBeGreaterThan(0);
      expect(formatted.transparency.some(l => l.includes('I answered this because'))).toBe(true);
      expect(formatted.supportingFiles).toBeDefined();
      expect(formatted.supportingModules).toBeDefined();
      expect(formatted.confidence).toBeGreaterThan(0);
      expect(formatted.answer.length).toBeGreaterThan(5);
    });
  });

  describe('RepositoryReasoner (Integration)', () => {
    it('produces complete reasoned answer', async () => {
      const FIXTURE_PATH = resolve(__dirname, 'fixtures/sample-repo');
      const { extractKnowledge } = await import('@ghost-docs/intelligence-engine');
      const kg = await extractKnowledge({ repoUrl: FIXTURE_PATH, tempDir: '/tmp' });

      const reasoner = new RepositoryReasoner();
      const answer = reasoner.ask(kg, 'How does authentication work?');

      expect(answer.question).toBe('How does authentication work?');
      expect(answer.answer).toBeTruthy();
      expect(typeof answer.confidence).toBe('number');
      expect(answer.confidence).toBeGreaterThanOrEqual(0);
      expect(answer.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(answer.supportingFiles)).toBe(true);
      expect(Array.isArray(answer.supportingModules)).toBe(true);
      expect(Array.isArray(answer.reasoningPath)).toBe(true);
      expect(Array.isArray(answer.transparency)).toBe(true);
      expect(answer.transparency.length).toBeGreaterThan(0);
    });

    it('answers multiple question types correctly', async () => {
      const FIXTURE_PATH = resolve(__dirname, 'fixtures/sample-repo');
      const { extractKnowledge } = await import('@ghost-docs/intelligence-engine');
      const kg = await extractKnowledge({ repoUrl: FIXTURE_PATH, tempDir: '/tmp' });

      const reasoner = new RepositoryReasoner();
      const questions = [
        'What does this repository do?',
        'Where is authentication?',
        'How does startup work?',
        'What testing framework is used?',
        'Where are REST APIs?',
      ];

      for (const q of questions) {
        const answer = reasoner.ask(kg, q);
        expect(answer.answer).toBeTruthy();
        expect(answer.confidence).toBeGreaterThanOrEqual(0);
        expect(answer.transparency.length).toBeGreaterThan(0);
      }
    });
  });
});
