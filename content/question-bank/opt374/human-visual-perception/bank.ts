import rawBank from './bank.json';
import { questionBankSchema } from '@/lib/assessment/schemas';

/**
 * Canonical OPT 374 slide-aligned candidate bank.
 *
 * The JSON file is copied byte-for-byte from the supplied content package.
 * Parsing here keeps schema failures explicit without rewriting authored data.
 */
export const humanVisualPerceptionCandidateBank = questionBankSchema.parse(rawBank);
