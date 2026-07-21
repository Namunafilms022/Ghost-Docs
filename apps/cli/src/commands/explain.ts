import { extractKnowledge } from '@ghost-docs/intelligence-engine';
import { generateExplainReport } from '@ghost-docs/docs';

export async function explain(repoUrl: string): Promise<void> {
  try {
    const knowledge = await extractKnowledge({ repoUrl });
    const report = generateExplainReport(knowledge);
    process.stdout.write(report);
    process.stdout.write('\n');
  } catch (error) {
    process.stderr.write(`Error: ${error}\n`);
    process.exit(1);
  }
}
