import {
  gradingFailure,
  gradingIssue,
  gradingSuccess,
} from '@/lib/assessment/grading/errors';
import { normalizeShortAnswer } from '@/lib/assessment/grading/normalizeShortAnswer';
import { resolveGradingPolicy } from '@/lib/assessment/grading/policyRegistry';
import { roundGradingScore } from '@/lib/assessment/grading/scoreContribution';
import { questionGradeOutcomeSchema } from '@/lib/assessment/grading/schemas';
import type {
  GradeResponseForQuestionInput,
  GradingPolicy,
  GradingResult,
  QuestionGradeOutcome,
} from '@/lib/assessment/grading/types';
import type {
  AssessmentQuestion,
  QuestionFormat,
} from '@/lib/assessment/types';
import { validateResponseForQuestion } from '@/lib/assessment/session/responseValidation';

function sameSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const expected = new Set(right);
  return left.every((value) => expected.has(value));
}

function exactSequence(left: string[], right: string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function correctMappingParts(
  submitted: Record<string, string>,
  expected: Record<string, string>,
): number {
  return Object.keys(expected).filter((key) => submitted[key] === expected[key]).length;
}

function automaticOutcome(
  question: AssessmentQuestion,
  correct: boolean,
  parts?: { correctParts: number; totalParts: number },
): QuestionGradeOutcome {
  return {
    questionId: question.id,
    questionVersion: question.version,
    format: question.format,
    status: correct ? 'correct' : 'incorrect',
    score: correct ? 1 : 0,
    maxScore: 1,
    ...parts,
  };
}

function componentOutcome(
  question: AssessmentQuestion,
  policy: GradingPolicy,
  correctParts: number,
  totalParts: number,
): QuestionGradeOutcome {
  const parts = { correctParts, totalParts };
  if (!policy.diagnosticPartialFormats.includes(question.format)) {
    return automaticOutcome(question, correctParts === totalParts, parts);
  }
  if (correctParts === 0) return automaticOutcome(question, false, parts);
  if (correctParts === totalParts) return automaticOutcome(question, true, parts);
  return {
    questionId: question.id,
    questionVersion: question.version,
    format: question.format,
    status: 'partial',
    score: roundGradingScore(correctParts / totalParts),
    maxScore: 1,
    ...parts,
  };
}

function unansweredOutcome(question: AssessmentQuestion): QuestionGradeOutcome {
  return {
    questionId: question.id,
    questionVersion: question.version,
    format: question.format,
    status: 'unanswered',
    score: 0,
    maxScore: 1,
  };
}

function manualOutcome(question: AssessmentQuestion): QuestionGradeOutcome {
  return {
    questionId: question.id,
    questionVersion: question.version,
    format: question.format,
    status: 'manual_required',
    score: null,
    maxScore: 1,
  };
}

function validateOutcome(
  outcome: QuestionGradeOutcome,
): GradingResult<QuestionGradeOutcome> {
  const parsed = questionGradeOutcomeSchema.safeParse(outcome);
  if (parsed.success) return gradingSuccess(parsed.data);
  return gradingFailure(parsed.error.issues.map((issue) => gradingIssue(
    'GRADING_SCORE_INVALID',
    issue.message,
    { questionId: outcome.questionId, path: issue.path.join('.') },
  )));
}

function unsupportedFormat(
  question: never,
): GradingResult<QuestionGradeOutcome> {
  const candidate = question as AssessmentQuestion;
  return gradingFailure(gradingIssue(
    'GRADING_QUESTION_FORMAT_UNSUPPORTED',
    `Question format "${candidate.format as QuestionFormat}" is not supported.`,
    { questionId: candidate.id, path: 'format' },
  ));
}

export function gradeResponseForQuestion({
  question,
  response,
  policy: policyReference,
}: GradeResponseForQuestionInput): GradingResult<QuestionGradeOutcome> {
  const resolvedPolicy = resolveGradingPolicy(policyReference);
  if (!resolvedPolicy.ok) return resolvedPolicy;
  if (response === undefined) return validateOutcome(unansweredOutcome(question));

  const validated = validateResponseForQuestion(question, response);
  if (!validated.ok) {
    return gradingFailure(validated.issues.map((issue) => gradingIssue(
      'GRADING_RESPONSE_INVALID',
      `[${issue.code}] ${issue.message}`,
      { questionId: question.id, path: issue.path },
    )));
  }
  const validResponse = validated.value.response;
  const policy = resolvedPolicy.value;

  switch (question.format) {
    case 'single_best_answer':
      if (validResponse.format !== question.format) break;
      return validateOutcome(automaticOutcome(
        question,
        validResponse.optionId === question.correctOptionId,
      ));
    case 'multiple_response':
      if (validResponse.format !== question.format) break;
      return validateOutcome(automaticOutcome(
        question,
        sameSet(validResponse.optionIds, question.correctOptionIds),
      ));
    case 'ordering':
      if (validResponse.format !== question.format) break;
      return validateOutcome(automaticOutcome(
        question,
        exactSequence(validResponse.itemIds, question.correctOrder),
      ));
    case 'matching': {
      if (validResponse.format !== question.format) break;
      const totalParts = Object.keys(question.correctMatches).length;
      return validateOutcome(componentOutcome(
        question,
        policy,
        correctMappingParts(validResponse.matches, question.correctMatches),
        totalParts,
      ));
    }
    case 'extended_matching': {
      if (validResponse.format !== question.format) break;
      const totalParts = Object.keys(question.correctAnswers).length;
      return validateOutcome(componentOutcome(
        question,
        policy,
        correctMappingParts(validResponse.answers, question.correctAnswers),
        totalParts,
      ));
    }
    case 'image_hotspot':
      if (validResponse.format !== question.format) break;
      return validateOutcome(automaticOutcome(
        question,
        sameSet(validResponse.regionIds, question.correctRegionIds),
      ));
    case 'image_label': {
      if (validResponse.format !== question.format) break;
      const totalParts = Object.keys(question.correctLabels).length;
      return validateOutcome(componentOutcome(
        question,
        policy,
        correctMappingParts(validResponse.matches, question.correctLabels),
        totalParts,
      ));
    }
    case 'short_answer':
      if (validResponse.format !== question.format) break;
      {
        const normalizedResponse = normalizeShortAnswer(
          validResponse.text,
          question.normalization,
        );
        const correct = normalizedResponse.length > 0
          && question.acceptedAnswers.some((answer) => {
            const normalizedAnswer = normalizeShortAnswer(answer, question.normalization);
            return normalizedAnswer.length > 0 && normalizedAnswer === normalizedResponse;
          });
        return validateOutcome(automaticOutcome(question, correct));
      }
    case 'open_response':
      if (validResponse.format !== question.format) break;
      return validateOutcome(manualOutcome(question));
    default:
      return unsupportedFormat(question);
  }

  return gradingFailure(gradingIssue(
    'GRADING_RESPONSE_INVALID',
    `Response format does not match question format "${question.format}".`,
    { questionId: question.id, path: 'format' },
  ));
}
