import type { ScannedFile, ImportantFileInfo } from '@ghost-docs/types';
import { FileCategory } from '@ghost-docs/types';

const RULES: { category: FileCategory; patterns: RegExp[] }[] = [
  { category: FileCategory.Readme, patterns: [/^readme(\.(md|rst|txt))?$/i] },
  { category: FileCategory.License, patterns: [/^license(\.(md|txt))?$/i, /^copying(\.(md|txt))?$/i] },
  { category: FileCategory.Dockerfile, patterns: [/^dockerfile$/i] },
  { category: FileCategory.DockerCompose, patterns: [/^docker-compose\.ya?ml$/i] },
  { category: FileCategory.CI, patterns: [/^\.github\/workflows\/.+\.ya?ml$/] },
  { category: FileCategory.Env, patterns: [/^\.env(\.\w+)?$/i, /^\.env\.example$/i] },
  { category: FileCategory.Gitignore, patterns: [/^\.gitignore$/] },
  { category: FileCategory.PackageConfig, patterns: [/^package\.json$/, /^pyproject\.toml$/, /^setup\.py$/, /^cargo\.toml$/, /^go\.mod$/, /^gemfile$/i, /^build\.gradle(\.kts)?$/, /^pom\.xml$/, /^composer\.json$/, /^requirements\.txt$/] },
  { category: FileCategory.LockFile, patterns: [/^package-lock\.json$/, /^yarn\.lock$/, /^pnpm-lock\.yaml$/, /^poetry\.lock$/, /^cargo\.lock$/, /^go\.sum$/] },
  { category: FileCategory.Config, patterns: [/^tsconfig\.json$/, /^\.prettierrc/, /^\.eslintrc/, /^webpack\.config/, /^vite\.config/, /^tailwind\.config/, /^next\.config/, /^nuxt\.config/, /^\.editorconfig$/, /^lerna\.json$/, /^nx\.json$/, /^turbo\.json$/] },
  { category: FileCategory.Documentation, patterns: [/^contributing\.md$/i, /^changelog\.md$/i, /^code_of_conduct\.md$/i] },
];

export function classifyFiles(files: ScannedFile[]): ImportantFileInfo[] {
  const classified: ImportantFileInfo[] = [];
  const seen = new Set<string>();
  for (const file of files) {
    for (const rule of RULES) {
      for (const pattern of rule.patterns) {
        if (pattern.test(file.relativePath) && !seen.has(file.relativePath)) {
          classified.push({ path: file.relativePath, name: file.name, category: rule.category });
          seen.add(file.relativePath);
          break;
        }
      }
    }
  }
  return classified;
}
