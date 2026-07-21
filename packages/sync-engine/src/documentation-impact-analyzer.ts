import type { ChangeAnalysis, DocumentationImpact, KnowledgeGraph, DocType } from '@ghost-docs/types';

const DOC_PATTERNS: Array<{ type: DocType; patterns: RegExp[] }> = [
  { type: 'README', patterns: [/^readme(\.(md|rst|txt))?$/i] },
  { type: 'CHANGELOG', patterns: [/^changelog(\.(md|rst|txt))?$/i, /^whatsnew/i] },
  { type: 'API_REFERENCE', patterns: [/\/api-docs/, /\/api-reference/, /\/swagger/, /\/openapi/] },
  { type: 'INSTALLATION_GUIDE', patterns: [/^installation/, /^getting-started/, /^setup/] },
  { type: 'ARCHITECTURE', patterns: [/^architecture/, /^ARCHITECTURE/, /\/architecture/] },
  { type: 'CONTRIBUTING', patterns: [/^contributing(\.md)?$/i] },
];

export class DocumentationImpactAnalyzer {
  analyze(analysis: ChangeAnalysis, kg: KnowledgeGraph): DocumentationImpact[] {
    const impacts: DocumentationImpact[] = [];

    this.checkReadme(analysis, kg, impacts);
    this.checkChangelog(analysis, impacts);
    this.checkApiReference(analysis, kg, impacts);
    this.checkInstallationGuide(analysis, kg, impacts);
    this.checkArchitecture(analysis, kg, impacts);

    return impacts;
  }

  private checkReadme(analysis: ChangeAnalysis, kg: KnowledgeGraph, impacts: DocumentationImpact[]): void {
    const existingReadme = kg.important_files.find((f) => /readme/i.test(f.name));
    const reasons: string[] = [];

    if (analysis.hasBreaking) reasons.push('Breaking changes detected');
    if (analysis.hasApiChanges) reasons.push('API changes detected');
    if (analysis.hasDepChanges) reasons.push('Dependency changes detected');
    if (analysis.hasConfigChanges) reasons.push('Configuration changes detected');
    if (analysis.hasSourceChanges && analysis.files.length > 3) reasons.push('Significant source code changes');

    if (reasons.length > 0) {
      impacts.push({
        docType: 'README',
        filePath: existingReadme?.path || 'README.md',
        reason: reasons.join('; '),
        confidence: Math.min(0.5 + reasons.length * 0.15, 0.95),
        suggestedAction: existingReadme ? 'update' : 'create',
      });
    }
  }

  private checkChangelog(analysis: ChangeAnalysis, impacts: DocumentationImpact[]): void {
    if (analysis.hasBreaking || analysis.files.length > 0) {
      const existing = analysis.files.find((f) => /changelog/i.test(f.path));
      impacts.push({
        docType: 'CHANGELOG',
        filePath: existing?.path || 'CHANGELOG.md',
        reason: `${analysis.files.length} files changed, ${analysis.summary}`,
        confidence: analysis.hasBreaking ? 0.9 : 0.65,
        suggestedAction: existing ? 'update' : 'create',
      });
    }
  }

  private checkApiReference(analysis: ChangeAnalysis, kg: KnowledgeGraph, impacts: DocumentationImpact[]): void {
    if (!analysis.hasApiChanges && kg.apis.length === 0) return;

    const reasons: string[] = [];
    if (analysis.hasApiChanges) reasons.push('API endpoints modified');
    if (kg.apis.length > 0) reasons.push(`${kg.apis.length} API types documented`);

    impacts.push({
      docType: 'API_REFERENCE',
      filePath: 'API.md',
      reason: reasons.join('; '),
      confidence: analysis.hasApiChanges ? 0.92 : 0.6,
      suggestedAction: 'update',
    });
  }

  private checkInstallationGuide(analysis: ChangeAnalysis, kg: KnowledgeGraph, impacts: DocumentationImpact[]): void {
    if (!analysis.hasDepChanges && !analysis.hasConfigChanges) return;

    impacts.push({
      docType: 'INSTALLATION_GUIDE',
      filePath: 'INSTALLATION.md',
      reason: 'Dependencies or configuration changed',
      confidence: 0.85,
      suggestedAction: 'update',
    });
  }

  private checkArchitecture(analysis: ChangeAnalysis, kg: KnowledgeGraph, impacts: DocumentationImpact[]): void {
    if (analysis.files.length < 2) return;

    const significantChanges = analysis.files.filter(
      (f) => f.additions + f.deletions > 20,
    );

    if (significantChanges.length > 2) {
      impacts.push({
        docType: 'ARCHITECTURE',
        filePath: 'ARCHITECTURE.md',
        reason: `${significantChanges.length} files with significant changes`,
        confidence: 0.7,
        suggestedAction: 'update',
      });
    }
  }
}
