#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { explain } from './commands/explain.js';
import { reason } from './commands/reason.js';
import { pr } from './commands/pr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let pkg: { version: string };
try {
  pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));
} catch {
  pkg = { version: '0.1.0-dev' };
}

const program = new Command();

program
  .name('ghost-docs')
  .description('Ghost Docs - AI Technical Writer that understands your codebase')
  .version(pkg.version, '-v, --version', 'Show version and exit');

program
  .command('explain')
  .argument('<repo-url>', 'GitHub repository URL or local path')
  .option('--json', 'Output raw knowledge graph JSON')
  .option('--markdown', 'Output formatted markdown report (default)')
  .description('Explain a repository')
  .action(explain);

program
  .command('reason')
  .argument('<repo-url>', 'GitHub repository URL or local path')
  .argument('<question>', 'Question about the repository')
  .description('Reason about a repository (Repository Reasoning Engine)')
  .action(reason);

program
  .command('pr')
  .argument('<repo-url>', 'GitHub repository URL or local path')
  .option('--dry-run', 'Preview changes without creating PR (default)')
  .description('Synchronize documentation with source code')
  .action(pr);

program.parse();
