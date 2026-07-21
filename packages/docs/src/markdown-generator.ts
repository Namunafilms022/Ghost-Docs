import type { KnowledgeGraph, KnowledgeModule, APIEndpoint, CLICommand, EntryPointInfo } from '@ghost-docs/types';
import { generateMermaidDiagram } from './mermaid-generator.js';

export function generateExplainReport(kg: KnowledgeGraph): string {
  const sections: string[] = [];

  sections.push('# Project Overview');
  sections.push('');
  sections.push(generateProjectSummary(kg));
  sections.push('');
  sections.push(generateTechStack(kg));
  sections.push('');
  sections.push(generateFolderResponsibilities(kg));
  sections.push('');
  sections.push(generateEntryPoints(kg));
  sections.push('');
  sections.push(generateExecutionFlow(kg));
  sections.push('');
  sections.push(generateDatabaseLayer(kg));
  sections.push('');
  sections.push(generateAuthentication(kg));
  sections.push('');
  sections.push(generateAPILayer(kg));
  sections.push('');
  sections.push(generateTesting(kg));
  sections.push('');
  sections.push(generateBuildCommands(kg));
  sections.push('');
  sections.push('## 📊 Architecture');
  sections.push('');
  sections.push('```mermaid');
  sections.push(generateMermaidDiagram(kg));
  sections.push('```');

  return sections.join('\n');
}

function generateProjectSummary(kg: KnowledgeGraph): string {
  return [
    '## 🚀 Project Summary',
    '',
    kg.project_summary,
  ].join('\n');
}

function generateTechStack(kg: KnowledgeGraph): string {
  const rows: string[] = ['| Category | Technology |', '|----------|------------|'];

  if (kg.languages && kg.languages.length > 0) {
    rows.push(`| Language | ${kg.languages.join(', ')} |`);
  }

  if (kg.dependencies.total > 0) {
    rows.push(`| Dependencies | ${kg.dependencies.total} total (${kg.dependencies.production} production, ${kg.dependencies.development} dev) |`);
  }

  if (kg.database !== 'Not detected') {
    rows.push(`| Database | ${kg.database} |`);
  }

  if (kg.authentication !== 'Not detected') {
    rows.push(`| Authentication | ${kg.authentication} |`);
  }

  for (const api of kg.apis) {
    rows.push(`| API | ${api.type.toUpperCase()}${api.framework ? ` (${api.framework})` : ''} |`);
  }

  if (kg.commands.length > 0) {
    const hasDocker = kg.commands.some(c => c.name === 'docker-build');
    if (hasDocker) rows.push('| Container | Docker |');
  }

  if (kg.important_files.some(f => f.path.includes('.github/workflows'))) {
    rows.push('| CI/CD | GitHub Actions |');
  }

  return '## 📦 Tech Stack\n\n' + rows.join('\n');
}

function generateFolderResponsibilities(kg: KnowledgeGraph): string {
  const parts: string[] = ['## 📂 Folder Responsibilities', ''];

  const modules = kg.modules.filter(m => m.name !== 'root');
  if (modules.length === 0) {
    parts.push('No module structure detected.');
    return parts.join('\n');
  }

  for (const mod of modules) {
    parts.push(`### \`${mod.path}/\``);
    parts.push('');
    parts.push(`**Type:** ${mod.type}`);
    parts.push('');
    for (const resp of mod.responsibilities) {
      parts.push(`- ${resp}`);
    }
    if (mod.keyFiles.length > 0) {
      parts.push('');
      parts.push('Key files:');
      for (const f of mod.keyFiles.slice(0, 5)) {
        parts.push(`- \`${f}\``);
      }
    }
    parts.push('');
  }

  return parts.join('\n');
}

