import type { ParsedFile, FunctionDeclaration, Comment } from './types.js';

const FUNCTION_RE = /^(?:\w+\s+)?(?:function|def|fn|fun|func)\s+(\w+)\s*\(/gim;
const LINE_COMMENT_RE = /^\s*[#\/]{2}\s*(.*)$/gm;
const BLOCK_COMMENT_RE = /\/\*([\s\S]*?)\*\//g;

export function genericParse(content: string, filePath: string, language: string): ParsedFile {
  const functions: FunctionDeclaration[] = [];
  const comments: Comment[] = [];

  let match: RegExpExecArray | null;

  FUNCTION_RE.lastIndex = 0;
  while ((match = FUNCTION_RE.exec(content)) !== null) {
    const lineNum = getLineNumber(content, match.index);
    functions.push({
      name: match[1],
      async: false,
      exported: false,
      params: [],
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
    language,
    imports: [],
    exports: [],
    functions,
    classes: [],
    interfaces: [],
    types: [],
    comments,
  };
}

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}
