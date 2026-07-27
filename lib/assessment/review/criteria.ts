import type { QuestionFormat } from '@/lib/assessment/types';
import type { ReviewCriterion } from './types';

export const OVERALL_CONTENT_VALIDITY: ReviewCriterion = {
  id: 'overall-content-validity',
  label: 'Overall content validity',
  description: 'Considering the complete evidence, the item is a valid measure of its declared objective.',
};
export const UNIVERSAL_CRITERIA: ReviewCriterion[] = [
  OVERALL_CONTENT_VALIDITY,
  { id: 'relevance', label: 'Relevance', description: 'The item is relevant to its declared objective and module.' },
  { id: 'factual-accuracy', label: 'Factual accuracy', description: 'The medical content is accurate and appropriately qualified.' },
  { id: 'clarity', label: 'Clarity', description: 'The task is clear without avoidable ambiguity.' },
  { id: 'objective-alignment', label: 'Objective alignment', description: 'The task directly assesses the declared objective.' },
  { id: 'bloom-alignment', label: 'Bloom alignment', description: 'The cognitive operation matches the Bloom metadata.' },
  { id: 'source-traceability', label: 'Source traceability', description: 'Claims can be checked against the listed source locators.' },
];
export const FORMAT_CRITERIA: ReviewCriterion[] = [
  { id: 'distractor-quality', label: 'Distractor quality', description: 'Distractors are plausible, homogeneous, and diagnostically useful.' },
  { id: 'rationale-quality', label: 'Rationale quality', description: 'Rationales explain the distinction and diagnostic value.' },
  { id: 'component-independence', label: 'Component independence', description: 'Components test meaningful, independently scorable decisions.' },
  { id: 'image-accessibility', label: 'Image accessibility', description: 'Alternative and interaction text support access without revealing answers.' },
  { id: 'image-coordinate-accuracy', label: 'Image coordinate accuracy', description: 'Targets use normalized coordinates from 0 to 1 and remain accurate across supported image sizes.' },
  { id: 'image-rights', label: 'Image rights', description: 'The image has documented reuse rights or course ownership.' },
  { id: 'rubric-quality', label: 'Rubric quality', description: 'The rubric defines observable, relevant evidence.' },
];
export const REVIEW_CRITERIA = [...UNIVERSAL_CRITERIA, ...FORMAT_CRITERIA];
const optionFormats = new Set<QuestionFormat>(['single_best_answer', 'multiple_response', 'matching', 'extended_matching']);
const rationaleFormats = new Set<QuestionFormat>(['single_best_answer', 'multiple_response', 'ordering', 'matching', 'extended_matching', 'image_label']);
const componentFormats = new Set<QuestionFormat>(['multiple_response', 'ordering', 'matching', 'extended_matching', 'image_label']);
const imageFormats = new Set<QuestionFormat>(['image_hotspot', 'image_label']);
export function applicableCriteria(format: QuestionFormat): ReviewCriterion[] {
  const ids = new Set(UNIVERSAL_CRITERIA.map((criterion) => criterion.id));
  if (optionFormats.has(format)) ids.add('distractor-quality');
  if (rationaleFormats.has(format)) ids.add('rationale-quality');
  if (componentFormats.has(format)) ids.add('component-independence');
  if (imageFormats.has(format)) { ids.add('image-accessibility'); ids.add('image-coordinate-accuracy'); ids.add('image-rights'); }
  if (format === 'open_response') ids.add('rubric-quality');
  return REVIEW_CRITERIA.filter((criterion) => ids.has(criterion.id));
}
