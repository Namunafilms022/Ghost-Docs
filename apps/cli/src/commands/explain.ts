import { extractKnowledge } from '@ghost-docs/intelligence-engine';
import { markdownRenderer, jsonRenderer } from '@ghost-docs/docs';
import chalk from 'chalk';

export async function explain(repoUrl: string, options: { markdown?: boolean; json?: boolean }): Promise<void> {
  try {
    process.stdout.write(chalk.cyan('🔍 Scanning repository...\n'));
    const knowledge = await extractKnowledge({ repoUrl });

    process.stdout.write(chalk.cyan('📊 Building knowledge graph...\n'));
    const renderer = options.json ? jsonRenderer : markdownRenderer;

    process.stdout.write(chalk.cyan('📝 Rendering output...\n'));
    const output = renderer.render(knowledge);

    process.stdout.write(chalk.green('✅ Done!\n\n'));
    process.stdout.write(output);
    process.stdout.write('\n');
  } catch (error) {
    process.stderr.write(chalk.red(`\n✗ Error: ${error}\n`));
    process.exit(1);
  }
}
