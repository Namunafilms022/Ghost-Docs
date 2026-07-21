import type { ReasonedAnswer, QuestionCategory, ContextInfo } from '@ghost-docs/types';
import type { ReasoningResult } from './reasoning-engine.js';

export class AnswerFormatter {
  format(result: ReasoningResult, context?: ContextInfo): ReasonedAnswer {
    const transparency = this.buildTransparency(result, context);
    return {
      question: '',
      answer: result.answer,
      confidence: result.confidence,
      supportingFiles: result.supportingFiles,
      supportingModules: result.supportingModules,
      reasoningPath: result.reasoningPath,
      transparency,
      category: result.category,
      ...(context ? { context } : {}),
    };
  }

  private buildTransparency(result: ReasoningResult, context?: ContextInfo): string[] {
    const lines: string[] = [];

    if (context?.isFollowUp) {
      lines.push(`📎 Follow-up question detected`);
      if (context.topicDerivedFrom === 'context') {
        lines.push(`🗂 Topic inherited from context: ${context.currentTopicLabel}`);
      }
      if (context.referencedPreviousQuestion) {
        lines.push(`🔗 References previous question: "${context.referencedPreviousQuestion}"`);
      }
      lines.push('');
    }

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

    if (context) {
      lines.push('');
      lines.push(`Current context: ${context.currentTopicLabel}`);
      if (context.currentModule) lines.push(`Active module: ${context.currentModule}`);
      if (context.currentFile) lines.push(`Active file: ${context.currentFile}`);
    }

    if (result.confidence < 0.5) {
      lines.push('');
      lines.push(`⚠️ Low confidence (${result.confidence}). This answer may not be reliable.`);
    }

    return lines;
  }
}
