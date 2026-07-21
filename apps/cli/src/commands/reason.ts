import chalk from 'chalk';
import { extractKnowledge } from '@ghost-docs/intelligence-engine';

export async function reason(repoUrl: string, question: string): Promise<void> {
  console.log(chalk.yellow(`⏳ Reasoning about ${repoUrl}...`));
  console.log(chalk.yellow(`❓ ${question}`));

  try {
    const knowledge = await extractKnowledge({ repoUrl });
    console.log(chalk.green(`✓ Loaded knowledge graph for ${knowledge.languages.join(', ')} project`));
    console.log(chalk.cyan(`  ${knowledge.modules.length} modules, ${knowledge.dependencies.total} dependencies`));
    console.log(chalk.red('\nQuestion answering not implemented yet — coming in Phase 5'));
  } catch (error) {
    console.error(chalk.red(`\n✗ Error: ${error}`));
    process.exit(1);
  }
}
