export interface ParsedFile {
  path: string;
  language: string;
  imports: ImportStatement[];
  exports: ExportStatement[];
  functions: FunctionDeclaration[];
  classes: ClassDeclaration[];
  interfaces: InterfaceDeclaration[];
  types: TypeAlias[];
  comments: Comment[];
}

export interface ImportStatement {
  source: string;
  specifiers: string[];
  type: 'named' | 'default' | 'namespace' | 'side-effect';
}

export interface ExportStatement {
  name: string;
  type: 'named' | 'default' | 're-export';
  source?: string;
}

export interface FunctionDeclaration {
  name: string;
  async: boolean;
  exported: boolean;
  params: string[];
  returnType?: string;
  startLine: number;
  endLine: number;
}

export interface ClassDeclaration {
  name: string;
  exported: boolean;
  extends?: string;
  implements: string[];
  methods: string[];
  startLine: number;
  endLine: number;
}

export interface InterfaceDeclaration {
  name: string;
  exported: boolean;
  extends: string[];
  properties: string[];
  startLine: number;
  endLine: number;
}

export interface TypeAlias {
  name: string;
  exported: boolean;
  type: string;
  startLine: number;
  endLine: number;
}

export interface Comment {
  text: string;
  type: 'line' | 'block';
  startLine: number;
}

export interface ParseResult {
  files: ParsedFile[];
  summary: ParseSummary;
}

export interface ParseSummary {
  totalFiles: number;
  totalFunctions: number;
  totalClasses: number;
  totalInterfaces: number;
  totalImports: number;
  languages: string[];
}
