import type { ParsedFile, ImportStatement, ExportStatement, FunctionDeclaration, ClassDeclaration, InterfaceDeclaration, TypeAlias, Comment } from './types.js';

const IMPORT_RE = /^import\s+(?:(?:(?:\{([^}]*)\})|(\w+))\s+from\s+)?['"]([^'"]+)['"]\s*;?|^import\s+['"]([^'"]+)['"]\s*;?/gm;
const EXPORT_NAMED_RE = /^export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/gm;
const EXPORT_DEFAULT_RE = /^export\s+default\s+(?:function|class)\s+(\w+)?/gm;
const EXPORT_REEXPORT_RE = /^export\s+(?:\{[^}]*\}|(?:\*\s+from))\s+from\s+['"]([^'"]+)['"]\s*;?/gm;
const FUNCTION_RE = /^(?:export\s+)?(?:async\s+)?function\s+(?:\*\s+)?(\w+)\s*\(([^)]*)\)/gm;
const ARROW_FN_RE = /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*(?::\s*\w+)?\s*=>/gm;
const CLASS_RE = /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?/gm;
const INTERFACE_RE = /^(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+([^{]+))?/gm;
const TYPE_RE = /^(?:export\s+)?type\s+(\w+)\s*=\s*([^;]+);?/gm;
const LINE_COMMENT_RE = /\/\/\s*(.*)$/gm;
const BLOCK_COMMENT_RE = /\/\*([\s\S]*?)\*\//g;
const EXPORTED_ARROW_RE = /^export\s+(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)/gm;

export function parseTypeScript(content: string, filePath: string): ParsedFile {
  const imports: ImportStatement[] = [];
  const exports: ExportStatement[] = [];
  const functions: FunctionDeclaration[] = [];
  const classes: ClassDeclaration[] = [];
  const interfaces: InterfaceDeclaration[] = [];
  const types: TypeAlias[] = [];
  const comments: Comment[] = [];

  const lines = content.split('\n');

  let match: RegExpExecArray | null;

  IMPORT_RE.lastIndex = 0;
  while ((match = IMPORT_RE.exec(content)) !== null) {
    const lineNum = getLineNumber(content, match.index);
    const specifiers: string[] = [];
    if (match[1]) {
      specifiers.push(...match[1].split(',').map((s) => s.trim()).filter(Boolean));
    } else if (match[2]) {
      specifiers.push(match[2].trim());
    }
    const source = match[3] || match[4];
    const type: ImportStatement['type'] = match[2] ? 'default' : match[1] ? 'named' : 'side-effect';
    imports.push({ source, specifiers, type });
  }

  EXPORT_NAMED_RE.lastIndex = 0;
  while ((match = EXPORT_NAMED_RE.exec(content)) !== null) {
    exports.push({ name: match[1], type: 'named' });
  }

  EXPORT_DEFAULT_RE.lastIndex = 0;
  while ((match = EXPORT_DEFAULT_RE.exec(content)) !== null) {
    exports.push({ name: match[1] || 'default', type: 'default' });
  }

  EXPORT_REEXPORT_RE.lastIndex = 0;
  while ((match = EXPORT_REEXPORT_RE.exec(content)) !== null) {
    exports.push({ name: match[1], type: 're-export', source: match[1] });
  }

  FUNCTION_RE.lastIndex = 0;
  while ((match = FUNCTION_RE.exec(content)) !== null) {
    const lineNum = getLineNumber(content, match.index);
    const params = match[2].split(',').map((p) => p.trim()).filter(Boolean);
    functions.push({
      name: match[1],
      async: content.slice(match.index, match.index + match[0].length).includes('async'),
      exported: content.slice(0, match.index).includes('export'),
      params,
      startLine: lineNum,
      endLine: lineNum,
    });
  }

  ARROW_FN_RE.lastIndex = 0;
  while ((match = ARROW_FN_RE.exec(content)) !== null) {
    const lineNum = getLineNumber(content, match.index);
    functions.push({
      name: match[1],
      async: content.slice(match.index, match.index + match[0].length).includes('async'),
      exported: false,
      params: match[2].split(',').map((p) => p.trim()).filter(Boolean),
      startLine: lineNum,
      endLine: lineNum,
    });
  }

  EXPORTED_ARROW_RE.lastIndex = 0;
  while ((match = EXPORTED_ARROW_RE.exec(content)) !== null) {
    const lineNum = getLineNumber(content, match.index);
    functions.push({
      name: match[1],
      async: content.slice(match.index, match.index + match[0].length).includes('async'),
      exported: true,
      params: match[2].split(',').map((p) => p.trim()).filter(Boolean),
      startLine: lineNum,
      endLine: lineNum,
    });
  }

  CLASS_RE.lastIndex = 0;
  while ((match = CLASS_RE.exec(content)) !== null) {
    const lineNum = getLineNumber(content, match.index);
    classes.push({
      name: match[1],
      exported: content.match(/^export\s+/) !== null,
      extends: match[2] || undefined,
      implements: match[3] ? match[3].split(',').map((s) => s.trim()) : [],
      methods: [],
      startLine: lineNum,
      endLine: lineNum,
    });
  }

  INTERFACE_RE.lastIndex = 0;
  while ((match = INTERFACE_RE.exec(content)) !== null) {
    const lineNum = getLineNumber(content, match.index);
    interfaces.push({
      name: match[1],
      exported: content.match(/^export\s+/) !== null,
      extends: match[2] ? match[2].split(',').map((s) => s.trim()) : [],
      properties: [],
      startLine: lineNum,
      endLine: lineNum,
    });
  }

  TYPE_RE.lastIndex = 0;
  while ((match = TYPE_RE.exec(content)) !== null) {
    const lineNum = getLineNumber(content, match.index);
    types.push({
      name: match[1],
      exported: content.match(/^export\s+/) !== null,
      type: match[2].trim(),
      startLine: lineNum,
      endLine: lineNum,
    });
  }

  LINE_COMMENT_RE.lastIndex = 0;
  while ((match = LINE_COMMENT_RE.exec(content)) !== null) {
    comments.push({
      text: match[1].trim(),
      type: 'line',
      startLine: getLineNumber(content, match.index),
    });
  }

  BLOCK_COMMENT_RE.lastIndex = 0;
  while ((match = BLOCK_COMMENT_RE.exec(content)) !== null) {
    comments.push({
      text: match[1].trim(),
      type: 'block',
      startLine: getLineNumber(content, match.index),
    });
  }

  return {
    path: filePath,
    language: filePath.endsWith('.tsx') || filePath.endsWith('.ts') ? 'typescript' : 'javascript',
    imports,
    exports,
    functions,
    classes,
    interfaces,
    types,
    comments,
  };
}

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}
