import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ScannedFile, DependencyGraph, DependencyNode, DependencyEdge } from '@ghost-docs/types';
import { DependencyType } from '@ghost-docs/types';

async function tryReadJson(filePath: string): Promise<Record<string, unknown> | null> {
  try { return JSON.parse(await readFile(filePath, 'utf-8')); } catch { return null; }
}

async function tryReadFile(filePath: string): Promise<string | null> {
  try { return await readFile(filePath, 'utf-8'); } catch { return null; }
}

function fromPackageJson(pkg: Record<string, unknown>): { nodes: DependencyNode[]; edges: DependencyEdge[] } {
  const nodes: DependencyNode[] = [];
  const edges: DependencyEdge[] = [];
  const pkgName = (pkg.name as string) ?? 'root';
  const sections: [string, DependencyType][] = [
    ['dependencies', DependencyType.Production],
    ['devDependencies', DependencyType.Development],
    ['peerDependencies', DependencyType.Peer],
    ['optionalDependencies', DependencyType.Optional],
  ];
  for (const [key, depType] of sections) {
    const deps = pkg[key] as Record<string, string> | undefined;
    if (deps) {
      for (const [name, version] of Object.entries(deps)) {
        nodes.push({ name, version, type: depType });
        edges.push({ source: pkgName, target: name, type: depType });
      }
    }
  }
  return { nodes, edges };
}

function fromRequirementsTxt(content: string): { nodes: DependencyNode[]; edges: DependencyEdge[] } {
  const nodes: DependencyNode[] = [];
  const edges: DependencyEdge[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-r')) continue;
    const match = trimmed.match(/^([\w.-]+)([><=!~]+.+)?$/);
    if (match) {
      nodes.push({ name: match[1], version: match[2]?.trim(), type: DependencyType.Production });
      edges.push({ source: 'root', target: match[1], type: DependencyType.Production });
    }
  }
  return { nodes, edges };
}

function fromCargoToml(content: string): { nodes: DependencyNode[]; edges: DependencyEdge[] } {
  const nodes: DependencyNode[] = [];
  const edges: DependencyEdge[] = [];
  const parseSection = (section: string, type: DependencyType) => {
    const match = content.match(new RegExp(`\\[${section}\\]([\\s\\S]*?)(?=\\[|$)`));
    if (match) {
      for (const line of match[1].split('\n')) {
        const m = line.trim().match(/^(\w+)\s*=\s*["{]([^"}]+)/);
        if (m) { nodes.push({ name: m[1], version: m[2].trim(), type }); edges.push({ source: 'root', target: m[1], type }); }
      }
    }
  };
  parseSection('dependencies', DependencyType.Production);
  parseSection('dev-dependencies', DependencyType.Development);
  return { nodes, edges };
}

function fromGoMod(content: string): { nodes: DependencyNode[]; edges: DependencyEdge[] } {
  const nodes: DependencyNode[] = [];
  const edges: DependencyEdge[] = [];
  for (const line of content.split('\n')) {
    const match = line.trim().match(/^require\s+(\S+)\s+(\S+)/);
    if (match) { nodes.push({ name: match[1], version: match[2], type: DependencyType.Production }); edges.push({ source: 'root', target: match[1], type: DependencyType.Production }); }
  }
  return { nodes, edges };
}

export async function buildDependencyGraph(files: ScannedFile[], rootPath: string): Promise<DependencyGraph> {
  const allNodes: DependencyNode[] = [];
  const allEdges: DependencyEdge[] = [];
  const addedNodes = new Set<string>();
  const names = new Set(files.map((f) => f.name));

  if (names.has('package.json')) {
    const pkg = await tryReadJson(join(rootPath, 'package.json'));
    if (pkg) {
      const { nodes, edges } = fromPackageJson(pkg);
      allNodes.push(...nodes); allEdges.push(...edges);
      nodes.forEach((n) => addedNodes.add(n.name));
    }
  }

  for (const [fileName, parser] of [
    ['requirements.txt', fromRequirementsTxt],
    ['Cargo.toml', fromCargoToml],
    ['go.mod', fromGoMod],
  ] as const) {
    if (names.has(fileName)) {
      const content = await tryReadFile(join(rootPath, fileName));
      if (content) {
        const { nodes, edges } = parser(content);
        for (const node of nodes) {
          if (!addedNodes.has(node.name)) { allNodes.push(node); addedNodes.add(node.name); }
        }
        allEdges.push(...edges);
      }
    }
  }

  return { nodes: allNodes, edges: allEdges };
}
