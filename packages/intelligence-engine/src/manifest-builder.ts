import type { ProjectManifest, ScannedFile, RepositoryInfo, LanguageInfo, FrameworkInfo, PackageManagerInfo, EntryPointInfo, DependencyGraph, FolderTreeNode, ImportantFileInfo, ProjectType } from '@ghost-docs/types';
import { FileCategory, EntryPointType, FrameworkCategory } from '@ghost-docs/types';

export interface ManifestInput {
  repository: RepositoryInfo; files: ScannedFile[]; languages: LanguageInfo[]; frameworks: FrameworkInfo[];
  packageManager: PackageManagerInfo | null; entryPoints: EntryPointInfo[]; dependencyGraph: DependencyGraph;
  folderTree: FolderTreeNode; importantFiles: ImportantFileInfo[]; isMonorepo: boolean; monorepoPackages: string[];
}

export function detectProjectType(languages: LanguageInfo[], frameworks: FrameworkInfo[], entryPoints: EntryPointInfo[], importantFiles: ImportantFileInfo[], isMonorepo: boolean): ProjectType {
  if (isMonorepo) return 'monorepo';
  const fwNames = frameworks.map((f) => f.name.toLowerCase());
  const fwCats = frameworks.map((f) => f.category);
  const cats = importantFiles.map((f) => f.category);
  const langs = languages.map((l) => l.name.toLowerCase());

  if (fwNames.some((f) => ['next.js', 'nuxt.js', 'gatsby', 'remix'].includes(f))) return 'web-application';
  const hasFE = fwCats.includes(FrameworkCategory.Frontend);
  const hasBE = fwCats.includes(FrameworkCategory.Backend);
  if (hasFE && hasBE) return 'web-application';
  if (hasBE && fwNames.some((f) => ['express', 'fastapi', 'django', 'flask', 'actix web', 'axum', 'spring boot'].includes(f))) return 'api-service';
  if (entryPoints.some((e) => e.type === EntryPointType.CLI)) return 'cli-tool';
  if (langs.includes('dart') || langs.includes('kotlin') || langs.includes('swift')) return 'mobile-app';
  if (langs.includes('c#')) return 'desktop-app';
  if (cats.includes(FileCategory.Documentation)) return 'documentation';
  if (cats.includes(FileCategory.Readme) && languages.length <= 1 && langs.includes('markdown')) return 'documentation';
  return 'unknown';
}

export function detectTestFramework(frameworks: FrameworkInfo[], packageManager: PackageManagerInfo | null): string | null {
  const test = frameworks.filter((f) => f.category === FrameworkCategory.Testing);
  if (test.length > 0) return test[0].name;
  return packageManager?.testCommand ? 'custom (via package manager)' : null;
}

export function buildManifest(input: ManifestInput): ProjectManifest {
  return {
    repository: input.repository,
    languages: input.languages,
    frameworks: input.frameworks,
    packageManager: input.packageManager,
    buildSystem: input.packageManager ? { name: input.packageManager.name, configFiles: input.packageManager.configFiles, buildCommand: input.packageManager.buildCommand ?? '' } : null,
    entryPoints: input.entryPoints,
    importantFiles: input.importantFiles,
    projectType: detectProjectType(input.languages, input.frameworks, input.entryPoints, input.importantFiles, input.isMonorepo),
    testFramework: detectTestFramework(input.frameworks, input.packageManager),
    hasDocker: input.importantFiles.some((f) => f.category === FileCategory.Dockerfile || f.category === FileCategory.DockerCompose),
    hasCI: input.importantFiles.some((f) => f.category === FileCategory.CI),
    isMonorepo: input.isMonorepo,
    dependencyGraph: input.dependencyGraph,
    folderTree: input.folderTree,
    detectedAt: new Date().toISOString(),
  };
}
