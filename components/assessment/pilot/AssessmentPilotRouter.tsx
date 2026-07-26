'use client';

import type { Dispatch, SetStateAction } from 'react';
import { AssessmentPilotLanding } from '@/components/assessment/pilot/AssessmentPilotLanding';
import { AssessmentPilotResults } from '@/components/assessment/pilot/AssessmentPilotResults';
import { AssessmentPilotSession } from '@/components/assessment/pilot/AssessmentPilotSession';
import { AssessmentPilotUnavailable } from '@/components/assessment/pilot/AssessmentPilotUnavailable';
import type { GoToRoute } from '@/hooks/useClientRoute';
import { useAssessmentPilot } from '@/hooks/useAssessmentPilot';
import { AQUEOUS_PILOT_ID } from '@/lib/assessment/pilot/config';
import type { ClientView } from '@/lib/navigation/clientRoute';
import type { StoreV2 } from '@/lib/storage/schemas';

export function AssessmentPilotRouter({
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
  const pilot = useAssessmentPilot({ store, setStore, go });
  if (!pilot.registry) return <AssessmentPilotUnavailable go={go} />;

  if (view === 'pilot') {
    if (resourceId !== AQUEOUS_PILOT_ID) return <AssessmentPilotUnavailable go={go} />;
    return (
      <AssessmentPilotLanding
        attemptSelection={pilot.activeAttemptSelection}
        go={go}
        latestResult={pilot.latestResult}
        onDiscardCandidates={pilot.discardPilotCandidates}
        onReplaceCandidates={pilot.replacePilotCandidates}
        onRestart={() => {
          if (window.confirm('Restart the pilot? Your active pilot work will be cleared.')) {
            return pilot.start(true);
          }
          return pilot.activeAttempt
            ? { ok: true as const, value: pilot.activeAttempt }
            : pilot.start();
        }}
        onStart={pilot.start}
      />
    );
  }
  if (view === 'assessment') {
    return (
      <AssessmentPilotSession
        attemptSelection={pilot.getAttemptSelection(resourceId)}
        go={go}
        onClear={pilot.clearDraft}
        onDiscard={pilot.discard}
        onMove={pilot.moveTo}
        onReplace={pilot.replacePilotCandidates}
        onSubmit={pilot.submit}
        onToggleFlag={pilot.toggleFlag}
        onUpdateDraft={pilot.updateDraft}
        registry={pilot.registry}
      />
    );
  }
  if (view === 'assessment-result') {
    return (
      <AssessmentPilotResults
        go={go}
        registry={pilot.registry}
        resultResult={pilot.getResult(resourceId)}
      />
    );
  }
  return <AssessmentPilotUnavailable go={go} />;
}
