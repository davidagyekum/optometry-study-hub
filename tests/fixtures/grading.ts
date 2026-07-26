import type { AssessmentQuestion } from '@/lib/assessment/types';
import type {
  AssessmentAttemptSnapshot,
  PersistedResponse,
} from '@/lib/storage/schemas';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';

function swappedMapping(mapping: Record<string, string>): Record<string, string> {
  const entries = Object.entries(mapping);
  if (entries.length < 2) throw new Error('A grading fixture mapping needs two entries.');
  const result = { ...mapping };
  result[entries[0][0]] = entries[1][1];
  result[entries[1][0]] = entries[0][1];
  return result;
}

export function correctResponseFor(question: AssessmentQuestion): PersistedResponse {
  switch (question.format) {
    case 'single_best_answer':
      return { format: question.format, optionId: question.correctOptionId };
    case 'multiple_response':
      return { format: question.format, optionIds: [...question.correctOptionIds].reverse() };
    case 'ordering':
      return { format: question.format, itemIds: [...question.correctOrder] };
    case 'matching':
      return { format: question.format, matches: { ...question.correctMatches } };
    case 'extended_matching':
      return { format: question.format, answers: { ...question.correctAnswers } };
    case 'image_hotspot':
      return { format: question.format, regionIds: [...question.correctRegionIds].reverse() };
    case 'image_label':
      return { format: question.format, matches: { ...question.correctLabels } };
    case 'short_answer':
      return { format: question.format, text: `  ${question.acceptedAnswers[0].toUpperCase()}!!!  ` };
    case 'open_response':
      return {
        format: question.format,
        text: 'A reasoned response that requires review.',
      };
  }
}

export function incorrectResponseFor(question: AssessmentQuestion): PersistedResponse {
  switch (question.format) {
    case 'single_best_answer':
      return {
        format: question.format,
        optionId: question.options.find(
          (option) => option.id !== question.correctOptionId,
        )?.id ?? question.options[0].id,
      };
    case 'multiple_response': {
      const wrong = question.options.find(
        (option) => !question.correctOptionIds.includes(option.id),
      );
      if (!wrong) throw new Error('Multiple-response fixture needs a distractor.');
      return {
        format: question.format,
        optionIds: [...question.correctOptionIds.slice(0, -1), wrong.id],
      };
    }
    case 'ordering': {
      const itemIds = [...question.correctOrder];
      [itemIds[0], itemIds[1]] = [itemIds[1], itemIds[0]];
      return { format: question.format, itemIds };
    }
    case 'matching':
      return { format: question.format, matches: swappedMapping(question.correctMatches) };
    case 'extended_matching':
      return { format: question.format, answers: swappedMapping(question.correctAnswers) };
    case 'image_hotspot': {
      const wrong = question.regions.find(
        (region) => !question.correctRegionIds.includes(region.id),
      );
      if (!wrong) throw new Error('Hotspot fixture needs an incorrect region.');
      return { format: question.format, regionIds: [wrong.id] };
    }
    case 'image_label':
      return { format: question.format, matches: swappedMapping(question.correctLabels) };
    case 'short_answer':
      return { format: question.format, text: 'tonometry device substring' };
    case 'open_response':
      return { format: question.format, text: 'Still requires manual review.' };
  }
}

export function addCorrectResponses(
  attempt: AssessmentAttemptSnapshot,
  registry: QuestionRegistry,
  includeOpenResponse = false,
): AssessmentAttemptSnapshot {
  const responses = { ...attempt.responses };
  attempt.orderedQuestionIds.forEach((questionId) => {
    const question = registry.get(questionId);
    if (!question) throw new Error(`Missing fixture question ${questionId}`);
    if (question.format !== 'open_response' || includeOpenResponse) {
      responses[questionId] = correctResponseFor(question);
    }
  });
  return { ...attempt, responses };
}
