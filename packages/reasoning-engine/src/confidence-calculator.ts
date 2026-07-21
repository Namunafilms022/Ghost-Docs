import type { KnowledgeGraph, QuestionCategory } from '@ghost-docs/types';

export interface ConfidenceResult {
  score: number;
  factors: string[];
}

export class ConfidenceCalculator {
  calculate(kg: KnowledgeGraph, category: QuestionCategory): ConfidenceResult {
    const factors: string[] = [];

    switch (category) {
      case 'project-purpose':
        if (kg.project_summary && kg.project_summary.length > 10) {
          factors.push('Project summary available');
          return { score: 0.95, factors };
        }
        factors.push('No project summary');
        return { score: 0.2, factors };

      case 'authentication':
        if (kg.authentication !== 'Not detected') {
          factors.push(`Auth data: ${kg.authentication}`);
          return { score: 0.96, factors };
        }
        factors.push('No authentication detected');
        return { score: 0.1, factors };

      case 'startup-flow':
        if (kg.entry_points.length > 0) {
          factors.push(`${kg.entry_points.length} entry points`);
          return { score: 0.92, factors };
        }
        factors.push('No entry points');
        return { score: 0.1, factors };

      case 'entry-points':
        if (kg.entry_points.length > 0) {
          factors.push(`${kg.entry_points.length} entry points`);
          return { score: 0.94, factors };
        }
        factors.push('No entry points');
        return { score: 0.1, factors };

      case 'api-locations':
        if (kg.apis.length > 0) {
          factors.push(`${kg.apis.length} APIs detected: ${kg.apis.map(a => a.type).join(', ')}`);
          return { score: 0.93, factors };
        }
        factors.push('No APIs detected');
        return { score: 0.15, factors };

      case 'database-layer':
        if (kg.database !== 'Not detected') {
          factors.push(`Database: ${kg.database}`);
          return { score: 0.95, factors };
        }
        factors.push('No database detected');
        return { score: 0.1, factors };

      case 'testing':
        {
          const testCmds = kg.commands.filter(c => c.name === 'test');
          const testModules = kg.modules.filter(m => m.type === 'test');
          if (testCmds.length > 0 || testModules.length > 0) {
            if (testCmds.length > 0) factors.push(`Test command: ${testCmds[0].command}`);
            if (testModules.length > 0) factors.push(`${testModules.length} test directories`);
            return { score: 0.9, factors };
          }
          factors.push('No testing detected');
          return { score: 0.1, factors };
        }

      case 'build-commands':
        if (kg.commands.length > 0) {
          factors.push(`${kg.commands.length} commands available`);
          return { score: 0.95, factors };
        }
        factors.push('No commands detected');
        return { score: 0.1, factors };

      case 'folder-responsibilities':
        if (kg.modules.filter(m => m.name !== 'root').length > 0) {
          factors.push(`${kg.modules.length - 1} non-root modules`);
          return { score: 0.9, factors };
        }
        factors.push('No modules detected');
        return { score: 0.1, factors };

      case 'dependencies':
        if (kg.dependencies.total > 0) {
          factors.push(`${kg.dependencies.total} dependencies`);
          return { score: 0.96, factors };
        }
        factors.push('No dependency data');
        return { score: 0.1, factors };

      case 'architecture':
        {
          const infoCount = [kg.modules.length, kg.entry_points.length, kg.apis.length, kg.commands.length].filter(c => c > 0).length;
          factors.push(`${infoCount}/4 architecture dimensions available`);
          const score = 0.5 + (infoCount / 4) * 0.45;
          return { score: Math.min(score, 0.95), factors };
        }

      default:
        factors.push('Unknown question category');
        return { score: 0.1, factors };
    }
  }
}
