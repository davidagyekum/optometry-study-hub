'use client';

import type { Dispatch, SetStateAction } from 'react';
import { ControlledAssessmentSession } from '@/components/assessment/controlled/ControlledAssessmentSession';
import { CuratedPracticeLanding } from '@/components/assessment/curated/CuratedPracticeLanding';
import { CuratedPracticeResults } from '@/components/assessment/curated/CuratedPracticeResults';
import { CuratedPracticeUnavailable } from '@/components/assessment/curated/CuratedPracticeUnavailable';
import type { CuratedPracticeDefinition } from '@/lib/assessment/curated/definition';
import { useCuratedPracticeController } from '@/hooks/useCuratedPracticeController';
import type { GoToRoute } from '@/hooks/useClientRoute';
import type { ClientView } from '@/lib/navigation/clientRoute';
import type { StoreV2 } from '@/lib/storage/schemas';

export function CuratedDefinitionRouter({
  definition,
  view,
  resourceId,
  store,
  setStore,
  go,
}: {
  definition: CuratedPracticeDefinition;
  view: ClientView;
  resourceId: string;
  store: StoreV2;
  setStore: Dispatch<SetStateAction<StoreV2>>;
  go: GoToRoute;
}) {
  const practice = useCuratedPracticeController({ definition, store, setStore, go });
  if (!practice.registry) {
    return <CuratedPracticeUnavailable go={go} summary={definition.summary} />;
  }
  if (view === 'practice') {
    if (resourceId !== definition.summary.routeSegment) {
      return <CuratedPracticeUnavailable go={go} summary={definition.summary} />;
    }
    return (
      <CuratedPracticeLanding
        attemptSelection={practice.activeAttemptSelection}
        availability={practice.availability}
        definition={definition}
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
    const written = candidate?.blueprintId === definition.writtenBlueprintId;
    const Status = definition.learner.statusComponent;
    return (
      <ControlledAssessmentSession
        attemptSelection={attemptSelection}
        experience={{
          warning: <Status />,
          landingView: 'practice',
          landingResourceId: definition.summary.routeSegment,
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
          definition.replacementRequest(candidate),
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
      <CuratedPracticeResults
        definition={definition}
        go={go}
        registry={practice.registry}
        resultResult={practice.getResult(resourceId)}
      />
    );
  }
  return <CuratedPracticeUnavailable go={go} summary={definition.summary} />;
}
