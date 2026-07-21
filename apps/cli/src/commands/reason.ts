import { extractKnowledge } from '@ghost-docs/intelligence-engine';
import { RepositoryReasoner } from '@ghost-docs/reasoning-engine';

export async function reason(repoUrl: string, question: string): Promise<void> {
  try {
    const knowledge = await extractKnowledge({ repoUrl });
    const reasoner = new RepositoryReasoner();
    const answer = reasoner.ask(knowledge, question);

    process.stdout.write(`\nQuestion: ${answer.question}\n`);
    process.stdout.write(`Category: ${answer.category}\n`);
    process.stdout.write(`Confidence: ${(answer.confidence * 100).toFixed(0)}%\n\n`);
    process.stdout.write(`${answer.answer}\n\n`);

    if (answer.supportingFiles.length > 0) {
      process.stdout.write(`Supporting files:\n`);
      for (const f of answer.supportingFiles) {
        process.stdout.write(`  - ${f}\n`);
      }
      process.stdout.write('\n');
    }

    if (answer.supportingModules.length > 0) {
      process.stdout.write(`Supporting modules:\n`);
      for (const m of answer.supportingModules) {
        process.stdout.write(`  - ${m}\n`);
      }
      process.stdout.write('\n');
    }

    process.stdout.write(`Why I answered this:\n`);
    for (const line of answer.transparency) {
      process.stdout.write(`  ${line}\n`);
    }
    process.stdout.write('\n');
  } catch (error) {
    process.stderr.write(`Error: ${error}\n`);
    process.exit(1);
  }
}
