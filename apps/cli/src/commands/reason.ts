import { extractKnowledge } from '@ghost-docs/intelligence-engine';
import { RepositoryReasoner } from '@ghost-docs/reasoning-engine';
import chalk from 'chalk';

let reasoner: RepositoryReasoner | null = null;
let knowledge: Awaited<ReturnType<typeof extractKnowledge>> | null = null;
let sessionId: string | null = null;

export async function reason(repoUrl: string, question: string): Promise<void> {
  try {
    if (!reasoner) {
      process.stdout.write(chalk.cyan('🧠 Loading knowledge graph...\n'));
      reasoner = new RepositoryReasoner();
      knowledge = await extractKnowledge({ repoUrl });
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
    process.exit(1);
  }
}