function generateEntryPoints(kg: KnowledgeGraph): string {
  const parts: string[] = ['## 🔥 Entry Points', ''];

  if (kg.entry_points.length === 0) {
    parts.push('No entry points detected.');
    return parts.join('\n');
  }

  parts.push('| Path | Type | Confidence |');
  parts.push('|------|------|------------|');
  for (const ep of kg.entry_points) {
    parts.push(`| \`${ep.path}\` | ${ep.type} | ${ep.confidence} |`);
  }

  parts.push('');
  parts.push('**Execution order:**');
  for (const ep of kg.entry_points) {
    parts.push(`1. **${ep.path}** — ${ep.reason}`);
  }

  return parts.join('\n');
}

function generateExecutionFlow(kg: KnowledgeGraph): string {
  const parts: string[] = ['## 🔄 Execution Flow', ''];

  const mainEntry = kg.entry_points.find(e => e.type === 'main' || e.type === 'server' || e.type === 'cli');
  const apiFrameworks = kg.apis.map(a => a.framework).filter(Boolean);

  if (mainEntry) {
    parts.push(`The application starts at **\`${mainEntry.path}\`**`);
    if (apiFrameworks.length > 0) {
      const fwList = [...new Set(apiFrameworks)].join(', ');
      parts.push(`Initializes the ${fwList} web server`);
    }
    parts.push('Loads application configuration and middleware');
    if (kg.database !== 'Not detected') {
      parts.push('Connects to the database layer');
    }
    if (kg.authentication !== 'Not detected') {
      parts.push('Sets up authentication and authorization');
    }
    parts.push('Registers API routes and handlers');
    parts.push('Starts listening for incoming requests');
  } else {
    const ep = kg.entry_points[0];
    if (ep) {
      parts.push(`The application starts at **\`${ep.path}\`**`);
      parts.push('Initializes core modules and dependencies');
      parts.push('Executes the main application logic');
    } else {
      parts.push('Execution flow could not be determined programmatically.');
    }
  }

  return parts.join('\n');
}

function generateDatabaseLayer(kg: KnowledgeGraph): string {
  const parts: string[] = ['## 🗄 Database Layer', ''];

  if (kg.database === 'Not detected') {
    parts.push('No database layer detected.');
  } else {
    parts.push(`**Detected:** ${kg.database}`);
  }

  return parts.join('\n');
}

function generateAuthentication(kg: KnowledgeGraph): string {
  const parts: string[] = ['## 🔐 Authentication', ''];

  if (kg.authentication === 'Not detected') {
    parts.push('No authentication mechanism detected.');
  } else {
    parts.push(`**Detected:** ${kg.authentication}`);
  }

  return parts.join('\n');
}

function generateAPILayer(kg: KnowledgeGraph): string {
  const parts: string[] = ['## 🌐 API Layer', ''];

  if (kg.apis.length === 0) {
    parts.push('No API endpoints detected.');
    return parts.join('\n');
  }

  parts.push('| Type | Framework | Base Path |');
  parts.push('|------|-----------|-----------|');
  for (const api of kg.apis) {
    parts.push(`| ${api.type.toUpperCase()} | ${api.framework || 'Unknown'} | \`${api.path}\` |`);
  }

  return parts.join('\n');
}

function generateTesting(kg: KnowledgeGraph): string {
  const parts: string[] = ['## 🧪 Testing', ''];

  const testCommand = kg.commands.find(c => c.name === 'test');
  const testModules = kg.modules.filter(m => m.type === 'test');

  if (testCommand) {
    parts.push(`**Command:** \`${testCommand.command}\``);
    parts.push('');
  }

  if (testModules.length > 0) {
    parts.push('Test directories:');
    for (const mod of testModules) {
      parts.push(`- \`${mod.path}/\``);
    }
  } else {
    parts.push('No dedicated test directories detected.');
  }

  return parts.join('\n');
}

function generateBuildCommands(kg: KnowledgeGraph): string {
  const parts: string[] = ['## ⚙ Build & Run Commands', ''];

  if (kg.commands.length === 0) {
    parts.push('No commands detected.');
    return parts.join('\n');
  }

  parts.push('| Command | Description |');
  parts.push('|---------|-------------|');
  for (const cmd of kg.commands) {
    parts.push(`| \`${cmd.command}\` | ${cmd.description} |`);
  }

  return parts.join('\n');
}
