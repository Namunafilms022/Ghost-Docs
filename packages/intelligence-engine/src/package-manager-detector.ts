import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ScannedFile, PackageManagerInfo } from '@ghost-docs/types';

interface PMDef {
  name: string;
  configFiles: string[];
  lockFiles: string[];
  installCmd: string;
  runCmd: string;
  hasBuild: boolean;
  hasTest: boolean;
  buildCmd: string;
  testCmd: string;
}

const PM_DEFS: PMDef[] = [
  { name: 'npm', configFiles: ['package.json'], lockFiles: ['package-lock.json'], installCmd: 'npm install', runCmd: 'npm run', hasBuild: true, hasTest: true, buildCmd: 'npm run build', testCmd: 'npm test' },
  { name: 'yarn', configFiles: ['package.json'], lockFiles: ['yarn.lock'], installCmd: 'yarn install', runCmd: 'yarn', hasBuild: true, hasTest: true, buildCmd: 'yarn build', testCmd: 'yarn test' },
  { name: 'pnpm', configFiles: ['package.json'], lockFiles: ['pnpm-lock.yaml'], installCmd: 'pnpm install', runCmd: 'pnpm', hasBuild: true, hasTest: true, buildCmd: 'pnpm build', testCmd: 'pnpm test' },
  { name: 'pip', configFiles: ['requirements.txt'], lockFiles: [], installCmd: 'pip install -r requirements.txt', runCmd: 'python', hasBuild: false, hasTest: false, buildCmd: '', testCmd: '' },
  { name: 'pipenv', configFiles: ['Pipfile'], lockFiles: ['Pipfile.lock'], installCmd: 'pipenv install', runCmd: 'pipenv run', hasBuild: false, hasTest: true, buildCmd: '', testCmd: 'pipenv run pytest' },
  { name: 'poetry', configFiles: ['pyproject.toml'], lockFiles: ['poetry.lock'], installCmd: 'poetry install', runCmd: 'poetry run', hasBuild: true, hasTest: true, buildCmd: 'poetry build', testCmd: 'poetry run pytest' },
  { name: 'cargo', configFiles: ['Cargo.toml'], lockFiles: ['Cargo.lock'], installCmd: 'cargo build', runCmd: 'cargo run', hasBuild: true, hasTest: true, buildCmd: 'cargo build', testCmd: 'cargo test' },
  { name: 'go', configFiles: ['go.mod'], lockFiles: ['go.sum'], installCmd: 'go mod download', runCmd: 'go run', hasBuild: true, hasTest: true, buildCmd: 'go build', testCmd: 'go test' },
  { name: 'bundler', configFiles: ['Gemfile'], lockFiles: ['Gemfile.lock'], installCmd: 'bundle install', runCmd: 'bundle exec', hasBuild: false, hasTest: true, buildCmd: '', testCmd: 'bundle exec rspec' },
  { name: 'gradle', configFiles: ['build.gradle', 'build.gradle.kts'], lockFiles: ['gradle.lockfile'], installCmd: 'gradle build', runCmd: 'gradle run', hasBuild: true, hasTest: true, buildCmd: 'gradle build', testCmd: 'gradle test' },
  { name: 'maven', configFiles: ['pom.xml'], lockFiles: [], installCmd: 'mvn install', runCmd: 'mvn exec:java', hasBuild: true, hasTest: true, buildCmd: 'mvn package', testCmd: 'mvn test' },
  { name: 'composer', configFiles: ['composer.json'], lockFiles: ['composer.lock'], installCmd: 'composer install', runCmd: 'php', hasBuild: false, hasTest: true, buildCmd: '', testCmd: 'phpunit' },
];

async function tryReadJson(filePath: string): Promise<Record<string, unknown> | null> {
  try { return JSON.parse(await readFile(filePath, 'utf-8')); } catch { return null; }
}

export async function detectPackageManager(files: ScannedFile[], rootPath: string): Promise<PackageManagerInfo | null> {
  const fileSet = new Set(files.map((f) => f.name));

  for (const pm of PM_DEFS) {
    if (!pm.configFiles.some((cfg) => fileSet.has(cfg))) continue;

    const foundLockFiles = pm.lockFiles.filter((lf) => fileSet.has(lf));

    if (pm.name === 'npm' && (fileSet.has('yarn.lock') || fileSet.has('pnpm-lock.yaml'))) continue;

    if (['npm', 'yarn', 'pnpm'].includes(pm.name)) {
      const pkg = await tryReadJson(join(rootPath, 'package.json'));
      if (pkg) {
        const scripts = pkg.scripts as Record<string, string> | undefined;
        return {
          name: pm.name, configFiles: pm.configFiles, lockFiles: foundLockFiles,
          installCommand: pm.installCmd,
          buildCommand: scripts?.build ?? (pm.hasBuild ? pm.buildCmd : null),
          testCommand: scripts?.test ?? (pm.hasTest ? pm.testCmd : null),
          runCommand: pm.runCmd,
        };
      }
    }

    return {
      name: pm.name, configFiles: pm.configFiles, lockFiles: foundLockFiles,
      installCommand: pm.installCmd,
      buildCommand: pm.hasBuild ? pm.buildCmd : null,
      testCommand: pm.hasTest ? pm.testCmd : null,
      runCommand: pm.runCmd,
    };
  }

  return null;
}
