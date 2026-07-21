import { extractKnowledge } from '@ghost-docs/intelligence-engine';
import { RepositoryReasoner } from '@ghost-docs/reasoning-engine';
import chalk from 'chalk';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

let reasoner: RepositoryReasoner | null = null;
let knowledge: Awaited<ReturnType<typeof extractKnowledge>> | null = null;
let sessionId: string | null = null;

async function getCachedKnowledge(repoUrl: string): Promise<Awaited<ReturnType<typeof extractKnowledge>>> {
  const hash = createHash('sha256').update(repoUrl).digest('hex').slice(0, 16);
  const cacheDir = join(tmpdir(), 'ghost-docs-cache');
  const cacheFile = join(cacheDir, `${hash}.json`);

  try {
    const cached = await readFile(cacheFile, 'utf-8');
    process.stdout.write(chalk.dim('  (using cached knowledge graph)\n'));
    return JSON.parse(cached);
  } catch {
    const kg = await extractKnowledge({ repoUrl });
    try {
      await mkdir(cacheDir, { recursive: true });
      await writeFile(cacheFile, JSON.stringify(kg));
    } catch {}
    return kg;
  }
}

export async function reason(repoUrl: string, question: string): Promise<void> {
  try {
    if (!reasoner) {
      process.stdout.write(chalk.cyan('🧠 Loading knowledge graph...\n'));
      reasoner = new RepositoryReasoner();
      knowledge = await getCachedKnowledge(repoUrl);
      sessionId = reasoner.createSession();
    }

    process.stdout.write(chalk.cyan('🤔 Reasoning...\n'));
    const answer = reasoner.ask(knowledge!, question, sessionId!);

    process.stdout.write(chalk.green('✅ Done!\n'));

    if (answer.context) {
      process.stdout.write(`\n`);
      if (answer.context.isFollowUp) {
        process.stdout.write(chalk.yellow('📎 Follow-up detected\n'));
      }
      process.stdout.write(chalk.bold(`Topic: ${answer.context.currentTopicLabel}`));
      process.stdout.write(` | Confidence: ${chalk.yellow((answer.confidence * 100).toFixed(0) + '%')}\n\n`);
    } else {
      const catLabel = answer.category.charAt(0).toUpperCase() + answer.category.slice(1).replace('-', ' ');
      process.stdout.write(`\n${chalk.bold(catLabel)}`);
      process.stdout.write(` | Confidence: ${chalk.yellow((answer.confidence * 100).toFixed(0) + '%')}\n\n`);
    }

    process.stdout.write(`${answer.answer}\n\n`);

    if (answer.supportingFiles.length > 0) {
      process.stdout.write(chalk.dim('Supporting files:\n'));
      for (const f of answer.supportingFiles) {
        process.stdout.write(chalk.dim(`  - ${f}\n`));
      }
      process.stdout.write('\n');
    }

    if (answer.supportingModules.length > 0) {
      process.stdout.write(chalk.dim('Supporting modules:\n'));
      for (const m of answer.supportingModules) {
        process.stdout.write(chalk.dim(`  - ${m}\n`));
      }
      process.stdout.write('\n');
    }

    process.stdout.write(chalk.italic('Why I answered this:\n'));
    for (const line of answer.transparency) {
      process.stdout.write(`  ${line}\n`);
    }
    process.stdout.write('\n');
  } catch (error) {
    process.stderr.write(chalk.red(`\n✗ Error: ${error}\n`));
    process.exit(2);
  }
}
