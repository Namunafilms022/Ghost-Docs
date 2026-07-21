import { DocumentationSynchronizer, DiffRenderer } from '@ghost-docs/sync-engine';

export async function pr(repoUrl: string, options: { dryRun?: boolean }): Promise<void> {
  try {
    const match = repoUrl.match(/github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
    const localPath = match ? undefined : repoUrl;

    const synchronizer = new DocumentationSynchronizer();
    const result = await synchronizer.sync({
      repoPath: localPath || repoUrl,
      repoUrl,
      dryRun: options.dryRun ?? true,
    });

    const renderer = new DiffRenderer();
    const preview = renderer.render(result);
    process.stdout.write(preview);
    process.stdout.write('\n');
  } catch (error) {
    process.stderr.write(`Error: ${error}\n`);
    process.exit(1);
  }
}
