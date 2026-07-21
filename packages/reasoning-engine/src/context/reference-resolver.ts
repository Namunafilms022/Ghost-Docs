import type { ContextSession } from '@ghost-docs/types';

const PRONOUN_PATTERNS = [
  /\b(it|this|that)\b/i,
  /\b(they|them|their)\b/i,
  /\b(there)\b/i,
];

const FOLLOW_UP_PATTERNS = [
  /^then\b/i,
  /^(and|but|so|also)\b/i,
  /^what about/i,
  /^how about/i,
  /^what is/i,
  /^where is/i,
  /^how (does|do|is|are|can)/i,
  /^why (does|do|is|are|can)/i,
  /^when (does|do|is|are|can)/i,
  /^can you/i,
  /^tell me (more|about)/i,
  /^elaborate/i,
  /^explain (further|more)/i,
  /^regarding/i,
  /^about (the|that|this)/i,
  /^\w+(er|est)\b.*\?$/i,
];

const REFERENCE_PATTERNS = [
  { pattern: /\bthe same\b/i, type: 'same-topic' },
  { pattern: /\bthis\b.*(topic|question|subject|area)/i, type: 'same-topic' },
  { pattern: /\bthat\b/i, type: 'same-topic' },
  { pattern: /\bthere\b/i, type: 'location' },
  { pattern: /\b(previous|last|prior)\b/i, type: 'previous' },
  { pattern: /\b(aforementioned|above|earlier)\b/i, type: 'previous' },
];

export interface ReferenceResult {
  isFollowUp: boolean;
  referencedQuestion: string | null;
  inheritedTopic: boolean;
  clarificationNeeded: boolean;
}

export class ReferenceResolver {
  resolve(question: string, session: ContextSession | null): ReferenceResult {
    const result: ReferenceResult = {
      isFollowUp: false,
      referencedQuestion: null,
      inheritedTopic: false,
      clarificationNeeded: false,
    };

    if (!session || session.previousQuestions.length === 0) {
      return result;
    }

    const hasPronoun = PRONOUN_PATTERNS.some(p => p.test(question));
    const isFollowUp = FOLLOW_UP_PATTERNS.some(p => p.test(question));
    const hasReference = REFERENCE_PATTERNS.some(r => r.pattern.test(question));

    if (hasPronoun || isFollowUp || hasReference) {
      result.isFollowUp = true;
      result.inheritedTopic = true;
      const lastQ = session.previousQuestions[session.previousQuestions.length - 1];
      result.referencedQuestion = lastQ;

      if (hasPronoun && !isFollowUp && !hasReference) {
        result.clarificationNeeded = false;
      }
    }

    return result;
  }
}
