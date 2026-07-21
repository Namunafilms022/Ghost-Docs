import type { ProjectManifest, ProjectIntelligenceConfig, KnowledgeGraph } from '@ghost-docs/types';
import { fetchRepository, buildRepositoryInfo } from './repo-fetcher.js';
import { scanDirectory } from './file-scanner.js';
import { detectLanguages } from './language-detector.js';
import { detectFrameworks } from './framework-detector.js';
import { detectPackageManager } from './package-manager-detector.js';
import { detectEntryPoints } from './entry-point-detector.js';
import { buildDependencyGraph } from './dependency-graph.js';
import { buildFolderTree } from './folder-tree.js';
import { classifyFiles } from './file-classifier.js';
import { detectMonorepo } from './monorepo-detector.js';
import { buildManifest } from './manifest-builder.js';
import { buildKnowledgeGraph } from './knowledge-graph-builder.js';

export class RepoError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RepoError';
  }
}

export async function analyzeRepository(config: ProjectIntelligenceConfig): Promise<ProjectManifest> {
  if (!config.repoUrl) {
    throw new RepoError('Repository URL or path is required', 'MISSING_URL');
  }

  const fetched = await fetchRepository(config.repoUrl, config.tempDir);
  try {
    const scan = await scanDirectory(fetched.path, config.excludePatterns);

    if (scan.totalFiles === 0) {
      throw new RepoError(
        `No files found at "${config.repoUrl}". Make sure the path exists and is not empty.`,
        'EMPTY_REPO',
      );
    }

    const repository = await buildRepositoryInfo(fetched.path, config.repoUrl);

    const [languages, frameworks, packageManager, importantFiles, monorepo] = await Promise.all([
      Promise.resolve(detectLanguages(scan.files)),
      detectFrameworks(scan.files, fetched.path),
      detectPackageManager(scan.files, fetched.path),
      Promise.resolve(classifyFiles(scan.files)),
      detectMonorepo(scan.files, fetched.path),
    ]);

    const entryPoints = await detectEntryPoints(scan.files, fetched.path, packageManager?.name);
    const dependencyGraph = await buildDependencyGraph(scan.files, fetched.path);
    const folderTree = buildFolderTree(scan.files, fetched.path);

    return buildManifest({
      repository, files: scan.files, languages, frameworks, packageManager,
      entryPoints, dependencyGraph, folderTree, importantFiles,
      isMonorepo: monorepo.isMonorepo, monorepoPackages: monorepo.packages,
    });
  } finally {
    await fetched.cleanup();
  }
}

export async function extractKnowledge(config: ProjectIntelligenceConfig): Promise<KnowledgeGraph> {
  const manifest = await analyzeRepository(config);
  return buildKnowledgeGraph(manifest);
}
