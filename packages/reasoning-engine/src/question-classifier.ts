import type { QuestionCategory } from '@ghost-docs/types';

interface ClassificationRule {
  category: QuestionCategory;
  keywords: string[];
  priority: number;
}

const RULES: ClassificationRule[] = [
  { category: 'project-purpose', keywords: ['what does this repo', 'what does this project', 'what is this', 'project purpose', 'what does it do', 'overview', 'summary', 'about'], priority: 1 },
  { category: 'authentication', keywords: ['auth', 'login', 'sign in', 'signin', 'password', 'oauth', 'jwt', 'session', 'authentication', 'authorization'], priority: 2 },
  { category: 'startup-flow', keywords: ['startup', 'start', 'boot', 'launch', 'init', 'initialize', 'how does it start', 'execution flow', 'entry flow', 'bootstrap'], priority: 2 },
  { category: 'entry-points', keywords: ['entry point', 'first file', 'where to start', 'main file', 'which file', 'read first', 'starting point', 'begin'], priority: 2 },
  { category: 'api-locations', keywords: ['api', 'rest', 'endpoint', 'route', 'graphql', 'grpc', 'web service', 'http', 'backend'], priority: 2 },
  { category: 'database-layer', keywords: ['database', 'db', 'data layer', 'storage', 'sql', 'nosql', 'mongo', 'postgres', 'prisma', 'orm', 'schema', 'migration', 'model'], priority: 2 },
  { category: 'testing', keywords: ['test', 'testing', 'unit test', 'integration test', 'e2e', 'jest', 'vitest', 'pytest', 'coverage'], priority: 2 },
  { category: 'build-commands', keywords: ['build', 'command', 'run', 'compile', 'install', 'deploy', 'start', 'dev server', 'how to'], priority: 2 },
  { category: 'folder-responsibilities', keywords: ['folder', 'directory', 'structure', 'module', 'component', 'layer', 'tier', 'organize'], priority: 2 },
  { category: 'dependencies', keywords: ['dependency', 'package', 'library', 'module', 'import', 'requirement', 'third-party'], priority: 2 },
  { category: 'architecture', keywords: ['architecture', 'design', 'pattern', 'flowchart', 'diagram', 'overall', 'high-level', 'system'], priority: 2 },
];

export class QuestionClassifier {
  classify(question: string): { category: QuestionCategory; score: number } {
    const lower = question.toLowerCase().trim();

    const matches: Array<{ category: QuestionCategory; matchCount: number }> = [];

    for (const rule of RULES) {
      let count = 0;
      for (const kw of rule.keywords) {
        if (lower.includes(kw)) count++;
      }
      if (count > 0) {
        matches.push({ category: rule.category, matchCount: count + (1 / rule.priority) });
      }
    }

    if (matches.length === 0) {
      return { category: 'unknown', score: 0 };
    }

    matches.sort((a, b) => b.matchCount - a.matchCount);
    const best = matches[0];
    const score = Math.min(best.matchCount / 3, 1);

    return { category: best.category, score };
  }
}
