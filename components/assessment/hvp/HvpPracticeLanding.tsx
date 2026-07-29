import { CuratedPracticeLanding } from '@/components/assessment/curated/CuratedPracticeLanding';
import type {
  CuratedAttemptSelection,
  CuratedAvailability,
  CuratedPracticeRequest,
} from '@/lib/assessment/curated/definition';
import type { GoToRoute } from '@/hooks/useClientRoute';
import { hvpPracticeDefinition } from '@/lib/assessment/hvp/definition';
import type { SessionResult } from '@/lib/assessment/session/types';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
} from '@/lib/storage/schemas';

export function HvpPracticeLanding(props: {
  attemptSelection: CuratedAttemptSelection;
  latestResult?: AssessmentResultSnapshot;
  latestWrittenResult?: AssessmentResultSnapshot;
  availability: CuratedAvailability;
  go: GoToRoute;
  onStart: (request?: CuratedPracticeRequest) => SessionResult<AssessmentAttemptSnapshot>;
  onDiscardCandidates: (candidateIds: string[]) => SessionResult<unknown>;
  onReplaceCandidates: (
    candidateIds: string[],
    request?: CuratedPracticeRequest,
  ) => SessionResult<AssessmentAttemptSnapshot>;
}) {
  return <CuratedPracticeLanding definition={hvpPracticeDefinition} {...props} />;
}
