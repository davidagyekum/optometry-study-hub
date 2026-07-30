import rawBank from './bank.json';
import { questionBankSchema } from '@/lib/assessment/schemas';

/**
 * Canonical OPT 376 Ocular Adnexa and Lacrimal Apparatus candidate bank.
 *
 * Every item remains draft pending genuine independent expert review.
 */
export const ocularAdnexaCandidateBank = questionBankSchema.parse(rawBank);
