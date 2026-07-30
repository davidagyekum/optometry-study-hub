import rawBank from './bank.json';
import { questionBankSchema } from '@/lib/assessment/schemas';

const SYSTEMIC_PATHOLOGY_RUNTIME_ID_REWRITES = {
  'pituitary-tsH-deficiency': 'pituitary-tsh-deficiency',
} as const;

function normalizeRuntimeOptionIds(bank: typeof rawBank): typeof rawBank {
  return {
    ...bank,
    questions: bank.questions.map((question) => ({
      ...question,
      ...('options' in question && Array.isArray(question.options)
        ? {
            options: question.options.map((option) => ({
              ...option,
              id:
                SYSTEMIC_PATHOLOGY_RUNTIME_ID_REWRITES[
                  option.id as keyof typeof SYSTEMIC_PATHOLOGY_RUNTIME_ID_REWRITES
                ] ?? option.id,
            })),
          }
        : {}),
    })),
  } as typeof rawBank;
}

/**
 * Canonical Systemic Pathology candidate bank.
 *
 * The supplied JSON remains byte-for-byte canonical. One option identifier has
 * an uppercase character, so the typed runtime view normalizes that identifier
 * deterministically before schema parsing. Every item remains draft pending
 * genuine independent expert review.
 */
export const systemicPathologyCandidateBank = questionBankSchema.parse(
  normalizeRuntimeOptionIds(rawBank),
);
