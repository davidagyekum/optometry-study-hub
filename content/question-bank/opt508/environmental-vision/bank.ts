import rawBank from './bank.json';
import { questionBankSchema } from '@/lib/assessment/schemas';

/**
 * Canonical OPT 508 Environmental Vision candidate bank.
 *
 * Every item remains draft pending genuine independent expert review.
 */
export const environmentalVisionCandidateBank = questionBankSchema.parse(rawBank);
