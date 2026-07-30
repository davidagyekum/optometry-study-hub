import rawBank from './bank.json';
import { questionBankSchema } from '@/lib/assessment/schemas';

/**
 * Canonical OPT 376 Blood Supply to the Eye candidate bank.
 *
 * Every item remains draft pending genuine independent expert review.
 */
export const bloodSupplyCandidateBank = questionBankSchema.parse(rawBank);