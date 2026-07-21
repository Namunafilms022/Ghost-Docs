import { describe, it, expect, beforeEach } from 'vitest';
import type { ChangedFile, KnowledgeGraph, ChangeAnalysis } from '@ghost-docs/types';
import { ChangeAnalyzer, DocumentationImpactAnalyzer, MarkerParser, PatchGenerator, DiffRenderer } from '@ghost-docs/sync-engine';
import { FileCategory, EntryPointType, EntryPointConfidence, DependencyType, FrameworkCategory, FrameworkConfidence } from '@ghost-docs/types';

function createSampleKG(): KnowledgeGraph {
  return {
    project_summary: 'Web Application project built with TypeScript using React, Express managed by npm.',
    languages: ['TypeScript'],
    modules: [
      { name: 'src', path: 'src', type: 'application', responsibilities: ['Main source code'], keyFiles: ['src/index.ts'] },
      { name: 'tests', path: 'tests', type: 'test', responsibilities: ['Testing'], keyFiles: [] },
      { name: 'root', path: '.', type: 'config', responsibilities: ['Config'], keyFiles: ['package.json'] },
    ],
    entry_points: [{ path: 'src/index.ts', type: EntryPointType.Main, confidence: EntryPointConfidence.High, reason: 'main' }],
    authentication: 'Not detected',
    database: 'Not detected',
    apis: [{ path: '/api', type: 'rest', framework: 'Express' }],
    commands: [
      { name: 'install', command: 'npm install', description: 'Install' },
      { name: 'build', command: 'npm run build', description: 'Build' },
    ],
    important_files: [
      { path: 'README.md', name: 'README.md', category: FileCategory.Readme },
      { path: 'package.json', name: 'package.json', category: FileCategory.PackageConfig },
    ],
    direct_dependencies: { total: 10, production: 7, development: 3 },
  };
}

function createSampleFiles(): ChangedFile[] {
  return [
    { path: 'src/api/users.ts', status: 'modified', additions: 30, deletions: 5 },
    { path: 'src/auth/jwt.ts', status: 'modified', additions: 10, deletions: 2 },
    { path: 'package.json', status: 'modified', additions: 2, deletions: 1 },
    { path: 'src/index.ts', status: 'modified', additions: 1, deletions: 1 },
  ];
}

