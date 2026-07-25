export const BLOOM_LEVELS = [
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
] as const;

export const DIFFICULTIES = ['foundation', 'intermediate', 'advanced'] as const;

export const REVIEW_STATUSES = ['draft', 'reviewed', 'approved', 'retired'] as const;

export const QUESTION_FORMATS = [
  'single_best_answer',
  'multiple_response',
  'ordering',
  'matching',
  'extended_matching',
  'image_hotspot',
  'image_label',
  'short_answer',
  'open_response',
] as const;

export const STIMULUS_TYPES = [
  'text',
  'diagram',
  'table',
  'clinical_vignette',
  'pathway',
  'comparison',
  'error_analysis',
] as const;

export const SOURCE_KINDS = [
  'lecture',
  'textbook',
  'guideline',
  'journal',
  'website',
  'image',
  'other',
] as const;

export const STABLE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
