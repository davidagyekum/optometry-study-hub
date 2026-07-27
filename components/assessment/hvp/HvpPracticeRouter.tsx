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
    if (resourceId !== HVP_CURATED_PRACTICE_ID) {
      return <HvpPracticeUnavailable go={go} />;
    }
    return (
      <HvpPracticeLanding
        attemptSelection={practice.activeAttemptSelection}
        go={go}
        latestResult={practice.latestResult}
        onDiscardCandidates={practice.discardCandidates}
        onReplaceCandidates={practice.replaceCandidates}
        onRestart={() => {
          if (window.confirm('Restart with a different 50-question set?')) {
            return practice.start(true);
          }
          return practice.activeAttemptSelection.compatibleAttempt
            ? {
              ok: true as const,
              value: practice.activeAttemptSelection.compatibleAttempt,
            }
            : practice.start();
        }}
        onStart={practice.start}
      />
    );
  }
  if (view === 'assessment') {
    return (
      <ControlledAssessmentSession
        attemptSelection={practice.getAttemptSelection(resourceId)}
        experience={{
          warning: <HvpPracticeWarning />,
          landingView: 'practice',
          landingResourceId: HVP_CURATED_PRACTICE_ID,
          experienceName: 'curated practice',
          contextDescription: 'Draft slide-aligned practice question. Correctness is shown only after submission.',
        }}
        go={go}
        onClear={practice.clearDraft}
        onDiscard={practice.discard}
        onMove={practice.moveTo}
        onReplace={practice.replaceCandidates}
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
