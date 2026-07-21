import type { ParsedFile, ImportStatement, FunctionDeclaration, ClassDeclaration, Comment } from './types.js';

const IMPORT_RE = /^(?:from\s+(\S+)\s+)?import\s+(.+)$/gm;
const FUNCTION_RE = /^(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*(\S+))?/gm;
const CLASS_RE = /^class\s+(\w+)(?:\(([^)]*)\))?:/gm;
const COMMENT_RE = /^\s*#\s*(.*)$/gm;
const DOCSTRING_RE = /"""([\s\S]*?)"""/g;

export function parsePython(content: string, filePath: string): ParsedFile {
  const imports: ImportStatement[] = [];
  const functions: FunctionDeclaration[] = [];
  const classes: ClassDeclaration[] = [];
  const comments: Comment[] = [];

  const lines = content.split('\n');

  let match: RegExpExecArray | null;

  IMPORT_RE.lastIndex = 0;
  while ((match = IMPORT_RE.exec(content)) !== null) {
    const source = match[1] || match[2].split(/\s+as\s+/)[0].trim();
    const specifiers = match[1]
      ? match[2].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]).filter(Boolean)
      : match[2].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
    imports.push({
      source,
      specifiers,
      type: match[1] ? 'named' : 'namespace',
    });
  }

  FUNCTION_RE.lastIndex = 0;
  while ((match = FUNCTION_RE.exec(content)) !== null) {
    const lineNum = getLineNumber(content, match.index);
    functions.push({
      name: match[1],
      async: match[0].includes('async'),
      exported: false,
      params: match[2].split(',').map((p) => p.trim()).filter(Boolean),
      returnType: match[3] || undefined,
      startLine: lineNum,
      endLine: lineNum,
    });
  }

  CLASS_RE.lastIndex = 0;
  while ((match = CLASS_RE.exec(content)) !== null) {
    const lineNum = getLineNumber(content, match.index);
    classes.push({
      name: match[1],
      exported: false,
      extends: match[2] || undefined,
      implements: [],
      methods: [],
      startLine: lineNum,
      endLine: lineNum,
    });
  }

  COMMENT_RE.lastIndex = 0;
  while ((match = COMMENT_RE.exec(content)) !== null) {
    comments.push({
      text: match[1].trim(),
      type: 'line',
      startLine: getLineNumber(content, match.index),
    });
  }

  DOCSTRING_RE.lastIndex = 0;
  while ((match = DOCSTRING_RE.exec(content)) !== null) {
    comments.push({
      text: match[1].trim().split('\n').map((s) => s.trim()).join(' '),
      type: 'block',
      startLine: getLineNumber(content, match.index),
    });
  }

  return {
    path: filePath,
    language: 'python',
    imports,
    exports: [],
    functions,
    classes,
    interfaces: [],
    types: [],
    comments,
  };
}

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}
