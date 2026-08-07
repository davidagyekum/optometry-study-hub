import bankData from './bank.json';
import { learningObjectiveSchema } from '@/lib/assessment/schemas';

export const objectives = bankData.objectives.map((objective) => learningObjectiveSchema.parse(objective));
