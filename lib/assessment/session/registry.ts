import type {
  AssessmentQuestion,
  QuestionBank,
  ReviewStatus,
} from '@/lib/assessment/types';
import { validateQuestionBank } from '@/lib/assessment/validateQuestionBank';
import {
  sessionFailure,
  sessionIssue,
  sessionSuccess,
} from '@/lib/assessment/session/errors';
import type {
  QuestionRegistryEntry,
  RegistryBuildInput,
  SessionIssue,
  SessionResult,
} from '@/lib/assessment/session/types';

const DEFAULT_ALLOWED_STATUSES: ReviewStatus[] = ['approved'];

function registryEntry(question: AssessmentQuestion): QuestionRegistryEntry {
  return {
    question,
    questionId: question.id,
    version: question.version,
    familyId: question.familyId,
    courseId: question.courseId,
    moduleId: question.moduleId,
    sectionId: question.sectionId,
    objectiveId: question.objectiveId,
    reviewStatus: question.reviewStatus,
    format: question.format,
  };
}

function sameQuestionContent(left: AssessmentQuestion, right: AssessmentQuestion): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export class QuestionRegistry {
  readonly bankIds: readonly string[];
  readonly size: number;
  private readonly entries: ReadonlyMap<string, QuestionRegistryEntry>;

  constructor(entries: Map<string, QuestionRegistryEntry>, bankIds: string[]) {
    this.entries = entries;
    this.bankIds = [...bankIds];
    this.size = entries.size;
  }

  get(questionId: string): AssessmentQuestion | undefined {
    return this.entries.get(questionId)?.question;
  }

  getEntry(questionId: string): QuestionRegistryEntry | undefined {
    return this.entries.get(questionId);
  }

  lookup(questionId: string): SessionResult<QuestionRegistryEntry> {
    const entry = this.entries.get(questionId);
    if (!entry) {
      return sessionFailure(sessionIssue(
        'QUESTION_NOT_FOUND',
        `Question "${questionId}" is not registered.`,
        { questionId },
      ));
    }
    return sessionSuccess(entry);
  }

  questionIds(): string[] {
    return [...this.entries.keys()];
  }
}

export function buildQuestionRegistry({
  banks,
  allowedReviewStatuses = DEFAULT_ALLOWED_STATUSES,
  allowRetiredForArchival = false,
}: RegistryBuildInput): SessionResult<QuestionRegistry> {
  const issues: SessionIssue[] = [];
  const parsedBanks: QuestionBank[] = [];
  const bankIds = new Set<string>();
  const allowed = new Set(allowedReviewStatuses);

  if (allowed.has('retired') && !allowRetiredForArchival) {
    issues.push(sessionIssue(
      'QUESTION_NOT_ELIGIBLE',
      'Retired questions require allowRetiredForArchival: true.',
      { path: 'allowedReviewStatuses' },
    ));
  }

  banks.forEach((input, bankIndex) => {
    const validated = validateQuestionBank(input, { includeRetired: allowRetiredForArchival });
    const errors = validated.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
    if (!validated.bank || errors.length > 0) {
      if (errors.length === 0) {
        issues.push(sessionIssue(
          'MALFORMED_QUESTION_BANK',
          `Question bank at index ${bankIndex} is malformed.`,
          { path: `banks[${bankIndex}]` },
        ));
      } else {
        errors.forEach((diagnostic) => {
          issues.push(sessionIssue(
            'MALFORMED_QUESTION_BANK',
            `[${diagnostic.code}] ${diagnostic.message}`,
            {
              questionId: diagnostic.questionId,
              path: `banks[${bankIndex}]${diagnostic.path ? `.${diagnostic.path}` : ''}`,
            },
          ));
        });
      }
      return;
    }

    if (bankIds.has(validated.bank.id)) {
      issues.push(sessionIssue(
        'DUPLICATE_BANK_ID',
        `Bank ID "${validated.bank.id}" is duplicated.`,
        { path: `banks[${bankIndex}].id` },
      ));
      return;
    }
    bankIds.add(validated.bank.id);
    parsedBanks.push(validated.bank);
  });

  const entries = new Map<string, QuestionRegistryEntry>();
  parsedBanks.forEach((bank) => {
    bank.questions.forEach((question) => {
      const existing = entries.get(question.id);
      if (existing) {
        const conflicting = existing.version !== question.version
          || !sameQuestionContent(existing.question, question);
        issues.push(sessionIssue(
          conflicting ? 'QUESTION_CONFLICT' : 'DUPLICATE_QUESTION_ID',
          conflicting
            ? `Question "${question.id}" conflicts with an already registered version or definition.`
            : `Question "${question.id}" appears in more than one bank.`,
          { questionId: question.id },
        ));
        return;
      }

      const retiredAllowed = question.reviewStatus !== 'retired' || allowRetiredForArchival;
      if (!allowed.has(question.reviewStatus) || !retiredAllowed) {
        issues.push(sessionIssue(
          'QUESTION_NOT_ELIGIBLE',
          `Question "${question.id}" with status "${question.reviewStatus}" is not registry-eligible.`,
          { questionId: question.id, path: 'reviewStatus' },
        ));
        return;
      }

      entries.set(question.id, registryEntry(question));
    });
  });

  return issues.length > 0
    ? sessionFailure(issues)
    : sessionSuccess(new QuestionRegistry(entries, [...bankIds]));
}
