import { extractKnowledge } from '@ghost-docs/intelligence-engine';
import { RepositoryReasoner } from '@ghost-docs/reasoning-engine';

let reasoner: RepositoryReasoner | null = null;
let knowledge: Awaited<ReturnType<typeof extractKnowledge>> | null = null;
let sessionId: string | null = null;

export async function reason(repoUrl: string, question: string): Promise<void> {
  try {
    if (!reasoner) {
      reasoner = new RepositoryReasoner();
      knowledge = await extractKnowledge({ repoUrl });
      sessionId = reasoner.createSession();
    }

    const answer = reasoner.ask(knowledge!, question, sessionId!);

    if (answer.context) {
      process.stdout.write(`\n`);
      if (answer.context.isFollowUp) {
        process.stdout.write(`📎 Follow-up | `);
      }
      process.stdout.write(`Topic: ${answer.context.currentTopicLabel}`);
      process.stdout.write(` | Confidence: ${(answer.confidence * 100).toFixed(0)}%\n\n`);
    } else {
      process.stdout.write(`\nCategory: ${answer.category}`);
      process.stdout.write(` | Confidence: ${(answer.confidence * 100).toFixed(0)}%\n\n`);
    }

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
