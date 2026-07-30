import { CuratedPracticeResults } from '@/components/assessment/curated/CuratedPracticeResults';
import type { GoToRoute } from '@/hooks/useClientRoute';
import { hvpPracticeDefinition } from '@/lib/assessment/hvp/definition';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';
import type { SessionResult } from '@/lib/assessment/session/types';
import type { AssessmentResultSnapshot } from '@/lib/storage/schemas';

export function HvpPracticeResults(props: {
  resultResult: SessionResult<AssessmentResultSnapshot>;
  registry: QuestionRegistry;
  go: GoToRoute;
}) {
  return <CuratedPracticeResults definition={hvpPracticeDefinition} {...props} />;
}
