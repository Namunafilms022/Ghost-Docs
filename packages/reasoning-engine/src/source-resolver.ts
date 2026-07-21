import type { KnowledgeGraph, QuestionCategory } from '@ghost-docs/types';

export interface ResolvedSources {
  files: string[];
  modules: string[];
  path: string[];
}

export class SourceResolver {
  resolve(kg: KnowledgeGraph, category: QuestionCategory): ResolvedSources {
    const files = new Set<string>();
    const modules = new Set<string>();
    const path: string[] = [];

    switch (category) {
      case 'project-purpose':
        for (const f of kg.important_files) files.add(f.path);
        for (const m of kg.modules) modules.add(m.name);
        path.push('Project summary from KnowledgeGraph');
        break;

      case 'authentication':
        if (kg.authentication !== 'Not detected') {
          path.push(`Authentication detected: ${kg.authentication}`);
        }
        for (const m of kg.modules) {
          if (m.responsibilities.some(r => /auth/i.test(r))) {
            modules.add(m.name);
            for (const f of m.keyFiles) files.add(f);
          }
        }
        break;

      case 'startup-flow':
        for (const ep of kg.entry_points) files.add(ep.path);
        path.push('Entry points define startup flow');
        break;

      case 'entry-points':
        for (const ep of kg.entry_points) files.add(ep.path);
        for (const ep of kg.entry_points) {
          const dir = ep.path.split('/')[0];
          if (dir) modules.add(dir);
        }
        path.push('Entry points from scan');
        break;

      case 'api-locations':
        for (const api of kg.apis) {
          path.push(`API: ${api.type}${api.framework ? ` (${api.framework})` : ''}`);
        }
        for (const m of kg.modules) {
          if (m.type === 'service' || m.responsibilities.some(r => /api/i.test(r))) {
            modules.add(m.name);
            for (const f of m.keyFiles) files.add(f);
          }
        }
        break;

      case 'database-layer':
        if (kg.database !== 'Not detected') {
          path.push(`Database: ${kg.database}`);
        }
        for (const m of kg.modules) {
          if (m.responsibilities.some(r => /database|db|model|migration/i.test(r))) {
            modules.add(m.name);
            for (const f of m.keyFiles) files.add(f);
          }
        }
        for (const f of kg.important_files) {
          if (/prisma|schema|migration|orm|database/i.test(f.path)) files.add(f.path);
        }
        break;

      case 'testing':
        for (const m of kg.modules) {
          if (m.type === 'test') {
            modules.add(m.name);
            for (const f of m.keyFiles) files.add(f);
          }
        }
        for (const cmd of kg.commands) {
          if (cmd.name === 'test') path.push(`Test command: ${cmd.command}`);
        }
        break;

      case 'build-commands':
        for (const cmd of kg.commands) {
          path.push(`Command: ${cmd.command} — ${cmd.description}`);
        }
        break;

      case 'folder-responsibilities':
        for (const m of kg.modules) {
          if (m.name !== 'root') {
            modules.add(m.name);
            for (const f of m.keyFiles.slice(0, 3)) files.add(f);
          }
        }
        path.push('Module structure from folder tree');
        break;

      case 'dependencies':
        for (const ep of kg.entry_points) files.add(ep.path);
        path.push(`Total: ${kg.dependencies.total} (${kg.dependencies.production} prod, ${kg.dependencies.development} dev)`);
        break;

      case 'architecture':
        for (const m of kg.modules) modules.add(m.name);
        for (const ep of kg.entry_points) files.add(ep.path);
        path.push('Architecture derived from all KnowledgeGraph sections');
        break;

      default:
        break;
    }

    return {
      files: [...files],
      modules: [...modules],
      path: path.length > 0 ? path : ['No specific sources found'],
    };
  }
}
