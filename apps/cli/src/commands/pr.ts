import { DocumentationSynchronizer, DiffRenderer } from '@ghost-docs/sync-engine';
import chalk from 'chalk';

export async function pr(repoUrl: string, options: { dryRun?: boolean }): Promise<void> {
  try {
    const match = repoUrl.match(/github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
    const localPath = match ? undefined : repoUrl;

    process.stdout.write(chalk.cyan('🔍 Analyzing git diff...\n'));

    const synchronizer = new DocumentationSynchronizer();
    const result = await synchronizer.sync({
      repoPath: localPath || repoUrl,
      repoUrl,
      dryRun: options.dryRun ?? true,
    });

    process.stdout.write(chalk.cyan('📝 Generating diff preview...\n'));

    const renderer = new DiffRenderer();
    const preview = renderer.render(result);

    process.stdout.write(chalk.green('✅ Done!\n\n'));
    process.stdout.write(preview);
    process.stdout.write('\n');

    if (result.impacts.length > 0) {
      if (options.dryRun ?? true) {
        process.stdout.write(chalk.yellow('\n⚠️  Dry run — no changes applied. Use without --dry-run to create PR.\n'));
      }
    } else {
      process.stdout.write(chalk.yellow('\n⚠️  No documentation changes needed.\n'));
    }
  } catch (error) {
    process.stderr.write(chalk.red(`\n✗ Error: ${error}\n`));
    process.exit(1);
  }
}
