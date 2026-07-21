import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';

import { buildKnowledgeGraph } from '@ghost-docs/intelligence-engine';
import type { ProjectManifest, KnowledgeGraph, KnowledgeModule, APIEndpoint, CLICommand, DependencySummary } from '@ghost-docs/types';
import { EntryPointType, EntryPointConfidence, FileCategory, DependencyType, FrameworkCategory, FrameworkConfidence } from '@ghost-docs/types';

function createMinimalManifest(overrides?: Partial<ProjectManifest>): ProjectManifest {
  return {
    repository: {
      url: 'https://github.com/test/repo',
      localPath: '/tmp/test',
      defaultBranch: 'main',
      totalFiles: 10,
      totalDirs: 3,
      sizeBytes: 10000,
    },
    languages: [
      { name: 'TypeScript', percentage: 80, fileCount: 8, extensions: ['.ts'] },
      { name: 'JavaScript', percentage: 20, fileCount: 2, extensions: ['.js'] },
    ],
    frameworks: [
      { name: 'React', category: FrameworkCategory.Frontend, version: '18.0.0', detectedFrom: 'package.json', confidence: FrameworkConfidence.Certain },
      { name: 'Express', category: FrameworkCategory.Backend, version: '4.0.0', detectedFrom: 'package.json', confidence: FrameworkConfidence.Certain },
      { name: 'Jest', category: FrameworkCategory.Testing, version: '29.0.0', detectedFrom: 'package.json', confidence: FrameworkConfidence.Certain },
    ],
    packageManager: {
      name: 'npm', configFiles: ['package.json'], lockFiles: ['package-lock.json'],
      installCommand: 'npm install', buildCommand: 'npm run build', testCommand: 'npm test', runCommand: 'npm run',
    },
    buildSystem: { name: 'npm', configFiles: ['package.json'], buildCommand: 'npm run build' },
    entryPoints: [
      { path: 'src/index.ts', type: EntryPointType.Main, confidence: EntryPointConfidence.High, reason: 'main entry' },
    ],
    importantFiles: [
      { path: 'README.md', name: 'README.md', category: FileCategory.Readme },
      { path: 'Dockerfile', name: 'Dockerfile', category: FileCategory.Dockerfile },
      { path: '.github/workflows/ci.yml', name: 'ci.yml', category: FileCategory.CI },
      { path: '.env.example', name: '.env.example', category: FileCategory.Env },
    ],
    projectType: 'web-application',
    testFramework: 'Jest',
    hasDocker: true,
    hasCI: true,
    isMonorepo: false,
    dependencyGraph: {
      nodes: [
        { name: 'react', version: '18.0.0', type: DependencyType.Production },
        { name: 'express', version: '4.0.0', type: DependencyType.Production },
        { name: 'jest', version: '29.0.0', type: DependencyType.Development },
        { name: 'jsonwebtoken', version: '9.0.0', type: DependencyType.Production },
        { name: 'prisma', version: '5.0.0', type: DependencyType.Production },
      ],
      edges: [
        { source: 'root', target: 'react', type: DependencyType.Production },
        { source: 'root', target: 'express', type: DependencyType.Production },
        { source: 'root', target: 'jest', type: DependencyType.Development },
        { source: 'root', target: 'jsonwebtoken', type: DependencyType.Production },
        { source: 'root', target: 'prisma', type: DependencyType.Production },
      ],
    },
    folderTree: {
      name: 'test', path: '.', type: 'directory', children: [
        { name: 'src', path: 'src', type: 'directory', children: [
          { name: 'index.ts', path: 'src/index.ts', type: 'file', size: 500 },
          { name: 'app.ts', path: 'src/app.ts', type: 'file', size: 300 },
          { name: 'utils', path: 'src/utils', type: 'directory', children: [
            { name: 'helper.ts', path: 'src/utils/helper.ts', type: 'file', size: 200 },
          ]},
          { name: 'components', path: 'src/components', type: 'directory', children: [
            { name: 'Button.tsx', path: 'src/components/Button.tsx', type: 'file', size: 400 },
          ]},
        ]},
        { name: 'tests', path: 'tests', type: 'directory', children: [
          { name: 'app.test.ts', path: 'tests/app.test.ts', type: 'file', size: 200 },
        ]},
        { name: 'docs', path: 'docs', type: 'directory', children: []},
        { name: 'scripts', path: 'scripts', type: 'directory', children: []},
        { name: 'README.md', path: 'README.md', type: 'file', size: 1000 },
      ],
    },
    detectedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('KnowledgeGraph Builder', () => {
  describe('buildProjectSummary', () => {
    it('includes project type and main languages', () => {
      const manifest = createMinimalManifest();
      const kg = buildKnowledgeGraph(manifest);
      expect(kg.project_summary).toContain('Web Application project');
      expect(kg.project_summary).toContain('TypeScript');
    });

    it('includes main frameworks', () => {
      const manifest = createMinimalManifest();
      const kg = buildKnowledgeGraph(manifest);
      expect(kg.project_summary).toContain('React');
      expect(kg.project_summary).toContain('Express');
    });

    it('includes package manager', () => {
      const manifest = createMinimalManifest();
      const kg = buildKnowledgeGraph(manifest);
      expect(kg.project_summary).toContain('npm');
    });
  });

  describe('extractModules', () => {
    it('extracts top-level directories as modules', () => {
      const manifest = createMinimalManifest();
      const kg = buildKnowledgeGraph(manifest);
      const moduleNames = kg.modules.map((m) => m.name);
      expect(moduleNames).toContain('src');
      expect(moduleNames).toContain('tests');
      expect(moduleNames).toContain('docs');
      expect(moduleNames).toContain('scripts');
    });

    it('classifies module types correctly', () => {
      const manifest = createMinimalManifest();
      const kg = buildKnowledgeGraph(manifest);
      const getType = (name: string) => kg.modules.find((m) => m.name === name)!.type;
      expect(getType('src')).toBe('application');
      expect(getType('tests')).toBe('test');
      expect(getType('docs')).toBe('documentation');
      expect(getType('scripts')).toBe('tooling');
    });

    it('assigns responsibilities to modules', () => {
      const manifest = createMinimalManifest();
      const kg = buildKnowledgeGraph(manifest);
      const srcModule = kg.modules.find((m) => m.name === 'src')!;
      expect(srcModule.responsibilities.length).toBeGreaterThan(0);
      expect(srcModule.responsibilities[0]).toContain('Main application source code');
    });

    it('includes root config module', () => {
      const manifest = createMinimalManifest();
      const kg = buildKnowledgeGraph(manifest);
      expect(kg.modules.find((m) => m.name === 'root')).toBeDefined();
    });
  });

  describe('entry_points', () => {
    it('passes through manifest entry points', () => {
      const manifest = createMinimalManifest();
      const kg = buildKnowledgeGraph(manifest);
      expect(kg.entry_points).toEqual(manifest.entryPoints);
    });
  });

  describe('detectAuthentication', () => {
    it('detects auth libraries from dependencies', () => {
      const manifest = createMinimalManifest();
      const kg = buildKnowledgeGraph(manifest);
      expect(kg.authentication).toContain('jsonwebtoken');
    });

    it('returns "Not detected" when no auth', () => {
      const manifest = createMinimalManifest({
        dependencyGraph: { nodes: [], edges: [] },
      });
      const kg = buildKnowledgeGraph(manifest);
      expect(kg.authentication).toBe('Not detected');
    });
  });

  describe('detectDatabaseLayer', () => {
    it('detects database from dependencies', () => {
      const manifest = createMinimalManifest();
      const kg = buildKnowledgeGraph(manifest);
      expect(kg.database).toContain('prisma');
    });

    it('returns "Not detected" when no database', () => {
      const manifest = createMinimalManifest({
        dependencyGraph: { nodes: [{
          name: 'express', version: '4.0.0', type: DependencyType.Production,
        }], edges: [] },
      });
      const kg = buildKnowledgeGraph(manifest);
      expect(kg.database).toBe('Not detected');
    });
  });

  describe('detectAPIs', () => {
    it('detects REST API from Express framework', () => {
      const manifest = createMinimalManifest();
      const kg = buildKnowledgeGraph(manifest);
      const restApi = kg.apis.find((a) => a.type === 'rest');
      expect(restApi).toBeDefined();
      expect(restApi!.framework).toBe('Express');
    });

    it('detects GraphQL from dependencies', () => {
      const manifest = createMinimalManifest({
        dependencyGraph: {
          nodes: [
            { name: 'graphql', version: '16.0.0', type: DependencyType.Production },
            { name: 'express', version: '4.0.0', type: DependencyType.Production },
          ],
          edges: [
            { source: 'root', target: 'graphql', type: DependencyType.Production },
            { source: 'root', target: 'express', type: DependencyType.Production },
          ],
        },
      });
      const kg = buildKnowledgeGraph(manifest);
      expect(kg.apis.find((a) => a.type === 'graphql')).toBeDefined();
    });
  });

  describe('extractCommands', () => {
    it('extracts install, build, test commands', () => {
      const manifest = createMinimalManifest();
      const kg = buildKnowledgeGraph(manifest);
      const commandNames = kg.commands.map((c) => c.name);
      expect(commandNames).toContain('install');
      expect(commandNames).toContain('build');
      expect(commandNames).toContain('test');
    });

    it('includes docker command when docker is detected', () => {
      const manifest = createMinimalManifest();
      const kg = buildKnowledgeGraph(manifest);
      expect(kg.commands.find((c) => c.name === 'docker-build')).toBeDefined();
    });
  });

  describe('important_files', () => {
    it('passes through manifest important files', () => {
      const manifest = createMinimalManifest();
      const kg = buildKnowledgeGraph(manifest);
      expect(kg.important_files).toEqual(manifest.importantFiles);
    });
  });

  describe('dependencies', () => {
    it('summarizes dependency counts', () => {
      const manifest = createMinimalManifest();
      const kg = buildKnowledgeGraph(manifest);
      expect(kg.dependencies.total).toBe(5);
      expect(kg.dependencies.production).toBe(4);
      expect(kg.dependencies.development).toBe(1);
    });
  });

  describe('Integration: extractKnowledge', () => {
    it('produces complete KnowledgeGraph from sample repo', async () => {
      const FIXTURE_PATH = resolve(__dirname, 'fixtures/sample-repo');
      const { extractKnowledge } = await import('@ghost-docs/intelligence-engine');
      const kg = await extractKnowledge({ repoUrl: FIXTURE_PATH, tempDir: '/tmp' });

      expect(kg.project_summary).toBeTruthy();
      expect(kg.modules.length).toBeGreaterThanOrEqual(1);
      expect(kg.entry_points.length).toBeGreaterThan(0);
      expect(kg.apis).toBeDefined();
      expect(kg.commands.length).toBeGreaterThan(0);
      expect(kg.important_files.length).toBeGreaterThan(0);
      expect(kg.dependencies.total).toBeGreaterThan(0);
      expect(typeof kg.authentication).toBe('string');
      expect(typeof kg.database).toBe('string');

      expect(kg.entry_points.some((e) => e.path === 'src/index.ts')).toBe(true);
      expect(kg.commands.find((c) => c.name === 'install')).toBeDefined();
      expect(kg.commands.find((c) => c.name === 'build')).toBeDefined();
      expect(kg.important_files.some((f) => f.path === 'README.md')).toBe(true);
    });
  });
});
