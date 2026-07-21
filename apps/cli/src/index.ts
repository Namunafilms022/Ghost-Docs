#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { explain } from './commands/explain.js';
import { ask } from './commands/ask.js';
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
  .argument('<repo-url>', 'GitHub repository URL')
  .description('Explain a repository in 30 seconds')
  .action(explain);

program
  .command('ask')
  .argument('<repo-url>', 'GitHub repository URL')
  .argument('<question>', 'Question about the repository')
  .description('Ask a question about a repository')
  .action(ask);

program
  .command('pr')
  .argument('<repo-url>', 'GitHub repository URL')
  .description('Auto-generate a PR for stale documentation')
  .action(pr);

program.parse();
