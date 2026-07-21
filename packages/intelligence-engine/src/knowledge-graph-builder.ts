import type {
  ProjectManifest,
  KnowledgeGraph,
  KnowledgeModule,
  APIEndpoint,
  CLICommand,
  DependencySummary,
  ModuleType,
  FolderTreeNode,
} from '@ghost-docs/types';
import { FrameworkCategory, EntryPointType } from '@ghost-docs/types';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export function buildKnowledgeGraph(manifest: ProjectManifest): KnowledgeGraph {
  return {
    project_summary: buildProjectSummary(manifest),
    languages: manifest.languages.map((l) => l.name),
    modules: extractModules(manifest),
    entry_points: manifest.entryPoints,
    authentication: detectAuthentication(manifest),
    database: detectDatabaseLayer(manifest),
    apis: detectAPIs(manifest),
    commands: extractCommands(manifest),
    important_files: manifest.importantFiles,
    direct_dependencies: summarizeDependencies(manifest),
  };
}

const DOC_LANGS = new Set(['Markdown', 'YAML', 'TOML', 'HTML', 'CSS', 'Shell', 'Dockerfile', 'Makefile']);

function buildProjectSummary(manifest: ProjectManifest): string {
  const parts: string[] = [];
  parts.push(`${capitalize(manifest.projectType.replace(/-/g, ' '))} project`);

  const mainLangs = manifest.languages
    .filter((l) => l.percentage > 5 && !DOC_LANGS.has(l.name))
    .map((l) => l.name);
  if (mainLangs.length > 0) {
    parts.push(`built with ${mainLangs.join(', ')}`);
  }

  const certainFrameworks = manifest.frameworks
    .filter((f) => f.confidence === 'certain')
    .map((f) => f.name);
  if (certainFrameworks.length > 0) {
    parts.push(`using ${certainFrameworks.join(', ')}`);
  }

  if (manifest.packageManager) {
    parts.push(`managed by ${manifest.packageManager.name}`);
  }

  if (manifest.isMonorepo) {
    parts.push('organized as a monorepo');
  }

  const result = parts.join(', ') + '.';
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function extractModules(manifest: ProjectManifest): KnowledgeModule[] {
  const modules: KnowledgeModule[] = [];
  const topLevelDirs = manifest.folderTree.children?.filter((c) => c.type === 'directory') ?? [];

  for (const dir of topLevelDirs) {
    const keyFiles = collectKeyFiles(dir, manifest);
    modules.push({
      name: dir.name,
      path: dir.path,
      type: classifyModuleType(dir.name),
      responsibilities: inferResponsibilities(dir.name),
      keyFiles,
    });
  }

  modules.push({
    name: 'root',
    path: '.',
    type: 'config',
    responsibilities: ['Project root configuration and metadata'],
    keyFiles: manifest.importantFiles.map((f) => f.path),
  });

  return modules;
}

function classifyModuleType(name: string): ModuleType {
  const lower = name.toLowerCase();
  if (['src', 'app', 'lib', 'core', 'source'].includes(lower)) return 'application';
  if (['packages', 'modules', 'vendor', 'deps'].includes(lower)) return 'library';
  if (['services', 'api', 'server', 'backend'].includes(lower)) return 'service';
  if (['config', 'conf', 'configuration', 'settings'].includes(lower)) return 'config';
  if (['test', 'tests', '__tests__', 'spec', 'specs', 'e2e', 'integration'].includes(lower)) return 'test';
  if (['utils', 'helpers', 'utilities', 'common', 'shared'].includes(lower)) return 'utility';
  if (['docs', 'documentation', 'wiki'].includes(lower)) return 'documentation';
  if (['scripts', 'bin', 'cli', 'cmd', 'tools', 'tooling'].includes(lower)) return 'tooling';
  if (['.github', '.gitlab', '.circleci', 'ci', 'cd'].includes(lower)) return 'tooling';
  return 'unknown';
}

function inferResponsibilities(name: string): string[] {
  const lower = name.toLowerCase();
  const resp: string[] = [];
  if (['src', 'app', 'core', 'source'].includes(lower)) resp.push('Main application source code');
  if (['packages', 'modules', 'vendor'].includes(lower)) resp.push('Shared libraries and reusable modules');
  if (['services', 'api'].includes(lower)) resp.push('Service layer and API endpoints');
  if (['server', 'backend'].includes(lower)) resp.push('Server-side logic and request handling');
  if (['config', 'conf', 'settings'].includes(lower)) resp.push('Application configuration and environment settings');
  if (['test', 'tests', '__tests__', 'spec', 'specs'].includes(lower)) resp.push('Automated tests and test utilities');
  if (['e2e', 'integration'].includes(lower)) resp.push('End-to-end and integration tests');
  if (['utils', 'helpers', 'utilities'].includes(lower)) resp.push('Utility functions and helper modules');
  if (['common', 'shared'].includes(lower)) resp.push('Shared code used across the project');
  if (['docs', 'documentation', 'wiki'].includes(lower)) resp.push('Project documentation and guides');
  if (['scripts', 'bin', 'cli', 'cmd', 'tools', 'tooling'].includes(lower)) resp.push('Build scripts, tooling, and CLI commands');
  if (['components'].includes(lower)) resp.push('Reusable UI components');
  if (['routes'].includes(lower)) resp.push('Route definitions and URL mappings');
  if (['middleware'].includes(lower)) resp.push('Middleware and request processing pipeline');
  if (['models'].includes(lower)) resp.push('Data models, schemas, and type definitions');
  if (['db', 'database', 'migrations'].includes(lower)) resp.push('Database layer, schema, and migrations');
  if (['hooks'].includes(lower)) resp.push('Custom hooks and lifecycle logic');
  if (['styles', 'css', 'assets'].includes(lower)) resp.push('Styles, assets, and static resources');
  if (['i18n', 'locales', 'translations'].includes(lower)) resp.push('Internationalization and translations');
  if (['providers'].includes(lower)) resp.push('Context providers and dependency injection');
  if (['.github', '.gitlab', '.circleci'].includes(lower)) resp.push('CI/CD workflows and GitHub configuration');
  if (['ci', 'cd'].includes(lower)) resp.push('Continuous integration and deployment configuration');
  if (resp.length === 0) resp.push('Project organization directory');
  return resp;
}

function collectKeyFiles(node: FolderTreeNode, manifest: ProjectManifest): string[] {
  const keys: string[] = [];
  if (!node.children) return keys;
  for (const child of node.children) {
    if (child.type === 'file') {
      keys.push(child.path);
    }
  }
  const isEntry = (p: string) => manifest.entryPoints.some((e) => e.path === p);
  keys.sort((a, b) => {
    const aEntry = isEntry(a) ? 0 : 1;
    const bEntry = isEntry(b) ? 0 : 1;
    return aEntry - bEntry;
  });
  return keys.slice(0, 10);
}

function detectAuthentication(manifest: ProjectManifest): string {
  const authDeps = manifest.dependencyGraph.nodes.filter((n) =>
    /^auth(?:$|[-_])|^@auth\//i.test(n.name) || /^next-auth$|^@auth\/|oauth|jwt|passport|jsonwebtoken|jose|clerk|supabase-auth|firebase-auth|lucia|kinde|logto|workos|supertokens|openid|oidc|saml|casl|cancan|pundit|policy|bcrypt|argon2/i.test(n.name) && !/author/i.test(n.name),
  );
  const authFiles = manifest.importantFiles.filter((f) =>
    /auth|login|signin|register|session|middleware|guard/i.test(f.path),
  );

  if (authDeps.length > 0) {
    return `Auth libraries: ${authDeps.map((d) => d.name).join(', ')}`;
  }
  if (authFiles.length > 0) {
    return `Auth files: ${authFiles.map((f) => f.path).join(', ')}`;
  }
  return 'Not detected';
}

function detectDatabaseLayer(manifest: ProjectManifest): string {
  const dbDeps = manifest.dependencyGraph.nodes.filter((n) =>
    /prisma|typeorm|sequelize|mongoose|sqlalchemy|psycopg2|asyncpg|aiosqlite|sqlite3|pymongo|motor|redis|dynamo|firebase|supabase|sqlite|mariadb|couch|neo4j|drizzle|knex|better-sqlite|gorm|sqlx|pgx|diesel|rusqlite|mongodb|postgres|mysql|mongo/i.test(
      n.name,
    ),
  );
  const dbFrameworks = manifest.frameworks.filter(
    (f) => f.category === FrameworkCategory.Database,
  );

  if (dbDeps.length > 0) {
    return dbDeps.map((d) => d.name).join(', ');
  }
  if (dbFrameworks.length > 0) {
    return dbFrameworks.map((f) => f.name).join(', ');
  }
  return 'Not detected';
}

function detectAPIs(manifest: ProjectManifest): APIEndpoint[] {
  const apis: APIEndpoint[] = [];
  const apiFrameworkNames = [
    'express',
    'fastapi',
    'django',
    'flask',
    'actix web',
    'axum',
    'spring boot',
    'next.js',
    'nuxt.js',
    'gin',
    'echo',
    'fiber',
    'rocket',
    'tornado',
    'bottle',
    'laravel',
    'symfony',
    'rails',
  ];

  for (const fw of manifest.frameworks) {
    if (apiFrameworkNames.includes(fw.name.toLowerCase())) {
      apis.push({ path: '/', type: 'rest', framework: fw.name });
    }
  }

  if (manifest.dependencyGraph.nodes.some((n) => /graphql/i.test(n.name))) {
    apis.push({ path: '/graphql', type: 'graphql', framework: null });
  }

  if (manifest.dependencyGraph.nodes.some((n) => /grpc/i.test(n.name))) {
    apis.push({ path: '/', type: 'grpc', framework: null });
  }

  if (manifest.dependencyGraph.nodes.some((n) => /socket\.io|websocket/i.test(n.name))) {
    apis.push({ path: '/ws', type: 'websocket', framework: null });
  }

  return apis;
}

function extractCommands(manifest: ProjectManifest): CLICommand[] {
  const commands: CLICommand[] = [];

  if (manifest.packageManager) {
    if (manifest.packageManager.installCommand) {
      commands.push({
        name: 'install',
        command: manifest.packageManager.installCommand,
        description: 'Install project dependencies',
      });
    }
    if (manifest.packageManager.buildCommand) {
      commands.push({
        name: 'build',
        command: manifest.packageManager.buildCommand,
        description: 'Build the project',
      });
    }
    if (manifest.packageManager.testCommand) {
      commands.push({
        name: 'test',
        command: manifest.packageManager.testCommand,
        description: 'Run the test suite',
      });
    }
    commands.push({
      name: 'dev',
      command: `${manifest.packageManager.runCommand} dev`,
      description: 'Start development server',
    });
  }

  if (manifest.hasDocker) {
    commands.push({
      name: 'docker-build',
      command: 'docker build -t <image> .',
      description: 'Build Docker image',
    });
  }

  return commands;
}

function summarizeDependencies(manifest: ProjectManifest): DependencySummary {
  const nodes = manifest.dependencyGraph.nodes;
  return {
    total: nodes.length,
    production: nodes.filter((n) => n.type === 'production').length,
    development: nodes.filter((n) => n.type === 'development').length,
  };
}

function capitalize(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}
