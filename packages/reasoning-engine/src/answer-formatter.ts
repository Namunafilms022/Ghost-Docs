import type { ReasonedAnswer, QuestionCategory } from '@ghost-docs/types';
import type { ReasoningResult } from './reasoning-engine.js';

export class AnswerFormatter {
  format(result: ReasoningResult): ReasonedAnswer {
    const transparency = this.buildTransparency(result);
    return {
      question: '',
      answer: result.answer,
      confidence: result.confidence,
      supportingFiles: result.supportingFiles,
      supportingModules: result.supportingModules,
      reasoningPath: result.reasoningPath,
      transparency,
      category: result.category,
    };
  }

  private buildTransparency(result: ReasoningResult): string[] {
    const lines: string[] = [];
    lines.push(`I answered this because I detected:`);

    for (const factor of result.confidenceFactors) {
      lines.push(`- ${factor}`);
    }

    if (result.supportingFiles.length > 0) {
      lines.push('');
      lines.push(`Supporting files:`);
      for (const f of result.supportingFiles) {
        lines.push(`- ${f}`);
      }
    }

    if (result.supportingModules.length > 0) {
      lines.push('');
      lines.push(`Supporting modules:`);
      for (const m of result.supportingModules) {
        lines.push(`- ${m}`);
      }
    }

    if (result.confidence < 0.5) {
      lines.push('');
      lines.push(`⚠️ Low confidence (${result.confidence}). This answer may not be reliable.`);
    }

    return lines;
  }
}
