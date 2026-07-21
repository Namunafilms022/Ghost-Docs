import { describe, it, expect, beforeAll } from 'vitest';
import { resolve } from 'node:path';

import { scanDirectory, detectLanguages, detectFrameworks, detectPackageManager, detectEntryPoints, buildDependencyGraph, buildFolderTree, classifyFiles, detectMonorepo, buildManifest, detectProjectType } from '@ghost-docs/intelligence-engine';
import { FileCategory, EntryPointType, EntryPointConfidence, FrameworkCategory, FrameworkConfidence, DependencyType } from '@ghost-docs/types';

const FIXTURE_PATH = resolve(__dirname, 'fixtures/sample-repo');

describe('Project Intelligence Engine', () => {
  describe('FileScanner', () => {
    it('scans all files and directories', async () => {
      const result = await scanDirectory(FIXTURE_PATH);
      expect(result.totalFiles).toBeGreaterThan(0);
      expect(result.totalDirs).toBeGreaterThan(0);
    });

    it('excludes node_modules by default', async () => {
      const result = await scanDirectory(FIXTURE_PATH);
      expect(result.files.filter((f) => f.relativePath.includes('node_modules')).length).toBe(0);
    });

    it('returns file metadata correctly', async () => {
      const result = await scanDirectory(FIXTURE_PATH);
      const readme = result.files.find((f) => f.name === 'README.md');
      expect(readme).toBeDefined();
      expect(readme!.extension).toBe('.md');
      expect(readme!.size).toBeGreaterThan(0);
    });
  });

  describe('LanguageDetector', () => {
    it('detects TypeScript and other languages', async () => {
      const scan = await scanDirectory(FIXTURE_PATH);
      const languages = detectLanguages(scan.files);
      expect(languages.length).toBeGreaterThan(0);
      expect(languages.find((l) => l.name === 'TypeScript')).toBeDefined();
    });

    it('returns percentages that sum to ~100', async () => {
      const scan = await scanDirectory(FIXTURE_PATH);
      const languages = detectLanguages(scan.files);
      const total = languages.reduce((sum, l) => sum + l.percentage, 0);
      expect(total).toBeCloseTo(100, -1);
    });
  });

  describe('FrameworkDetector', () => {
    it('detects React', async () => {
      const scan = await scanDirectory(FIXTURE_PATH);
      const frameworks = await detectFrameworks(scan.files, FIXTURE_PATH);
      expect(frameworks.find((f) => f.name === 'React')).toBeDefined();
    });

    it('detects Express', async () => {
      const scan = await scanDirectory(FIXTURE_PATH);
      const frameworks = await detectFrameworks(scan.files, FIXTURE_PATH);
      expect(frameworks.find((f) => f.name === 'Express')).toBeDefined();
    });

    it('detects Jest', async () => {
      const scan = await scanDirectory(FIXTURE_PATH);
      const frameworks = await detectFrameworks(scan.files, FIXTURE_PATH);
      expect(frameworks.find((f) => f.name === 'Jest')).toBeDefined();
    });

    it('detects Tailwind CSS', async () => {
      const scan = await scanDirectory(FIXTURE_PATH);
      const frameworks = await detectFrameworks(scan.files, FIXTURE_PATH);
      expect(frameworks.find((f) => f.name === 'Tailwind CSS')).toBeDefined();
    });
  });

  describe('PackageManagerDetector', () => {
    it('detects npm', async () => {
      const scan = await scanDirectory(FIXTURE_PATH);
      const pm = await detectPackageManager(scan.files, FIXTURE_PATH);
      expect(pm).toBeDefined();
      expect(pm!.name).toBe('npm');
    });

    it('reads build and test commands from scripts', async () => {
      const scan = await scanDirectory(FIXTURE_PATH);
      const pm = await detectPackageManager(scan.files, FIXTURE_PATH);
      expect(pm!.buildCommand).toBe('tsc');
      expect(pm!.testCommand).toBe('jest');
    });
  });

  describe('EntryPointDetector', () => {
    it('detects src/index.ts as main entry point', async () => {
      const scan = await scanDirectory(FIXTURE_PATH);
      const entries = await detectEntryPoints(scan.files, FIXTURE_PATH, 'npm');
      expect(entries.find((e) => e.path === 'src/index.ts')).toBeDefined();
    });

    it('detects entry points from file name patterns', async () => {
      const scan = await scanDirectory(FIXTURE_PATH);
      const entries = await detectEntryPoints(scan.files, FIXTURE_PATH, 'npm');
      const indexTs = entries.find((e) => e.path === 'src/index.ts');
      expect(indexTs).toBeDefined();
      expect(indexTs!.type).toBe(EntryPointType.Main);
    });
  });

  describe('DependencyGraph', () => {
    it('builds dependency graph from package.json', async () => {
      const scan = await scanDirectory(FIXTURE_PATH);
      const graph = await buildDependencyGraph(scan.files, FIXTURE_PATH);
      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.edges.length).toBeGreaterThan(0);
      expect(graph.nodes.find((n) => n.name === 'express')).toBeDefined();
      expect(graph.nodes.find((n) => n.name === 'jest')?.type).toBe(DependencyType.Development);
    });
  });

  describe('FileClassifier', () => {
    it('classifies README.md', async () => {
      const scan = await scanDirectory(FIXTURE_PATH);
      expect(classifyFiles(scan.files).find((f) => f.category === FileCategory.Readme)).toBeDefined();
    });

    it('classifies LICENSE', async () => {
      const scan = await scanDirectory(FIXTURE_PATH);
      expect(classifyFiles(scan.files).find((f) => f.category === FileCategory.License)).toBeDefined();
    });

    it('classifies Dockerfile', async () => {
      const scan = await scanDirectory(FIXTURE_PATH);
      expect(classifyFiles(scan.files).find((f) => f.category === FileCategory.Dockerfile)).toBeDefined();
    });

    it('classifies CI workflow', async () => {
      const scan = await scanDirectory(FIXTURE_PATH);
      expect(classifyFiles(scan.files).find((f) => f.category === FileCategory.CI)).toBeDefined();
    });
  });

  describe('FolderTree', () => {
    it('builds tree with directories first', async () => {
      const scan = await scanDirectory(FIXTURE_PATH);
      const tree = buildFolderTree(scan.files, FIXTURE_PATH);
      expect(tree.type).toBe('directory');
      expect(tree.children?.find((c) => c.name === 'src' && c.type === 'directory')).toBeDefined();
    });
  });

  describe('MonorepoDetector', () => {
    it('correctly identifies non-monorepo', async () => {
      const scan = await scanDirectory(FIXTURE_PATH);
      const result = await detectMonorepo(scan.files, FIXTURE_PATH);
      expect(result.isMonorepo).toBe(false);
    });
  });

  describe('Integration: Full Manifest', () => {
    it('generates complete project manifest', async () => {
      const { analyzeRepository } = await import('@ghost-docs/intelligence-engine');
      const manifest = await analyzeRepository({ repoUrl: FIXTURE_PATH, tempDir: '/tmp' });

      expect(manifest.repository.totalFiles).toBeGreaterThan(0);
      expect(manifest.languages.length).toBeGreaterThan(0);
      expect(manifest.frameworks.length).toBeGreaterThan(0);
      expect(manifest.packageManager).toBeDefined();
      expect(manifest.entryPoints.length).toBeGreaterThan(0);
      expect(manifest.importantFiles.length).toBeGreaterThan(0);
      expect(manifest.dependencyGraph.nodes.length).toBeGreaterThan(0);
      expect(manifest.projectType).toBeDefined();
      expect(manifest.hasDocker).toBe(true);
      expect(manifest.hasCI).toBe(true);
      expect(manifest.isMonorepo).toBe(false);
      expect(manifest.languages.some((l) => l.name === 'TypeScript')).toBe(true);
      expect(manifest.frameworks.map((f) => f.name)).toContain('React');
      expect(manifest.frameworks.map((f) => f.name)).toContain('Express');
    });
  });
});
