import type { ContextSession, QuestionCategory } from '@ghost-docs/types';
import { QuestionClassifier } from '../question-classifier.js';
import { ReferenceResolver } from './reference-resolver.js';

export interface TopicResult {
  category: QuestionCategory;
  derivedFrom: 'question' | 'context';
  isFollowUp: boolean;
  referencedQuestion: string | null;
}

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  'project-purpose': 'Project Purpose',
  'authentication': 'Authentication',
  'startup-flow': 'Startup Flow',
  'entry-points': 'Entry Points',
  'api-locations': 'API Locations',
  'database-layer': 'Database Layer',
  'testing': 'Testing',
  'build-commands': 'Build Commands',
  'folder-responsibilities': 'Folder Responsibilities',
  'dependencies': 'Dependencies',
  'architecture': 'Architecture',
  'unknown': 'Unknown',
};

export class TopicResolver {
  private classifier = new QuestionClassifier();
  private refResolver = new ReferenceResolver();

  resolve(question: string, session: ContextSession | null): TopicResult {
    const ref = this.refResolver.resolve(question, session);

    const direct = this.classifier.classify(question);

    if (direct.category !== 'unknown') {
      return {
        category: direct.category,
        derivedFrom: 'question',
        isFollowUp: ref.isFollowUp,
        referencedQuestion: ref.referencedQuestion,
      };
    }

    if (ref.inheritedTopic && session?.currentTopic) {
      return {
        category: session.currentTopic,
        derivedFrom: 'context',
        isFollowUp: true,
        referencedQuestion: ref.referencedQuestion,
      };
    }

    return {
      category: 'unknown',
      derivedFrom: 'question',
      isFollowUp: false,
      referencedQuestion: null,
    };
  }

  getCategoryLabel(category: QuestionCategory): string {
    return CATEGORY_LABELS[category] || 'Unknown';
  }
}
