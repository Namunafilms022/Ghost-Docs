import { extractKnowledge } from '@ghost-docs/intelligence-engine';
import { markdownRenderer, jsonRenderer } from '@ghost-docs/docs';
import chalk from 'chalk';

const PHASE_LABELS: Record<string, string> = {
  fetching: '📦 Cloning repository...',
  scanning: '🔍 Scanning files...',
  'building repo info': '📋 Analyzing structure...',
  'detecting features': '🧩 Detecting languages & frameworks...',
  'detecting entry points': '🚪 Detecting entry points...',
  'building dependency graph': '🔗 Building dependency graph...',
  'building folder tree': '🌳 Building folder tree...',
  'building manifest': '📊 Building project manifest...',
};

export async function explain(repoUrl: string, options: { markdown?: boolean; json?: boolean }): Promise<void> {
  try {
    const knowledge = await extractKnowledge({
      repoUrl,
      onProgress: (phase) => {
        const label = PHASE_LABELS[phase] || `🔄 ${phase}...`;
        process.stdout.write(chalk.cyan(label + '\n'));
      },
    });

    process.stdout.write(chalk.cyan('📊 Building knowledge graph...\n'));
    const renderer = options.json ? jsonRenderer : markdownRenderer;

    process.stdout.write(chalk.cyan('📝 Rendering output...\n'));
    const output = renderer.render(knowledge);

    const doneMsg = chalk.green('✅ Done!\n\n');
    process.stdout.write(doneMsg);
    process.stdout.write(output);
    process.stdout.write('\n');
    await new Promise<void>((resolve) => process.stdout.write('', () => resolve()));
  } catch (error) {
    process.stderr.write(chalk.red(`\n✗ Error: ${error}\n`));
    process.exit(2);
  }
}

export function explainSync(repoUrl: string, options: { markdown?: boolean; json?: boolean }): void {
  explain(repoUrl, options).catch((err) => {
    process.stderr.write(chalk.red(`\n✗ Error: ${err}\n`));
    process.exit(2);
  });
}