describe('Documentation Synchronization Engine', () => {
  describe('MarkerParser', () => {
    const parser = new MarkerParser();

    it('finds markers in content', () => {
      const content = 'Intro\n<!-- GHOST-DOCS:START -->\ngen\n<!-- GHOST-DOCS:END -->\nOutro';
      const markers = parser.findMarkers(content);
      expect(markers).not.toBeNull();
      expect(markers!.existingContent).toBe('gen');
    });

    it('returns null when no markers', () => {
      expect(parser.findMarkers('no markers here')).toBeNull();
    });

    it('wraps content in markers', () => {
      const wrapped = parser.wrapContent('hello');
      expect(wrapped).toContain('<!-- GHOST-DOCS:START -->');
      expect(wrapped).toContain('<!-- GHOST-DOCS:END -->');
      expect(wrapped).toContain('hello');
    });

    it('detects if markers exist', () => {
      expect(parser.hasMarkers('<!-- GHOST-DOCS:START -->\n<!-- GHOST-DOCS:END -->')).toBe(true);
      expect(parser.hasMarkers('no markers')).toBe(false);
    });

    it('updates content within markers', () => {
      const existing = 'Manual intro\n<!-- GHOST-DOCS:START -->\nold\n<!-- GHOST-DOCS:END -->\nManual outro';
      const updated = parser.updateWithinMarkers(existing, 'new content');
      expect(updated).toContain('Manual intro');
      expect(updated).toContain('Manual outro');
      expect(updated).toContain('new content');
      expect(updated).not.toContain('old');
    });

    it('appends markers when none exist', () => {
      const updated = parser.updateWithinMarkers('Manual only', 'generated');
      expect(updated).toContain('Manual only');
      expect(updated).toContain('<!-- GHOST-DOCS:START -->');
      expect(updated).toContain('<!-- GHOST-DOCS:END -->');
      expect(updated).toContain('generated');
    });
  });

  describe('ChangeAnalyzer', () => {
    const analyzer = new ChangeAnalyzer();

    it('analyzes basic changes', () => {
      const r = analyzer.analyze(createSampleFiles());
      expect(r.files.length).toBe(4);
      expect(r.summary).toContain('4 modified');
      expect(r.hasApiChanges).toBe(true);
      expect(r.hasDepChanges).toBe(true);
      expect(r.hasSourceChanges).toBe(true);
    });

    it('detects breaking changes from API changes', () => {
      const r = analyzer.analyze(createSampleFiles());
      expect(r.hasBreaking).toBe(true);
    });

    it('handles empty changes', () => {
      const r = analyzer.analyze([]);
      expect(r.files.length).toBe(0);
      expect(r.hasSourceChanges).toBe(false);
    });

    it('sorts by change magnitude', () => {
      const r = analyzer.analyze(createSampleFiles());
      expect(r.files[0].additions).toBeGreaterThanOrEqual(r.files[1].additions);
    });
  });

  describe('DocumentationImpactAnalyzer', () => {
    const analyzer = new DocumentationImpactAnalyzer();
    const kg = createSampleKG();

    it('detects README impact from API changes', () => {
      const analysis: ChangeAnalysis = {
        files: createSampleFiles(),
        summary: '4 modified',
        hasBreaking: true,
        hasApiChanges: true,
        hasConfigChanges: true,
        hasDepChanges: true,
        hasSourceChanges: true,
      };
      const impacts = analyzer.analyze(analysis, kg);
      expect(impacts.some((i) => i.docType === 'README')).toBe(true);
    });

    it('detects CHANGELOG impact', () => {
      const analysis: ChangeAnalysis = {
        files: createSampleFiles(), summary: '', hasBreaking: true,
        hasApiChanges: false, hasConfigChanges: false, hasDepChanges: false, hasSourceChanges: false,
      };
      const impacts = analyzer.analyze(analysis, kg);
      expect(impacts.some((i) => i.docType === 'CHANGELOG')).toBe(true);
    });

    it('detects API reference impact', () => {
      const analysis: ChangeAnalysis = {
        files: [], summary: '', hasBreaking: false,
        hasApiChanges: true, hasConfigChanges: false, hasDepChanges: false, hasSourceChanges: false,
      };
      const impacts = analyzer.analyze(analysis, kg);
      expect(impacts.some((i) => i.docType === 'API_REFERENCE')).toBe(true);
    });

    it('detects installation guide from dep changes', () => {
      const analysis: ChangeAnalysis = {
        files: [], summary: '', hasBreaking: false,
        hasApiChanges: false, hasConfigChanges: false, hasDepChanges: true, hasSourceChanges: false,
      };
      const impacts = analyzer.analyze(analysis, kg);
      expect(impacts.some((i) => i.docType === 'INSTALLATION_GUIDE')).toBe(true);
    });

    it('returns empty for no changes', () => {
      const emptyKG: KnowledgeGraph = {
        project_summary: '', languages: [], modules: [], entry_points: [],
        authentication: 'Not detected', database: 'Not detected', apis: [], commands: [],
        important_files: [], direct_dependencies: { total: 0, production: 0, development: 0 },
      };
      const analysis: ChangeAnalysis = {
        files: [], summary: '', hasBreaking: false,
        hasApiChanges: false, hasConfigChanges: false, hasDepChanges: false, hasSourceChanges: false,
      };
      const impacts = analyzer.analyze(analysis, emptyKG);
      expect(impacts.length).toBe(0);
    });
  });

  describe('PatchGenerator', () => {
    const generator = new PatchGenerator();
    const kg = createSampleKG();

    it('generates README patch with markers', () => {
      const impact = {
        docType: 'README' as const,
        filePath: 'README.md',
        reason: 'API changes',
        confidence: 0.9,
        suggestedAction: 'update' as const,
      };
      const analysis: ChangeAnalysis = {
        files: createSampleFiles(), summary: '4 modified', hasBreaking: true,
        hasApiChanges: true, hasConfigChanges: false, hasDepChanges: false, hasSourceChanges: true,
      };
      const patch = generator.generate(impact, kg, '# Manual content\n## Old Section\nold', analysis);
      expect(patch.filePath).toBe('README.md');
      expect(patch.patchedContent).toContain('<!-- GHOST-DOCS:START -->');
      expect(patch.patchedContent).toContain('<!-- GHOST-DOCS:END -->');
      expect(patch.patchedContent).toContain('# Manual content');
      expect(patch.additions).toBeGreaterThan(0);
    });

    it('generates CHANGELOG patch', () => {
      const impact = {
        docType: 'CHANGELOG' as const,
        filePath: 'CHANGELOG.md',
        reason: 'breaking changes',
        confidence: 0.9,
        suggestedAction: 'update' as const,
      };
      const analysis: ChangeAnalysis = {
        files: createSampleFiles(), summary: '4 files changed', hasBreaking: true,
        hasApiChanges: false, hasConfigChanges: false, hasDepChanges: false, hasSourceChanges: false,
      };
      const patch = generator.generate(impact, kg, '', analysis);
      expect(patch.patchedContent).toContain('4 files changed');
      expect(patch.patchedContent).toContain('Breaking changes');
    });

    it('preserves manual content outside markers', () => {
      const existing = '# My Project\n\nManual intro section\n\n<!-- GHOST-DOCS:START -->\nold generated\n<!-- GHOST-DOCS:END -->\n\n## Custom Section\nManually written notes';
      const impact = {
        docType: 'README' as const,
        filePath: 'README.md',
        reason: 'test',
        confidence: 0.8,
        suggestedAction: 'update' as const,
      };
      const analysis: ChangeAnalysis = {
        files: [], summary: '', hasBreaking: false,
        hasApiChanges: false, hasConfigChanges: false, hasDepChanges: false, hasSourceChanges: true,
      };
      const patch = generator.generate(impact, kg, existing, analysis);
      expect(patch.patchedContent).toContain('Manual intro section');
      expect(patch.patchedContent).toContain('Custom Section');
      expect(patch.patchedContent).toContain('Manually written notes');
      expect(patch.patchedContent).not.toContain('old generated');
    });
  });

  describe('DiffRenderer', () => {
    const renderer = new DiffRenderer();

    it('renders preview with impacts', () => {
      const result = {
        analysis: { files: [], summary: '4 files changed', hasBreaking: false, hasApiChanges: false, hasConfigChanges: false, hasDepChanges: false, hasSourceChanges: false },
        impacts: [
          { docType: 'README' as const, filePath: 'README.md', reason: 'API changes', confidence: 0.9, suggestedAction: 'update' as const },
        ],
        patches: [],
        confidence: 0.9,
      };
      const preview = renderer.render(result);
      expect(preview).toContain('Documentation Sync Preview');
      expect(preview).toContain('README');
      expect(preview).toContain('90%');
    });

    it('shows no changes needed message', () => {
      const result = {
        analysis: { files: [], summary: '', hasBreaking: false, hasApiChanges: false, hasConfigChanges: false, hasDepChanges: false, hasSourceChanges: false },
        impacts: [],
        patches: [],
        confidence: 0,
      };
      const preview = renderer.render(result);
      expect(preview).toContain('No documentation changes needed');
    });
  });
});
