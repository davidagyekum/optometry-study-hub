import type { Diagnostic } from '@/lib/assessment/diagnostics';
import { questionBankSchema } from '@/lib/assessment/schemas';
import type {
  AssessmentQuestion,
  LearningObjective,
  QuestionBank,
  QuestionOption,
  SourceReference,
} from '@/lib/assessment/types';

export type QuestionBankValidationOptions = {
  includeRetired?: boolean;
};

export type QuestionBankValidationResult = {
  bank?: QuestionBank;
  diagnostics: Diagnostic[];
};

function normalizedText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function addDuplicateDiagnostics(
  values: string[],
  code: string,
  label: string,
  diagnostics: Diagnostic[],
  questionId?: string,
): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (seen.has(value)) {
      diagnostics.push({
        severity: 'error',
        code,
        message: `Duplicate ${label} "${value}".`,
        questionId,
        path: `[${index}]`,
      });
    }
    seen.add(value);
  });
}

function hasExactUniqueSet(values: string[], expected: string[]): boolean {
  if (new Set(values).size !== values.length || new Set(expected).size !== expected.length) {
    return false;
  }
  if (values.length !== expected.length) return false;
  const expectedSet = new Set(expected);
  return values.every((value) => expectedSet.has(value));
}

function sameSourceIdentity(left: SourceReference, right: SourceReference): boolean {
  return left.title === right.title && left.kind === right.kind && left.url === right.url;
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

function validateOptionEntries(question: AssessmentQuestion, diagnostics: Diagnostic[]): void {
  const entries = optionLikeEntries(question);
  addDuplicateDiagnostics(
    entries.map((entry) => entry.id),
    'DUPLICATE_OPTION_ID',
    'option ID',
    diagnostics,
    question.id,
  );
  addDuplicateDiagnostics(
    entries.map((entry) => normalizedText(entry.text)),
    'DUPLICATE_OPTION_TEXT',
    'normalized option text',
    diagnostics,
    question.id,
  );

  if (question.reviewStatus === 'reviewed' || question.reviewStatus === 'approved') {
    entries.forEach((entry, index) => {
      if (!entry.rationale?.trim()) {
        diagnostics.push({
          severity: 'error',
          code: 'MISSING_OPTION_RATIONALE',
          message: `Reviewed and approved option "${entry.id}" requires a rationale.`,
          questionId: question.id,
          path: `options[${index}].rationale`,
        });
      }
    });
  }
}

function validateSingleBestAnswer(
  question: Extract<AssessmentQuestion, { format: 'single_best_answer' }>,
  diagnostics: Diagnostic[],
): void {
  if (!question.options.some((option) => option.id === question.correctOptionId)) {
    diagnostics.push({
      severity: 'error',
      code: 'CORRECT_OPTION_NOT_FOUND',
      message: `Correct option "${question.correctOptionId}" is not present.`,
      questionId: question.id,
      path: 'correctOptionId',
    });
  }
}

function validateMultipleResponse(
  question: Extract<AssessmentQuestion, { format: 'multiple_response' }>,
  diagnostics: Diagnostic[],
): void {
  const optionIds = new Set(question.options.map((option) => option.id));
  addDuplicateDiagnostics(
    question.correctOptionIds,
    'DUPLICATE_CORRECT_OPTION_ID',
    'correct option ID',
    diagnostics,
    question.id,
  );
  question.correctOptionIds.forEach((correctId) => {
    if (!optionIds.has(correctId)) {
      diagnostics.push({
        severity: 'error',
        code: 'CORRECT_OPTION_NOT_FOUND',
        message: `Correct option "${correctId}" is not present.`,
        questionId: question.id,
        path: 'correctOptionIds',
      });
    }
  });

  const minimum = question.minimumSelections ?? question.correctOptionIds.length;
  const maximum = question.maximumSelections ?? question.options.length;
  if (
    minimum > maximum
    || maximum > question.options.length
    || question.correctOptionIds.length < minimum
    || question.correctOptionIds.length > maximum
  ) {
    diagnostics.push({
      severity: 'error',
      code: 'INVALID_SELECTION_LIMITS',
      message: 'Selection limits must be ordered and cannot exceed the option count.',
      questionId: question.id,
      path: 'minimumSelections',
    });
  }
}

function validateOrdering(
  question: Extract<AssessmentQuestion, { format: 'ordering' }>,
  diagnostics: Diagnostic[],
): void {
  const itemIds = question.items.map((item) => item.id);
  const expected = [...itemIds].sort();
  const actual = [...question.correctOrder].sort();
  if (
    actual.length !== expected.length
    || actual.some((id, index) => id !== expected[index])
    || new Set(question.correctOrder).size !== question.correctOrder.length
  ) {
    diagnostics.push({
      severity: 'error',
      code: 'INVALID_ORDERING_PERMUTATION',
      message: 'correctOrder must be an exact permutation of the item IDs.',
      questionId: question.id,
      path: 'correctOrder',
    });
  }
}

function validateMatching(
  question: Extract<AssessmentQuestion, { format: 'matching' }>,
  diagnostics: Diagnostic[],
): void {
  const promptIds = question.prompts.map((prompt) => prompt.id);
  addDuplicateDiagnostics(
    promptIds,
    'DUPLICATE_MATCHING_PROMPT_ID',
    'matching prompt ID',
    diagnostics,
    question.id,
  );
  addDuplicateDiagnostics(
    question.prompts.map((prompt) => normalizedText(prompt.text)),
    'DUPLICATE_MATCHING_PROMPT_TEXT',
    'normalized matching prompt text',
    diagnostics,
    question.id,
  );
  const choiceIds = new Set(question.choices.map((choice) => choice.id));
  const matchPromptIds = Object.keys(question.correctMatches);
  const exactPrompts = hasExactUniqueSet(promptIds, matchPromptIds);

  if (!exactPrompts || Object.values(question.correctMatches).some((id) => !choiceIds.has(id))) {
    diagnostics.push({
      severity: 'error',
      code: 'INVALID_MATCHING_REFERENCE',
      message: 'Every prompt must map to an existing choice.',
      questionId: question.id,
      path: 'correctMatches',
    });
  }

  if (!question.reuseChoices) {
    const answers = Object.values(question.correctMatches);
    if (new Set(answers).size !== answers.length) {
      diagnostics.push({
        severity: 'error',
        code: 'UNDECLARED_CHOICE_REUSE',
        message: 'Choice reuse requires reuseChoices: true.',
        questionId: question.id,
        path: 'correctMatches',
      });
    }
  }
}

function validateExtendedMatching(
  question: Extract<AssessmentQuestion, { format: 'extended_matching' }>,
  diagnostics: Diagnostic[],
): void {
  const stemIds = question.stems.map((stem) => stem.id);
  addDuplicateDiagnostics(
    stemIds,
    'DUPLICATE_EXTENDED_MATCHING_STEM_ID',
    'extended-matching stem ID',
    diagnostics,
    question.id,
  );
  addDuplicateDiagnostics(
    question.stems.map((stem) => normalizedText(stem.text)),
    'DUPLICATE_EXTENDED_MATCHING_STEM_TEXT',
    'normalized extended-matching stem text',
    diagnostics,
    question.id,
  );
  const optionIds = new Set(question.options.map((option) => option.id));
  const answerStemIds = Object.keys(question.correctAnswers);
  const exactStems = hasExactUniqueSet(stemIds, answerStemIds);

  if (!exactStems || Object.values(question.correctAnswers).some((id) => !optionIds.has(id))) {
    diagnostics.push({
      severity: 'error',
      code: 'INVALID_EXTENDED_MATCHING_REFERENCE',
      message: 'Every extended-matching stem must map to an existing option.',
      questionId: question.id,
      path: 'correctAnswers',
    });
  }

  if (!question.reuseOptions) {
    const answers = Object.values(question.correctAnswers);
    if (new Set(answers).size !== answers.length) {
      diagnostics.push({
        severity: 'error',
        code: 'UNDECLARED_OPTION_REUSE',
        message: 'Option reuse requires reuseOptions: true.',
        questionId: question.id,
        path: 'correctAnswers',
      });
    }
  }
}

function validateHotspot(
  question: Extract<AssessmentQuestion, { format: 'image_hotspot' }>,
  diagnostics: Diagnostic[],
): void {
  const regionIds = question.regions.map((region) => region.id);
  addDuplicateDiagnostics(
    regionIds,
    'DUPLICATE_REGION_ID',
    'region ID',
    diagnostics,
    question.id,
  );
  addDuplicateDiagnostics(
    question.correctRegionIds,
    'DUPLICATE_CORRECT_REGION_ID',
    'correct region ID',
    diagnostics,
    question.id,
  );

  question.regions.forEach((region, index) => {
    if (
      region.x < 0
      || region.y < 0
      || region.width <= 0
      || region.height <= 0
      || region.x + region.width > 1
      || region.y + region.height > 1
    ) {
      diagnostics.push({
        severity: 'error',
        code: 'INVALID_HOTSPOT_COORDINATES',
        message: 'Hotspot regions must remain within normalized image coordinates 0–1.',
        questionId: question.id,
        path: `regions[${index}]`,
      });
    }
  });

  const available = new Set(regionIds);
  if (question.correctRegionIds.some((id) => !available.has(id))) {
    diagnostics.push({
      severity: 'error',
      code: 'CORRECT_REGION_NOT_FOUND',
      message: 'Every correct hotspot region ID must exist.',
      questionId: question.id,
      path: 'correctRegionIds',
    });
  }
}

function validateImageLabels(
  question: Extract<AssessmentQuestion, { format: 'image_label' }>,
  diagnostics: Diagnostic[],
): void {
  const targetIds = question.targets.map((target) => target.id);
  const labelIds = new Set(question.labels.map((label) => label.id));
  addDuplicateDiagnostics(
    targetIds,
    'DUPLICATE_TARGET_ID',
    'target ID',
    diagnostics,
    question.id,
  );

  question.targets.forEach((target, index) => {
    if (target.x < 0 || target.x > 1 || target.y < 0 || target.y > 1) {
      diagnostics.push({
        severity: 'error',
        code: 'INVALID_LABEL_COORDINATES',
        message: 'Image-label targets must use normalized coordinates 0–1.',
        questionId: question.id,
        path: `targets[${index}]`,
      });
    }
  });

  const answerTargets = Object.keys(question.correctLabels);
  const exactTargets = targetIds.length === answerTargets.length
    && targetIds.every((id) => answerTargets.includes(id));
  const correctLabelIds = Object.values(question.correctLabels);
  if (!exactTargets || correctLabelIds.some((id) => !labelIds.has(id))) {
    diagnostics.push({
      severity: 'error',
      code: 'INVALID_IMAGE_LABEL_REFERENCE',
      message: 'Every image target must map to an existing stable label ID.',
      questionId: question.id,
      path: 'correctLabels',
    });
  }
  if (new Set(correctLabelIds).size !== correctLabelIds.length) {
    diagnostics.push({
      severity: 'error',
      code: 'DUPLICATE_CORRECT_LABEL_ID',
      message: 'Each correct image label may be used only once.',
      questionId: question.id,
      path: 'correctLabels',
    });
  }
}

function validateShortAnswer(
  question: Extract<AssessmentQuestion, { format: 'short_answer' }>,
  diagnostics: Diagnostic[],
): void {
  const normalizeAnswer = (answer: string): string => {
    let normalized = answer;
    if (question.normalization.trim) normalized = normalized.trim();
    if (question.normalization.collapseWhitespace) {
      normalized = normalized.replace(/\s+/g, ' ');
    }
    if (question.normalization.caseInsensitive) normalized = normalized.toLowerCase();
    if (question.normalization.ignoreTerminalPunctuation) {
      normalized = normalized.replace(/[\p{P}\p{S}]+$/gu, '');
    }
    return normalized;
  };

  addDuplicateDiagnostics(
    question.acceptedAnswers.map(normalizeAnswer),
    'DUPLICATE_NORMALIZED_SHORT_ANSWER',
    'normalized accepted answer',
    diagnostics,
    question.id,
  );
}

function validateQuestion(
  question: AssessmentQuestion,
  bank: QuestionBank,
  objectiveLookup: Map<string, LearningObjective>,
  sourceLookup: Map<string, SourceReference>,
  diagnostics: Diagnostic[],
  options: QuestionBankValidationOptions,
): void {
  if (!question.stem.trim()) {
    diagnostics.push({
      severity: 'error',
      code: 'EMPTY_STEM',
      message: 'Question stem cannot be empty.',
      questionId: question.id,
      path: 'stem',
    });
  }
  if (!question.explanation.trim()) {
    diagnostics.push({
      severity: 'error',
      code: 'EMPTY_EXPLANATION',
      message: 'Question explanation cannot be empty.',
      questionId: question.id,
      path: 'explanation',
    });
  }

  const objective = objectiveLookup.get(question.objectiveId);
  if (!objective) {
    diagnostics.push({
      severity: 'error',
      code: 'MISSING_OBJECTIVE_REFERENCE',
      message: `Objective "${question.objectiveId}" is not present in the bank.`,
      questionId: question.id,
      path: 'objectiveId',
    });
  }
  if (objective && objective.courseId !== question.courseId) {
    diagnostics.push({
      severity: 'error',
      code: 'OBJECTIVE_COURSE_MISMATCH',
      message: `Objective course "${objective.courseId}" does not match question course "${question.courseId}".`,
      questionId: question.id,
      path: 'objectiveId',
    });
  }
  if (objective && objective.moduleId !== question.moduleId) {
    diagnostics.push({
      severity: 'error',
      code: 'OBJECTIVE_MODULE_MISMATCH',
      message: `Objective module "${objective.moduleId}" does not match question module "${question.moduleId}".`,
      questionId: question.id,
      path: 'objectiveId',
    });
  }
  if (
    objective?.sectionId
    && objective.sectionId !== question.sectionId
  ) {
    diagnostics.push({
      severity: 'error',
      code: 'OBJECTIVE_SECTION_MISMATCH',
      message: `Objective section "${objective.sectionId}" does not match question section "${question.sectionId}".`,
      questionId: question.id,
      path: 'objectiveId',
    });
  }
  if (objective && !objective.targetBloomLevels.includes(question.bloomLevel)) {
    diagnostics.push({
      severity: 'error',
      code: 'BLOOM_OUTSIDE_OBJECTIVE_TARGET',
      message: `Bloom level "${question.bloomLevel}" is not targeted by objective "${objective.id}".`,
      questionId: question.id,
      path: 'bloomLevel',
    });
  }
  if (!bank.courseIds.includes(question.courseId)) {
    diagnostics.push({
      severity: 'error',
      code: 'COURSE_NOT_IN_BANK',
      message: `Course "${question.courseId}" is not declared by the bank.`,
      questionId: question.id,
      path: 'courseId',
    });
  }
  addDuplicateDiagnostics(
    question.sources.map((source) => source.id),
    'DUPLICATE_QUESTION_SOURCE_ID',
    'question source ID',
    diagnostics,
    question.id,
  );
  question.sources.forEach((source, index) => {
    const registeredSource = sourceLookup.get(source.id);
    if (!registeredSource) {
      diagnostics.push({
        severity: 'error',
        code: 'MISSING_SOURCE_REFERENCE',
        message: `Source "${source.id}" is not present in the bank source registry.`,
        questionId: question.id,
        path: `sources[${index}]`,
      });
    }
    if (registeredSource && !sameSourceIdentity(source, registeredSource)) {
      diagnostics.push({
        severity: 'error',
        code: 'SOURCE_METADATA_MISMATCH',
        message: `Source "${source.id}" must retain the registry title, kind, and URL; only its locator may vary.`,
        questionId: question.id,
        path: `sources[${index}]`,
      });
    }
  });
  if (
    (question.reviewStatus === 'reviewed' || question.reviewStatus === 'approved')
    && !question.reviewer?.trim()
  ) {
    diagnostics.push({
      severity: 'error',
      code: 'MISSING_REVIEWER',
      message: 'Reviewed and approved questions require a reviewer.',
      questionId: question.id,
      path: 'reviewer',
    });
  }
  if (
    (question.reviewStatus === 'reviewed' || question.reviewStatus === 'approved')
    && question.sources.length === 0
  ) {
    diagnostics.push({
      severity: 'error',
      code: 'MISSING_REQUIRED_SOURCE',
      message: 'Reviewed and approved questions require at least one source.',
      questionId: question.id,
      path: 'sources',
    });
  }
  if (question.reviewStatus === 'retired' && !options.includeRetired) {
    diagnostics.push({
      severity: 'error',
      code: 'RETIRED_QUESTION_IN_PRODUCTION_BANK',
      message: 'Retired questions require explicit archival inclusion.',
      questionId: question.id,
      path: 'reviewStatus',
    });
  }

  validateOptionEntries(question, diagnostics);
  switch (question.format) {
    case 'single_best_answer':
      validateSingleBestAnswer(question, diagnostics);
      break;
    case 'multiple_response':
      validateMultipleResponse(question, diagnostics);
      break;
    case 'ordering':
      validateOrdering(question, diagnostics);
      break;
    case 'matching':
      validateMatching(question, diagnostics);
      break;
    case 'extended_matching':
      validateExtendedMatching(question, diagnostics);
      break;
    case 'image_hotspot':
      validateHotspot(question, diagnostics);
      break;
    case 'image_label':
      validateImageLabels(question, diagnostics);
      break;
    case 'short_answer':
      validateShortAnswer(question, diagnostics);
      break;
    case 'open_response':
      break;
  }
}

export function validateQuestionBank(
  input: unknown,
  options: QuestionBankValidationOptions = {},
): QuestionBankValidationResult {
  const parsed = questionBankSchema.safeParse(input);
  if (!parsed.success) {
    return {
      diagnostics: parsed.error.issues.map((issue) => {
        const lastPath = issue.path.at(-1);
        const code = lastPath === 'schemaVersion'
          ? 'INVALID_VERSION'
          : lastPath === 'format'
            ? 'UNSUPPORTED_FORMAT'
            : 'INVALID_SCHEMA';
        return {
          severity: 'error',
          code,
          message: issue.message,
          path: issue.path.join('.'),
        };
      }),
    };
  }

  const bank = parsed.data;
  const diagnostics: Diagnostic[] = [];
  addDuplicateDiagnostics(
    bank.courseIds,
    'DUPLICATE_COURSE_ID',
    'course ID',
    diagnostics,
  );
  addDuplicateDiagnostics(
    bank.questions.map((question) => question.id),
    'DUPLICATE_QUESTION_ID',
    'question ID',
    diagnostics,
  );
  addDuplicateDiagnostics(
    bank.objectives.map((objective) => objective.id),
    'DUPLICATE_OBJECTIVE_ID',
    'objective ID',
    diagnostics,
  );
  addDuplicateDiagnostics(
    bank.sources.map((source) => source.id),
    'DUPLICATE_SOURCE_ID',
    'source ID',
    diagnostics,
  );

  const objectiveLookup = new Map(
    bank.objectives.map((objective) => [objective.id, objective]),
  );
  const sourceLookup = new Map(bank.sources.map((source) => [source.id, source]));
  bank.objectives.forEach((objective) => {
    if (!bank.courseIds.includes(objective.courseId)) {
      diagnostics.push({
        severity: 'error',
        code: 'OBJECTIVE_COURSE_NOT_IN_BANK',
        message: `Objective course "${objective.courseId}" is not declared by the bank.`,
        path: `objectives.${objective.id}.courseId`,
      });
    }
    addDuplicateDiagnostics(
      objective.sourceIds,
      'DUPLICATE_OBJECTIVE_SOURCE_ID',
      'objective source ID',
      diagnostics,
    );
    objective.sourceIds.forEach((sourceId, index) => {
      if (!sourceLookup.has(sourceId)) {
        diagnostics.push({
          severity: 'error',
          code: 'MISSING_SOURCE_REFERENCE',
          message: `Objective source "${sourceId}" is not present in the bank source registry.`,
          path: `objectives.${objective.id}.sourceIds[${index}]`,
        });
      }
    });
  });

  bank.questions.forEach((question) => {
    validateQuestion(question, bank, objectiveLookup, sourceLookup, diagnostics, options);
  });

  return { bank, diagnostics };
}
