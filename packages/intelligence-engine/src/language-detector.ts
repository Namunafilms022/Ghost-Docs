import type { ScannedFile, LanguageInfo } from '@ghost-docs/types';

interface LanguageDef {
  name: string;
  extensions: string[];
}

const LANGUAGE_MAP: LanguageDef[] = [
  { name: 'TypeScript', extensions: ['.ts', '.tsx', '.mts', '.cts'] },
  { name: 'JavaScript', extensions: ['.js', '.jsx', '.mjs', '.cjs'] },
  { name: 'Python', extensions: ['.py', '.pyw', '.pyx', '.ipynb'] },
  { name: 'Rust', extensions: ['.rs', '.rlib'] },
  { name: 'Go', extensions: ['.go'] },
  { name: 'Java', extensions: ['.java', '.class'] },
  { name: 'Kotlin', extensions: ['.kt', '.kts'] },
  { name: 'Ruby', extensions: ['.rb', '.erb'] },
  { name: 'PHP', extensions: ['.php', '.phtml'] },
  { name: 'C', extensions: ['.c', '.h'] },
  { name: 'C++', extensions: ['.cpp', '.hpp', '.cc', '.cxx', '.hxx'] },
  { name: 'C#', extensions: ['.cs'] },
  { name: 'Swift', extensions: ['.swift'] },
  { name: 'Scala', extensions: ['.scala', '.sc'] },
  { name: 'R', extensions: ['.r', '.r', '.rmd'] },
  { name: 'Dart', extensions: ['.dart'] },
  { name: 'Lua', extensions: ['.lua'] },
  { name: 'Perl', extensions: ['.pl', '.pm'] },
  { name: 'Haskell', extensions: ['.hs', '.lhs'] },
  { name: 'Elixir', extensions: ['.ex', '.exs'] },
  { name: 'Clojure', extensions: ['.clj', '.cljs', '.edn'] },
  { name: 'Shell', extensions: ['.sh', '.bash', '.zsh'] },
  { name: 'PowerShell', extensions: ['.ps1', '.psm1'] },
  { name: 'SQL', extensions: ['.sql'] },
  { name: 'HTML', extensions: ['.html', '.htm'] },
  { name: 'CSS', extensions: ['.css', '.scss', '.sass', '.less'] },
  { name: 'YAML', extensions: ['.yml', '.yaml'] },
  { name: 'TOML', extensions: ['.toml'] },
  { name: 'Dockerfile', extensions: ['dockerfile'] },
  { name: 'Makefile', extensions: ['makefile', '.mk'] },
  { name: 'Solidity', extensions: ['.sol'] },
  { name: 'Zig', extensions: ['.zig'] },
  { name: 'Nim', extensions: ['.nim'] },
  { name: 'Markdown', extensions: ['.md', '.mdx', '.markdown'] },
];

export function detectLanguages(files: ScannedFile[]): LanguageInfo[] {
  const extCounts = new Map<string, { count: number; lang: string }>();

  for (const file of files) {
    const ext = file.extension;
    if (!ext) {
      if (file.name.toLowerCase() === 'dockerfile') {
        const key = 'dockerfile';
        const existing = extCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          extCounts.set(key, { count: 1, lang: 'Dockerfile' });
        }
      }
      continue;
    }

    const langDef = LANGUAGE_MAP.find((l) => l.extensions.includes(ext));
    if (langDef) {
      const existing = extCounts.get(langDef.name);
      if (existing) {
        existing.count++;
      } else {
        extCounts.set(langDef.name, { count: 1, lang: langDef.name });
      }
    }
  }

  const total = Array.from(extCounts.values()).reduce((sum, v) => sum + v.count, 0);
  if (total === 0) {
    const noExtFiles = files.filter((f) => !f.extension && f.name.includes('.'));
    if (noExtFiles.length > 0) {
      const byName: Record<string, number> = {};
      for (const f of noExtFiles) {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        if (ext && ext.length <= 4) {
          byName[ext] = (byName[ext] || 0) + 1;
        }
      }
      for (const [ext, count] of Object.entries(byName)) {
        extCounts.set(ext, { count, lang: ext });
      }
    }
  }
  if (extCounts.size === 0) return [];

  return Array.from(extCounts.entries())
    .map(([name, info]) => ({
      name: info.lang,
      percentage: Math.round((info.count / total) * 1000) / 10,
      fileCount: info.count,
      extensions: LANGUAGE_MAP.find((l) => l.name === info.lang)?.extensions ?? [],
    }))
    .sort((a, b) => b.fileCount - a.fileCount);
}
