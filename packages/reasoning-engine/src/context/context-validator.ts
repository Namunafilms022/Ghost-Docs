import type { ContextSession } from '@ghost-docs/types';

export interface ValidationResult {
  valid: boolean;
  reason: string | null;
}

export class ContextValidator {
  validate(session: ContextSession | null): ValidationResult {
    if (!session) {
      return { valid: false, reason: 'No active session' };
    }

    if (session.previousQuestions.length === 0) {
      return { valid: true, reason: null };
    }

    if (session.previousQuestions.length > 50) {
      return { valid: false, reason: 'Session too long, start a new session' };
    }

    return { valid: true, reason: null };
  }
}
