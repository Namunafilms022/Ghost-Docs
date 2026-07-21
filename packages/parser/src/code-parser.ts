import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import type { ParseResult, ParsedFile, ParseSummary } from './types.js';
import { parseTypeScript } from './typescript-parser.js';
import { parsePython } from './python-parser.js';
import { genericParse } from './generic-parser.js';

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.rb': 'ruby',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.kt': 'kotlin',
  '.swift': 'swift',
  '.php': 'php',
};

function detectLanguage(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return LANGUAGE_MAP[ext] || 'unknown';
}

function parseFileContent(content: string, filePath: string, language: string): ParsedFile {
  switch (language) {
    case 'typescript':
    case 'javascript':
      return parseTypeScript(content, filePath);
    case 'python':
      return parsePython(content, filePath);
    default:
      return genericParse(content, filePath, language);
  }
}

export async function parseFiles(filePaths: string[]): Promise<ParseResult> {
  const files: ParsedFile[] = [];

  for (const filePath of filePaths) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const language = detectLanguage(filePath);
      const parsed = parseFileContent(content, filePath, language);
      files.push(parsed);
    } catch {
      // Skip unreadable files
    }
  }

  return {
    files,
    summary: buildSummary(files),
  };
}

export function parseContent(content: string, filePath: string): ParsedFile {
  const language = detectLanguage(filePath);
  return parseFileContent(content, filePath, language);
}

function buildSummary(files: ParsedFile[]): ParseSummary {
  const langSet = new Set<string>();
  let totalFunctions = 0;
  let totalClasses = 0;
  let totalInterfaces = 0;
  let totalImports = 0;

  for (const file of files) {
    langSet.add(file.language);
    totalFunctions += file.functions.length;
    totalClasses += file.classes.length;
    totalInterfaces += file.interfaces.length;
    totalImports += file.imports.length;
  }

  return {
    totalFiles: files.length,
    totalFunctions,
    totalClasses,
    totalInterfaces,
    totalImports,
    languages: [...langSet].sort(),
  };
}
