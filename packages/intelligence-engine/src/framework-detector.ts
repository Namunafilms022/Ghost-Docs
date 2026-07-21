import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ScannedFile, FrameworkInfo } from '@ghost-docs/types';
import { FrameworkCategory, FrameworkConfidence } from '@ghost-docs/types';

interface FrameworkRule {
  name: string;
  category: FrameworkCategory;
  detect: (files: ScannedFile[], rootPath: string) => Promise<FrameworkInfo | null>;
}

async function tryReadJson(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function tryReadFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

const RULES: FrameworkRule[] = [
  {
    name: 'Next.js', category: FrameworkCategory.FullStack,
    detect: async (files, rootPath) => {
      const hasConfig = files.some((f) => /^next\.config\./.test(f.name));
      if (hasConfig) return { name: 'Next.js', category: FrameworkCategory.FullStack, detectedFrom: 'next.config.*', confidence: FrameworkConfidence.Certain };
      const pkg = await tryReadJson(join(rootPath, 'package.json'));
      if (pkg?.dependencies && typeof pkg.dependencies === 'object' && 'next' in pkg.dependencies) {
        return { name: 'Next.js', category: FrameworkCategory.FullStack, version: String(pkg.dependencies.next), detectedFrom: 'package.json', confidence: FrameworkConfidence.Certain };
      }
      return null;
    },
  },
  {
    name: 'React', category: FrameworkCategory.Frontend,
    detect: async (_files, rootPath) => {
      const pkg = await tryReadJson(join(rootPath, 'package.json'));
      for (const section of ['dependencies', 'devDependencies'] as const) {
        if (pkg?.[section] && typeof pkg[section] === 'object' && 'react' in (pkg[section] as Record<string, string>)) {
          return { name: 'React', category: FrameworkCategory.Frontend, version: String((pkg[section] as Record<string, string>).react), detectedFrom: 'package.json', confidence: FrameworkConfidence.Certain };
        }
      }
      return null;
    },
  },
  {
    name: 'Vue.js', category: FrameworkCategory.Frontend,
    detect: async (files, rootPath) => {
      if (files.some((f) => f.extension === '.vue')) {
        return { name: 'Vue.js', category: FrameworkCategory.Frontend, detectedFrom: '.vue files', confidence: FrameworkConfidence.Certain };
      }
      const pkg = await tryReadJson(join(rootPath, 'package.json'));
      if (pkg?.dependencies && typeof pkg.dependencies === 'object' && 'vue' in pkg.dependencies) {
        return { name: 'Vue.js', category: FrameworkCategory.Frontend, version: String(pkg.dependencies.vue), detectedFrom: 'package.json', confidence: FrameworkConfidence.Certain };
      }
      return null;
    },
  },
  {
    name: 'Express', category: FrameworkCategory.Backend,
    detect: async (_files, rootPath) => {
      const pkg = await tryReadJson(join(rootPath, 'package.json'));
      if (pkg?.dependencies && typeof pkg.dependencies === 'object' && 'express' in pkg.dependencies) {
        return { name: 'Express', category: FrameworkCategory.Backend, version: String(pkg.dependencies.express), detectedFrom: 'package.json', confidence: FrameworkConfidence.Certain };
      }
      return null;
    },
  },
  {
    name: 'FastAPI', category: FrameworkCategory.Backend,
    detect: async (_files, rootPath) => {
      const content = await tryReadFile(join(rootPath, 'requirements.txt'));
      if (content?.includes('fastapi')) return { name: 'FastAPI', category: FrameworkCategory.Backend, detectedFrom: 'requirements.txt', confidence: FrameworkConfidence.Certain };
      return null;
    },
  },
  {
    name: 'Django', category: FrameworkCategory.Backend,
    detect: async (files, rootPath) => {
      if (files.some((f) => f.name === 'manage.py')) return { name: 'Django', category: FrameworkCategory.Backend, detectedFrom: 'manage.py', confidence: FrameworkConfidence.Certain };
      const content = await tryReadFile(join(rootPath, 'requirements.txt'));
      if (content?.includes('django')) return { name: 'Django', category: FrameworkCategory.Backend, detectedFrom: 'requirements.txt', confidence: FrameworkConfidence.Certain };
      return null;
    },
  },
  {
    name: 'Flask', category: FrameworkCategory.Backend,
    detect: async (_files, rootPath) => {
      const content = await tryReadFile(join(rootPath, 'requirements.txt'));
      if (content?.includes('flask')) return { name: 'Flask', category: FrameworkCategory.Backend, detectedFrom: 'requirements.txt', confidence: FrameworkConfidence.Certain };
      return null;
    },
  },
  {
    name: 'Spring Boot', category: FrameworkCategory.Backend,
    detect: async (files) => {
      if (files.some((f) => f.name === 'pom.xml' || /^build\.gradle/.test(f.name))) {
        return { name: 'Spring Boot', category: FrameworkCategory.Backend, detectedFrom: 'build config', confidence: FrameworkConfidence.Possible };
      }
      return null;
    },
  },
  {
    name: 'Actix Web', category: FrameworkCategory.Backend,
    detect: async (_files, rootPath) => {
      const content = await tryReadFile(join(rootPath, 'Cargo.toml'));
      if (content?.includes('actix-web')) return { name: 'Actix Web', category: FrameworkCategory.Backend, detectedFrom: 'Cargo.toml', confidence: FrameworkConfidence.Certain };
      return null;
    },
  },
  {
    name: 'Axum', category: FrameworkCategory.Backend,
    detect: async (_files, rootPath) => {
      const content = await tryReadFile(join(rootPath, 'Cargo.toml'));
      if (content?.includes('axum')) return { name: 'Axum', category: FrameworkCategory.Backend, detectedFrom: 'Cargo.toml', confidence: FrameworkConfidence.Certain };
      return null;
    },
  },
  {
    name: 'Tailwind CSS', category: FrameworkCategory.CSS,
    detect: async (files, rootPath) => {
      if (files.some((f) => /^tailwind\.config\./.test(f.name))) {
        return { name: 'Tailwind CSS', category: FrameworkCategory.CSS, detectedFrom: 'tailwind.config.*', confidence: FrameworkConfidence.Certain };
      }
      const pkg = await tryReadJson(join(rootPath, 'package.json'));
      if (pkg?.devDependencies && typeof pkg.devDependencies === 'object' && 'tailwindcss' in pkg.devDependencies) {
        return { name: 'Tailwind CSS', category: FrameworkCategory.CSS, version: String(pkg.devDependencies.tailwindcss), detectedFrom: 'package.json', confidence: FrameworkConfidence.Certain };
      }
      return null;
    },
  },
  {
    name: 'Jest', category: FrameworkCategory.Testing,
    detect: async (_files, rootPath) => {
      const pkg = await tryReadJson(join(rootPath, 'package.json'));
      if (pkg?.devDependencies && typeof pkg.devDependencies === 'object' && 'jest' in pkg.devDependencies) {
        return { name: 'Jest', category: FrameworkCategory.Testing, version: String(pkg.devDependencies.jest), detectedFrom: 'package.json', confidence: FrameworkConfidence.Certain };
      }
      return null;
    },
  },
  {
    name: 'Vitest', category: FrameworkCategory.Testing,
    detect: async (_files, rootPath) => {
      const pkg = await tryReadJson(join(rootPath, 'package.json'));
      if (pkg?.devDependencies && typeof pkg.devDependencies === 'object' && 'vitest' in pkg.devDependencies) {
        return { name: 'Vitest', category: FrameworkCategory.Testing, version: String(pkg.devDependencies.vitest), detectedFrom: 'package.json', confidence: FrameworkConfidence.Certain };
      }
      return null;
    },
  },
  {
    name: 'Pytest', category: FrameworkCategory.Testing,
    detect: async (_files, rootPath) => {
      const req = await tryReadFile(join(rootPath, 'requirements.txt'));
      if (req?.includes('pytest')) return { name: 'Pytest', category: FrameworkCategory.Testing, detectedFrom: 'requirements.txt', confidence: FrameworkConfidence.Certain };
      const toml = await tryReadFile(join(rootPath, 'pyproject.toml'));
      if (toml?.includes('[tool.pytest')) return { name: 'Pytest', category: FrameworkCategory.Testing, detectedFrom: 'pyproject.toml', confidence: FrameworkConfidence.Certain };
      return null;
    },
  },
  {
    name: 'Prisma', category: FrameworkCategory.Database,
    detect: async (_files, rootPath) => {
      const pkg = await tryReadJson(join(rootPath, 'package.json'));
      if (pkg?.devDependencies && typeof pkg.devDependencies === 'object' && 'prisma' in pkg.devDependencies) {
        return { name: 'Prisma', category: FrameworkCategory.Database, version: String(pkg.devDependencies.prisma), detectedFrom: 'package.json', confidence: FrameworkConfidence.Certain };
      }
      return null;
    },
  },
];

export async function detectFrameworks(files: ScannedFile[], rootPath: string): Promise<FrameworkInfo[]> {
  const results: FrameworkInfo[] = [];
  for (const rule of RULES) {
    try {
      const result = await rule.detect(files, rootPath);
      if (result) results.push(result);
    } catch { /* skip */ }
  }
  return results;
}
