import { aqueousVitreousPilotBank } from '@/content/question-bank/pilot/bank';

export function makeInvalidQuestionBank() {
  const bank = structuredClone(aqueousVitreousPilotBank);
  bank.questions[1].id = bank.questions[0].id;
  bank.objectives[1].id = bank.objectives[0].id;
  bank.sources[1].id = bank.sources[0].id;

  const singleBestAnswer = bank.questions.find(
    (question) => question.format === 'single_best_answer',
  );
  if (singleBestAnswer) {
    singleBestAnswer.correctOptionId = 'missing-correct-option';
    singleBestAnswer.options[1].id = singleBestAnswer.options[0].id;
    singleBestAnswer.options[1].text = singleBestAnswer.options[0].text;
    singleBestAnswer.options[0].rationale = undefined;
    singleBestAnswer.reviewStatus = 'reviewed';
    singleBestAnswer.reviewer = undefined;
    singleBestAnswer.sources = [];
  }

  const multipleResponse = bank.questions.find(
    (question) => question.format === 'multiple_response',
  );
  if (multipleResponse) {
    multipleResponse.objectiveId = 'missing-objective';
    multipleResponse.sources[0].id = 'missing-source';
    multipleResponse.correctOptionIds.push('missing-correct-option');
    multipleResponse.minimumSelections = 5;
    multipleResponse.maximumSelections = 4;
  }

  const ordering = bank.questions.find((question) => question.format === 'ordering');
  if (ordering) {
    ordering.correctOrder = ordering.correctOrder.slice(0, -1);
    ordering.reviewStatus = 'retired';
  }

  const matching = bank.questions.find((question) => question.format === 'matching');
  if (matching) {
    matching.correctMatches = {
      ...matching.correctMatches,
      'missing-prompt': 'missing-choice',
    };
  }

  const hotspot = bank.questions.find((question) => question.format === 'image_hotspot');
  if (hotspot) {
    hotspot.regions[0].x = 0.95;
    hotspot.regions[0].width = 0.2;
    hotspot.correctRegionIds = ['missing-region'];
  }

  const imageLabel = bank.questions.find((question) => question.format === 'image_label');
  if (imageLabel) {
    imageLabel.targets[0].x = 2;
    imageLabel.correctLabels = { 'missing-target': 'missing-label' };
  }

  const emptyText = bank.questions.find((question) => question.format === 'matching');
  if (emptyText) {
    emptyText.stem = '   ';
    emptyText.explanation = '';
  }

  bank.sources[1].id = bank.sources[0].id;

  return bank;
}
