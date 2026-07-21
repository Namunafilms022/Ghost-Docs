import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { generateExplainReport, generateMermaidDiagram } from '@ghost-docs/docs';
import { EntryPointType, EntryPointConfidence, FileCategory } from '@ghost-docs/types';
import type { KnowledgeGraph } from '@ghost-docs/types';

function createSampleKG(overrides?: Partial<KnowledgeGraph>): KnowledgeGraph {
  return {
    project_summary: 'Web Application project built with TypeScript using React, Express managed by npm.',
    languages: ['TypeScript', 'JavaScript'],
    modules: [
      {
        name: 'src',
        path: 'src',
        type: 'application',
        responsibilities: ['Main application source code'],
        keyFiles: ['src/index.ts', 'src/app.ts'],
      },
      {
        name: 'tests',
        path: 'tests',
        type: 'test',
        responsibilities: ['Automated tests and test utilities'],
        keyFiles: ['tests/app.test.ts'],
      },
      {
        name: 'docs',
        path: 'docs',
        type: 'documentation',
        responsibilities: ['Project documentation and guides'],
        keyFiles: [],
      },
      {
        name: 'root',
        path: '.',
        type: 'config',
        responsibilities: ['Project root configuration and metadata'],
        keyFiles: ['README.md', 'package.json', 'tsconfig.json'],
      },
    ],
    entry_points: [
      { path: 'src/index.ts', type: EntryPointType.Main, confidence: EntryPointConfidence.High, reason: 'File name matches entry point pattern: index.ts' },
      { path: 'src/server.ts', type: EntryPointType.Server, confidence: EntryPointConfidence.High, reason: 'File name matches entry point pattern: server.ts' },
    ],
    authentication: 'Auth libraries: jsonwebtoken, passport',
    database: 'prisma, postgres',
    apis: [
      { path: '/', type: 'rest', framework: 'Express' },
      { path: '/graphql', type: 'graphql', framework: null },
    ],
    commands: [
      { name: 'install', command: 'npm install', description: 'Install project dependencies' },
      { name: 'build', command: 'npm run build', description: 'Build the project' },
      { name: 'test', command: 'npm test', description: 'Run the test suite' },
      { name: 'dev', command: 'npm run dev', description: 'Start development server' },
      { name: 'docker-build', command: 'docker build -t <image> .', description: 'Build Docker image' },
    ],
    important_files: [
      { path: 'README.md', name: 'README.md', category: FileCategory.Readme },
      { path: 'package.json', name: 'package.json', category: FileCategory.PackageConfig },
      { path: 'tsconfig.json', name: 'tsconfig.json', category: FileCategory.Config },
      { path: 'Dockerfile', name: 'Dockerfile', category: FileCategory.Dockerfile },
      { path: '.github/workflows/ci.yml', name: 'ci.yml', category: FileCategory.CI },
    ],
    dependencies: { total: 25, production: 18, development: 7 },
    ...overrides,
  };
}

