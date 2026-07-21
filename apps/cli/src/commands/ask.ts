import chalk from 'chalk';

export async function ask(repoUrl: string, question: string): Promise<void> {
  console.log(chalk.yellow(`⏳ Asking about ${repoUrl}...`));
  console.log(chalk.yellow(`❓ ${question}`));
  console.log(chalk.red('Not implemented yet — coming in Phase 5'));
}
