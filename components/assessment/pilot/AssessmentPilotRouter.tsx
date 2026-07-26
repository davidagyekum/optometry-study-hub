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
        activeAttempt={pilot.activeAttempt}
        go={go}
        latestResult={pilot.latestResult}
        onRestart={() => {
          if (window.confirm('Restart the pilot? Your active pilot work will be cleared.')) {
            pilot.start(true);
          }
        }}
        onStart={() => pilot.start()}
      />
    );
  }
  if (view === 'assessment') {
    return (
      <AssessmentPilotSession
        attemptResult={pilot.getAttempt(resourceId)}
        go={go}
        onClear={pilot.clearDraft}
        onDiscard={pilot.discard}
        onMove={pilot.moveTo}
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
