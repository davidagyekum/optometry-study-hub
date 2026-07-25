import type { Diagnostic } from '@/lib/assessment/diagnostics';
import type {
  AssessmentQuestion,
  QuestionBank,
  QuestionOption,
} from '@/lib/assessment/types';

function tokens(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function similarity(left: string, right: string): number {
  const leftTokens = new Set(tokens(left));
  const rightTokens = new Set(tokens(right));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return intersection / union;
}

function optionLikeEntries(question: AssessmentQuestion): QuestionOption[] {
  switch (question.format) {
    case 'single_best_answer':
    case 'multiple_response':
    case 'extended_matching':
      return question.options;
    case 'matching':
      return question.choices;
    case 'ordering':
      return question.items;
    case 'image_label':
      return question.labels;
    default:
      return [];
  }
}

function lintQuestion(question: AssessmentQuestion): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const entries = optionLikeEntries(question);
  const combinedOptions = entries.map((entry) => entry.text).join(' ');

  if (
    /\b(?:not|except|false|incorrect|least)\b/i.test(question.stem)
    && !question.allowNegativeStem
  ) {
    diagnostics.push({
      severity: 'warning',
      code: 'UNDECLARED_NEGATIVE_STEM',
      message: 'Negative stems require allowNegativeStem: true and careful review.',
      questionId: question.id,
      path: 'stem',
    });
  }
  if (/\ball of the above\b/i.test(combinedOptions)) {
    diagnostics.push({
      severity: 'warning',
      code: 'ALL_OF_THE_ABOVE',
      message: 'Avoid “all of the above” options.',
      questionId: question.id,
      path: 'options',
    });
  }
  if (/\bnone of the above\b/i.test(combinedOptions)) {
    diagnostics.push({
      severity: 'warning',
      code: 'NONE_OF_THE_ABOVE',
      message: 'Avoid “none of the above” options.',
      questionId: question.id,
      path: 'options',
    });
  }

  if (entries.length >= 3) {
    const lengths = entries.map((entry) => entry.text.trim().length);
    const shortest = Math.max(1, Math.min(...lengths));
    const longest = Math.max(...lengths);
    if (longest - shortest > 20 && longest / shortest > 2.5) {
      diagnostics.push({
        severity: 'warning',
        code: 'OPTION_LENGTH_IMBALANCE',
        message: 'Option lengths differ enough to risk cueing the answer.',
        questionId: question.id,
        path: 'options',
      });
    }

    const prefixes = entries.map((entry) => tokens(entry.text).slice(0, 2).join(' '));
    const prefixCounts = new Map<string, number>();
    prefixes.forEach((prefix) => {
      if (prefix) prefixCounts.set(prefix, (prefixCounts.get(prefix) ?? 0) + 1);
    });
    if ([...prefixCounts.values()].some((count) => count >= 3)) {
      diagnostics.push({
        severity: 'warning',
        code: 'REPEATED_OPTION_PREFIX',
        message: 'Repeated grammatical prefixes may belong in the stem.',
        questionId: question.id,
        path: 'options',
      });
    }
  }

  if (similarity(question.stem, question.explanation) >= 0.8) {
    diagnostics.push({
      severity: 'warning',
      code: 'STEM_COPIED_FROM_EXPLANATION',
      message: 'The stem substantially overlaps the explanation.',
      questionId: question.id,
      path: 'stem',
    });
  }
  if (
    question.reviewer
    && question.author.trim().toLocaleLowerCase() === question.reviewer.trim().toLocaleLowerCase()
  ) {
    diagnostics.push({
      severity: 'warning',
      code: 'AUTHOR_IS_REVIEWER',
      message: 'Independent review is preferred for reviewed items.',
      questionId: question.id,
      path: 'reviewer',
    });
  }
  if (
    (question.format === 'single_best_answer' || question.format === 'multiple_response')
    && question.difficulty !== 'foundation'
    && question.misconceptionTags.length === 0
  ) {
    diagnostics.push({
      severity: 'warning',
      code: 'MISSING_MISCONCEPTION_TAGS',
      message: 'Intermediate and advanced MCQs should identify targeted misconceptions.',
      questionId: question.id,
      path: 'misconceptionTags',
    });
  }
  if (
    ['apply', 'analyze', 'evaluate'].includes(question.bloomLevel)
    && /^(?:what|which|name|identify|define|list)\b/i.test(question.stem.trim())
  ) {
    diagnostics.push({
      severity: 'warning',
      code: 'POSSIBLE_BLOOM_MISMATCH',
      message: 'The stem appears recall-focused despite its higher Bloom label.',
      questionId: question.id,
      path: 'bloomLevel',
    });
  }
  question.sources.forEach((source, index) => {
    if (
      ['lecture', 'textbook', 'guideline', 'journal'].includes(source.kind)
      && !source.locator
    ) {
      diagnostics.push({
        severity: 'warning',
        code: 'MISSING_SOURCE_LOCATOR',
        message: `Source "${source.id}" should include a slide, page, chapter, or section locator.`,
        questionId: question.id,
        path: `sources[${index}].locator`,
      });
    }
  });

  return diagnostics;
}

export function lintQuestionBank(bank: QuestionBank): Diagnostic[] {
  const diagnostics = bank.questions.flatMap(lintQuestion);

  bank.questions.forEach((question, index) => {
    for (let comparisonIndex = index + 1; comparisonIndex < bank.questions.length; comparisonIndex += 1) {
      const comparison = bank.questions[comparisonIndex];
      if (similarity(question.stem, comparison.stem) >= 0.8) {
        diagnostics.push({
          severity: 'warning',
          code: 'NEAR_DUPLICATE_STEM',
          message: `Stem is very similar to question "${comparison.id}".`,
          questionId: question.id,
          path: 'stem',
        });
      }
    }
  });

  return diagnostics;
}
