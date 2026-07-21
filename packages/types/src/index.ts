export interface ProjectManifest {
  repository: RepositoryInfo;
  languages: LanguageInfo[];
  frameworks: FrameworkInfo[];
  packageManager: PackageManagerInfo | null;
  buildSystem: BuildSystemInfo | null;
  entryPoints: EntryPointInfo[];
  importantFiles: ImportantFileInfo[];
  projectType: ProjectType;
  testFramework: string | null;
  hasDocker: boolean;
  hasCI: boolean;
  isMonorepo: boolean;
  dependencyGraph: DependencyGraph;
  folderTree: FolderTreeNode;
  detectedAt: string;
}

export interface RepositoryInfo {
  url: string;
  localPath: string;
  defaultBranch: string | null;
  totalFiles: number;
  totalDirs: number;
  sizeBytes: number;
}

export interface LanguageInfo {
  name: string;
  percentage: number;
  fileCount: number;
  extensions: string[];
}

export interface FrameworkInfo {
  name: string;
  category: FrameworkCategory;
  version?: string;
  detectedFrom: string;
  confidence: FrameworkConfidence;
}

export enum FrameworkCategory {
  Frontend = 'frontend',
  Backend = 'backend',
  FullStack = 'fullstack',
  Testing = 'testing',
  CSS = 'css',
  Database = 'database',
  Mobile = 'mobile',
  Desktop = 'desktop',
  DevOps = 'devops',
  Other = 'other',
}

export enum FrameworkConfidence {
  Certain = 'certain',
  Likely = 'likely',
  Possible = 'possible',
}

export interface PackageManagerInfo {
  name: string;
  configFiles: string[];
  lockFiles: string[];
  installCommand: string;
  buildCommand: string | null;
  testCommand: string | null;
  runCommand: string;
}

export interface BuildSystemInfo {
  name: string;
  configFiles: string[];
  buildCommand: string;
}

export interface EntryPointInfo {
  path: string;
  type: EntryPointType;
  confidence: EntryPointConfidence;
  reason: string;
}

export enum EntryPointType {
  Main = 'main',
  CLI = 'cli',
  Script = 'script',
  Config = 'config',
  Server = 'server',
  Worker = 'worker',
}

