import rawBank from './bank.json';
import { questionBankSchema } from '@/lib/assessment/schemas';

/**
 * Canonical Autonomic Pharmacology candidate bank.
 *
 * Every item remains draft pending genuine independent expert review.
 */
export const autonomicPharmacologyCandidateBank = questionBankSchema.parse(rawBank);
