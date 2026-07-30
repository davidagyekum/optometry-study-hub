import rawBank from './bank.json';
import { questionBankSchema } from '@/lib/assessment/schemas';

/**
 * Canonical OPT 376 Tissue Foundations candidate bank.
 *
 * bank.json is retained byte-for-byte from the supplied, independently
 * checksummed content package. Parsing makes repository schema failures
 * explicit without rewriting authored content.
 */
export const tissueFoundationsCandidateBank = questionBankSchema.parse(rawBank);