describe('Explain Repo Engine', () => {
  describe('generateExplainReport', () => {
    it('generates a complete report with all sections', () => {
      const kg = createSampleKG();
      const report = generateExplainReport(kg);

      expect(report).toContain('# Project Overview');
      expect(report).toContain('## 🚀 Project Summary');
      expect(report).toContain('## 📦 Tech Stack');
      expect(report).toContain('## 📂 Folder Responsibilities');
      expect(report).toContain('## 🔥 Entry Points');
      expect(report).toContain('## 🔄 Execution Flow');
      expect(report).toContain('## 🗄 Database Layer');
      expect(report).toContain('## 🔐 Authentication');
      expect(report).toContain('## 🌐 API Layer');
      expect(report).toContain('## 🧪 Testing');
      expect(report).toContain('## ⚙ Build & Run Commands');
      expect(report).toContain('## 📊 Architecture');
    });

    it('includes Mermaid diagram in architecture section', () => {
      const kg = createSampleKG();
      const report = generateExplainReport(kg);
      expect(report).toContain('```mermaid');
      expect(report).toContain('graph TD');
      expect(report).toContain('```');
    });

    it('includes project summary text', () => {
      const kg = createSampleKG();
      const report = generateExplainReport(kg);
      expect(report).toContain('Web Application project');
    });

    it('lists folder modules', () => {
      const kg = createSampleKG();
      const report = generateExplainReport(kg);
      expect(report).toContain('src/');
      expect(report).toContain('tests/');
      expect(report).toContain('docs/');
    });

    it('lists entry points in a table', () => {
      const kg = createSampleKG();
      const report = generateExplainReport(kg);
      expect(report).toContain('src/index.ts');
      expect(report).toContain('src/server.ts');
      expect(report).toContain('| Path | Type | Confidence |');
    });

    it('displays tech stack table', () => {
      const kg = createSampleKG();
      const report = generateExplainReport(kg);
      expect(report).toContain('| Category | Technology |');
      expect(report).toContain('25 total');
      expect(report).toContain('18 production');
    });

    it('shows database and auth info', () => {
      const kg = createSampleKG();
      const report = generateExplainReport(kg);
      expect(report).toContain('prisma, postgres');
      expect(report).toContain('jsonwebtoken, passport');
    });

    it('shows API endpoints', () => {
      const kg = createSampleKG();
      const report = generateExplainReport(kg);
      expect(report).toContain('REST');
      expect(report).toContain('GRAPHQL');
      expect(report).toContain('Express');
    });

    it('shows build and run commands', () => {
      const kg = createSampleKG();
      const report = generateExplainReport(kg);
      expect(report).toContain('npm install');
      expect(report).toContain('npm run build');
      expect(report).toContain('npm test');
    });

    it('shows docker build command when present', () => {
      const kg = createSampleKG();
      const report = generateExplainReport(kg);
      expect(report).toContain('docker build');
    });
  });

  describe('generateMermaidDiagram', () => {
    it('generates a graph TD diagram', () => {
      const kg = createSampleKG();
      const diagram = generateMermaidDiagram(kg);
      expect(diagram).toContain('graph TD');
    });

    it('includes entry point node', () => {
      const kg = createSampleKG();
      const diagram = generateMermaidDiagram(kg);
      expect(diagram).toContain('Entry:');
    });

    it('includes database node when detected', () => {
      const kg = createSampleKG();
      const diagram = generateMermaidDiagram(kg);
      expect(diagram).toContain('Database Layer');
    });

    it('includes auth node when detected', () => {
      const kg = createSampleKG();
      const diagram = generateMermaidDiagram(kg);
      expect(diagram).toContain('Auth Layer');
    });

    it('includes API nodes', () => {
      const kg = createSampleKG();
      const diagram = generateMermaidDiagram(kg);
      expect(diagram).toContain('API:');
    });

    it('handles empty knowledge gracefully', () => {
      const empty: KnowledgeGraph = {
        project_summary: '',
        languages: [],
        modules: [],
        entry_points: [],
        authentication: 'Not detected',
        database: 'Not detected',
        apis: [],
        commands: [],
        important_files: [],
        dependencies: { total: 0, production: 0, development: 0 },
      };
      const diagram = generateMermaidDiagram(empty);
      expect(diagram).toContain('graph TD');
    });
  });

  describe('Integration with KnowledgeGraph', () => {
    it('produces valid report from real sample repo', async () => {
      const FIXTURE_PATH = resolve(__dirname, 'fixtures/sample-repo');
      const { extractKnowledge } = await import('@ghost-docs/intelligence-engine');
      const kg = await extractKnowledge({ repoUrl: FIXTURE_PATH, tempDir: '/tmp' });

      const report = generateExplainReport(kg);
      expect(report).toContain('# Project Overview');
      expect(report).toContain('## 🚀 Project Summary');
      expect(report).toContain('## 📂 Folder Responsibilities');
      expect(report).toContain('## 🔥 Entry Points');
      expect(report).toContain('## ⚙ Build & Run Commands');
      expect(report).toContain('```mermaid');

      expect(report.length).toBeGreaterThan(200);
    });
  });
});
