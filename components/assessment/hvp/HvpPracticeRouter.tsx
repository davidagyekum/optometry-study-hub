'use client';

import type { Dispatch, SetStateAction } from 'react';
import { ControlledAssessmentSession } from '@/components/assessment/controlled/ControlledAssessmentSession';
import { HvpPracticeLanding } from '@/components/assessment/hvp/HvpPracticeLanding';
import { HvpPracticeResults } from '@/components/assessment/hvp/HvpPracticeResults';
import { HvpPracticeUnavailable } from '@/components/assessment/hvp/HvpPracticeUnavailable';
import { HvpPracticeWarning } from '@/components/assessment/hvp/HvpPracticeWarning';
import type { GoToRoute } from '@/hooks/useClientRoute';
import { useHvpCuratedPractice } from '@/hooks/useHvpCuratedPractice';
import { HVP_CURATED_PRACTICE_ID } from '@/lib/assessment/hvp/config';
import {
  HVP_WRITTEN_BLUEPRINT_ID,
  HVP_WRITTEN_PRACTICE_ID,
} from '@/lib/assessment/hvp/practiceBlueprint';
import type { ClientView } from '@/lib/navigation/clientRoute';
import type { StoreV2 } from '@/lib/storage/schemas';

export function HvpPracticeRouter({
  view,
  resourceId,
  store,
  setStore,
  go,
}: {
  view: ClientView;
  resourceId: string;
  store: StoreV2;
  setStore: Dispatch<SetStateAction<StoreV2>>;
  go: GoToRoute;
}) {
  const practice = useHvpCuratedPractice({ store, setStore, go });
  if (!practice.registry) return <HvpPracticeUnavailable go={go} />;

  if (view === 'practice') {
    if (
      resourceId !== HVP_CURATED_PRACTICE_ID
      && resourceId !== HVP_WRITTEN_PRACTICE_ID
    ) return <HvpPracticeUnavailable go={go} />;
    return (
      <HvpPracticeLanding
        attemptSelection={practice.activeAttemptSelection}
        availability={practice.availability}
        go={go}
        latestResult={practice.latestResult}
        latestWrittenResult={practice.latestWrittenResult}
        onDiscardCandidates={practice.discardCandidates}
        onReplaceCandidates={practice.replaceCandidates}
        onStart={practice.start}
      />
    );
  }
  if (view === 'assessment') {
    const attemptSelection = practice.getAttemptSelection(resourceId);
    const candidate = attemptSelection.candidates[0];
    const written = candidate?.blueprintId === HVP_WRITTEN_BLUEPRINT_ID;
    return (
      <ControlledAssessmentSession
        attemptSelection={attemptSelection}
        experience={{
          warning: <HvpPracticeWarning />,
          landingView: 'practice',
          landingResourceId: HVP_CURATED_PRACTICE_ID,
          experienceName: written ? 'written practice' : 'curated practice',
          contextDescription: written
            ? 'Your response is saved locally and requires self-review against the rubric after submission.'
            : 'Draft slide-aligned practice question. Correctness is shown only after submission.',
        }}
        go={go}
        onClear={practice.clearDraft}
        onDiscard={practice.discard}
        onMove={practice.moveTo}
        onReplace={(candidateIds) => practice.replaceCandidates(
          candidateIds,
          written
            ? { profileId: 'written', requestedCount: 2 }
            : { profileId: 'full', strategy: 'mixed', requestedCount: 50 },
        )}
        onSubmit={practice.submit}
        onToggleFlag={practice.toggleFlag}
        onUpdateDraft={practice.updateDraft}
        registry={practice.registry}
      />
    );
  }
  if (view === 'assessment-result') {
    return (
      <HvpPracticeResults
        go={go}
        registry={practice.registry}
        resultResult={practice.getResult(resourceId)}
      />
    );
  }
  return <HvpPracticeUnavailable go={go} />;
}
