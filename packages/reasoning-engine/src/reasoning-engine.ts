import type { KnowledgeGraph, QuestionCategory } from '@ghost-docs/types';
import { QuestionClassifier } from './question-classifier.js';
import { ConfidenceCalculator } from './confidence-calculator.js';
import { SourceResolver } from './source-resolver.js';

export interface ReasoningResult {
  answer: string;
  category: QuestionCategory;
  confidence: number;
  confidenceFactors: string[];
  supportingFiles: string[];
  supportingModules: string[];
  reasoningPath: string[];
}

export class ReasoningEngine {
  private classifier = new QuestionClassifier();
  private confidenceCalc = new ConfidenceCalculator();
  private sourceResolver = new SourceResolver();

  reason(kg: KnowledgeGraph, question: string): ReasoningResult {
    const { category, score: classificationScore } = this.classifier.classify(question);
    const confidence = this.confidenceCalc.calculate(kg, category);
    const sources = this.sourceResolver.resolve(kg, category);
    const answer = this.buildAnswer(kg, category, question);

    return {
      answer,
      category,
      confidence: Math.round(confidence.score * 100) / 100,
      confidenceFactors: confidence.factors,
      supportingFiles: sources.files,
      supportingModules: sources.modules,
      reasoningPath: sources.path,
    };
  }

  private buildAnswer(kg: KnowledgeGraph, category: QuestionCategory, question: string): string {
    switch (category) {
      case 'project-purpose':
        return kg.project_summary || 'No project summary available.';

      case 'authentication':
        if (kg.authentication !== 'Not detected') {
          return `Authentication is implemented using ${kg.authentication}.`;
        }
        return 'No authentication layer was detected in this project.';

      case 'startup-flow': {
        if (kg.entry_points.length === 0) return 'No entry points detected.';
        const lines: string[] = ['The application startup flow:'];
        for (const ep of kg.entry_points) {
          lines.push(`- Starts at \`${ep.path}\` (${ep.type})`);
        }
        lines.push('- Loads configuration and middleware');
        if (kg.database !== 'Not detected') lines.push('- Connects to database layer');
        if (kg.authentication !== 'Not detected') lines.push('- Sets up authentication');
        lines.push('- Registers API routes');
        return lines.join('\n');
      }

      case 'entry-points': {
        if (kg.entry_points.length === 0) return 'No entry points detected.';
        const lines: string[] = ['Entry points (highest confidence first):'];
        for (const ep of kg.entry_points) {
          lines.push(`- \`${ep.path}\` — ${ep.type} (${ep.confidence} confidence)`);
        }
        return lines.join('\n');
      }

      case 'api-locations': {
        if (kg.apis.length === 0) return 'No API endpoints detected.';
        const lines: string[] = ['API endpoints detected:'];
        for (const api of kg.apis) {
          lines.push(`- ${api.type.toUpperCase()}${api.framework ? ` via ${api.framework}` : ''} at \`${api.path}\``);
        }
        return lines.join('\n');
      }

      case 'database-layer':
        if (kg.database !== 'Not detected') {
          return `Database layer uses: ${kg.database}.`;
        }
        return 'No database layer was detected.';

      case 'testing': {
        const testCmd = kg.commands.find(c => c.name === 'test');
        const testModules = kg.modules.filter(m => m.type === 'test');
        const parts: string[] = [];
        if (testCmd) parts.push(`Test command: \`${testCmd.command}\``);
        if (testModules.length > 0) parts.push(`Test directories: ${testModules.map(m => `\`${m.path}/\``).join(', ')}`);
        if (parts.length === 0) return 'No testing framework detected.';
        return parts.join('\n');
      }

      case 'build-commands': {
        if (kg.commands.length === 0) return 'No commands detected.';
        const lines: string[] = ['Available commands:'];
        for (const cmd of kg.commands) {
          lines.push(`- \`${cmd.command}\` — ${cmd.description}`);
        }
        return lines.join('\n');
      }

      case 'folder-responsibilities': {
        const modules = kg.modules.filter(m => m.name !== 'root');
        if (modules.length === 0) return 'No module structure detected.';
        const lines: string[] = ['Folder responsibilities:'];
        for (const mod of modules) {
          const responsibilities = mod.responsibilities.join(', ');
          lines.push(`- \`${mod.path}/\` (${mod.type}): ${responsibilities}`);
        }
        return lines.join('\n');
      }

      case 'dependencies':
        return `Project has ${kg.dependencies.total} total dependencies: ${kg.dependencies.production} production, ${kg.dependencies.development} development.`;

      case 'architecture': {
        const parts: string[] = ['Project architecture:'];
        parts.push(`- Type: ${kg.project_summary.split('.')[0] || 'Unknown'}`);
        if (kg.modules.length > 0) parts.push(`- ${kg.modules.length} modules identified`);
        if (kg.entry_points.length > 0) parts.push(`- ${kg.entry_points.length} entry points`);
        if (kg.apis.length > 0) parts.push(`- ${kg.apis.length} API types`);
        if (kg.database !== 'Not detected') parts.push(`- Database: ${kg.database}`);
        return parts.join('\n');
      }

      default:
        return 'I could not classify this question. Try asking about: project purpose, authentication, startup flow, entry points, APIs, database, testing, build commands, folder structure, dependencies, or architecture.';
    }
  }
}