export enum EntryPointConfidence {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export interface ImportantFileInfo {
  path: string;
  name: string;
  category: FileCategory;
}

export enum FileCategory {
  Readme = 'readme',
  License = 'license',
  Dockerfile = 'dockerfile',
  DockerCompose = 'docker-compose',
  CI = 'ci',
  CD = 'cd',
  Env = 'env',
  Config = 'config',
  Gitignore = 'gitignore',
  PackageConfig = 'package-config',
  LockFile = 'lock-file',
  Security = 'security',
  Documentation = 'documentation',
  Scripts = 'scripts',
}

export type ProjectType =
  | 'web-application'
  | 'api-service'
  | 'library'
  | 'cli-tool'
  | 'mobile-app'
  | 'desktop-app'
  | 'database'
  | 'dev-tool'
  | 'documentation'
  | 'monorepo'
  | 'template'
  | 'unknown';

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface DependencyNode {
  name: string;
  version?: string;
  type: DependencyType;
  path?: string;
}

export enum DependencyType {
  Production = 'production',
  Development = 'development',
  Peer = 'peer',
  Optional = 'optional',
}

export interface DependencyEdge {
  source: string;
  target: string;
  type?: DependencyType;
}

export interface FolderTreeNode {
  name: string;
  path: string;
  type: 'directory' | 'file';
  size?: number;
  children?: FolderTreeNode[];
}

export interface ScannedFile {
  path: string;
  name: string;
  extension: string;
  size: number;
  relativePath: string;
}

export interface ScanResult {
  files: ScannedFile[];
  directories: string[];
  totalFiles: number;
  totalDirs: number;
  totalSizeBytes: number;
}

export interface ProjectIntelligenceConfig {
  repoUrl: string;
  localPath?: string;
  tempDir?: string;
  maxFileSize?: number;
  excludePatterns?: string[];
}

export interface MonorepoInfo {
  isMonorepo: boolean;
  type: string | null;
  packages: string[];
  packageManager: string | null;
}

// ── Sync Engine Types (Phase 6) ──

export interface ChangedFile {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
}

export interface ChangeAnalysis {
  files: ChangedFile[];
  summary: string;
  hasBreaking: boolean;
  hasApiChanges: boolean;
  hasConfigChanges: boolean;
  hasDepChanges: boolean;
  hasSourceChanges: boolean;
}

export type DocType =
  | 'README'
  | 'CHANGELOG'
  | 'API_REFERENCE'
  | 'INSTALLATION_GUIDE'
  | 'ARCHITECTURE'
  | 'CONTRIBUTING'
  | 'UNKNOWN';

export interface DocumentationImpact {
  docType: DocType;
  filePath: string;
  reason: string;
  confidence: number;
  suggestedAction: 'create' | 'update' | 'no-change';
}

export interface DocumentationPatch {
  filePath: string;
  originalContent: string;
  patchedContent: string;
  additions: number;
  deletions: number;
  affectedSections: string[];
}

export interface PullRequestData {
  title: string;
  body: string;
  branch: string;
  base: string;
  files: string[];
  confidence: number;
}

export interface SyncResult {
  analysis: ChangeAnalysis;
  impacts: DocumentationImpact[];
  patches: DocumentationPatch[];
  pullRequest?: PullRequestData;
  confidence: number;
}

export interface SyncConfig {
  repoPath: string;
  repoUrl?: string;
  githubToken?: string;
  baseBranch?: string;
  dryRun?: boolean;
}

// ── Context Types (Phase 5.5) ──

export interface ContextSession {
  sessionId: string;
  currentTopic: QuestionCategory | null;
  currentModule: string | null;
  currentFile: string | null;
  previousQuestions: string[];
  previousAnswers: string[];
  reasoningPath: string[];
  confidenceHistory: number[];
  createdAt: number;
  lastActivityAt: number;
}

export interface ContextInfo {
  sessionId: string;
  currentTopic: QuestionCategory | null;
  currentTopicLabel: string;
  currentModule: string | null;
  currentFile: string | null;
  topicDerivedFrom: 'question' | 'context';
  isFollowUp: boolean;
  referencedPreviousQuestion: string | null;
}

// ── Reasoned Answer Types (Phase 5) ──

export type QuestionCategory =
  | 'project-purpose'
  | 'authentication'
  | 'startup-flow'
  | 'entry-points'
  | 'api-locations'
  | 'database-layer'
  | 'testing'
  | 'build-commands'
  | 'folder-responsibilities'
  | 'dependencies'
  | 'architecture'
  | 'unknown';

export interface ReasonedAnswer {
  question: string;
  answer: string;
  confidence: number;
  supportingFiles: string[];
  supportingModules: string[];
  reasoningPath: string[];
  transparency: string[];
  category: QuestionCategory;
  context?: ContextInfo;
}

// ── Knowledge Graph Types (Phase 3) ──

export interface KnowledgeGraph {
  project_summary: string;
  languages: string[];
  modules: KnowledgeModule[];
  entry_points: EntryPointInfo[];
  authentication: string;
  database: string;
  apis: APIEndpoint[];
  commands: CLICommand[];
  important_files: ImportantFileInfo[];
  dependencies: DependencySummary;
}

export interface KnowledgeModule {
  name: string;
  path: string;
  type: ModuleType;
  responsibilities: string[];
  keyFiles: string[];
}

export type ModuleType =
  | 'application'
  | 'library'
  | 'service'
  | 'config'
  | 'test'
  | 'utility'
  | 'documentation'
  | 'tooling'
  | 'unknown';

export interface APIEndpoint {
  path: string;
  type: APIType;
  framework: string | null;
}

export type APIType = 'rest' | 'graphql' | 'websocket' | 'grpc' | 'unknown';

export interface CLICommand {
  name: string;
  command: string;
  description: string;
}

export interface DependencySummary {
  total: number;
  production: number;
  development: number;
}

export const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.nuxt',
  '__pycache__',
  '.cache',
  '.venv',
  'venv',
  '.tox',
  'target/debug',
  'target/release',
  '.rpt2_cache',
  '.sass-cache',
  '.mypy_cache',
  '.pytest_cache',
  '.ruff_cache',
  'coverage',
  '.coverage',
  '*.pyc',
  '*.pyo',
  '*.so',
  '*.dylib',
  '*.exe',
  '*.dll',
  '*.class',
  '.DS_Store',
  'Thumbs.db',
  '*.log',
  '*.bak',
  '.gitkeep',
];
