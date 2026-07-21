import type { KnowledgeGraph } from '@ghost-docs/types';

export function generateMermaidDiagram(kg: KnowledgeGraph): string {
  const lines: string[] = [];
  lines.push('graph TD');
  lines.push(`  subgraph Project["${getProjectLabel(kg)}"]`);

  let nodeId = 0;
  const nodeMap = new Map<string, string>();

  function addNode(label: string, style?: string): string {
    const id = `N${nodeId++}`;
    const escaped = label.replace(/"/g, '').substring(0, 60);
    lines.push(`  ${id}["${escaped}"]`);
    if (style) {
      lines.push(`  style ${id} ${style}`);
    }
    nodeMap.set(label, id);
    return id;
  }

  function addEdge(from: string, to: string, label?: string): void {
    const fromId = nodeMap.get(from);
    const toId = nodeMap.get(to);
    if (fromId && toId) {
      lines.push(`  ${fromId} -->${label ? `|${label}|` : ''} ${toId}`);
    }
  }

  const mainEntry = kg.entry_points.find(e => e.type === 'main' || e.type === 'server' || e.type === 'cli');

  if (mainEntry) {
    addNode(`Entry: ${mainEntry.path}`, 'fill:#6366f1,color:#fff');
  }

  const appModules = kg.modules.filter(m => m.type === 'application' || m.type === 'service');
  for (const mod of appModules) {
    addNode(`${mod.name}: ${mod.responsibilities[0] || mod.type}`, 'fill:#22c55e,color:#fff');
    if (mainEntry) addEdge(`Entry: ${mainEntry.path}`, `${mod.name}: ${mod.responsibilities[0] || mod.type}`);
  }

  if (kg.database !== 'Not detected') {
    addNode('Database Layer', 'fill:#3b82f6,color:#fff');
    for (const mod of appModules) {
      addEdge(`${mod.name}: ${mod.responsibilities[0] || mod.type}`, 'Database Layer');
    }
  }

  if (kg.authentication !== 'Not detected') {
    addNode('Auth Layer', 'fill:#f59e0b,color:#fff');
    for (const mod of appModules) {
      addEdge(`${mod.name}: ${mod.responsibilities[0] || mod.type}`, 'Auth Layer', 'authenticates');
    }
  }

  for (const api of kg.apis) {
    const label = `${api.type.toUpperCase()}${api.framework ? ` (${api.framework})` : ''}`;
    addNode(`API: ${label}`, 'fill:#ec4899,color:#fff');
    for (const mod of appModules) {
      addEdge(`${mod.name}: ${mod.responsibilities[0] || mod.type}`, `API: ${label}`, 'exposes');
    }
  }

  if (kg.commands.length > 0) {
    addNode('Build & Deploy', 'fill:#8b5cf6,color:#fff');
    for (const mod of appModules) {
      addEdge(`Build & Deploy`, `${mod.name}: ${mod.responsibilities[0] || mod.type}`, 'builds');
    }
  }

  lines.push('  end');

  return lines.join('\n');
}

function getProjectLabel(kg: KnowledgeGraph): string {
  const lang = kg.entry_points.length > 0
    ? (kg.entry_points[0].path.split('.').pop() || 'Project')
    : 'Project';
  return `${lang.toUpperCase()} Project Architecture`;
}
