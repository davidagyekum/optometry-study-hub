'use client';

import { PilotWarning } from '@/components/assessment/pilot/PilotWarning';
import {
  ControlledAssessmentSession,
  type ControlledAssessmentSessionProps,
} from '@/components/assessment/controlled/ControlledAssessmentSession';

type PilotSessionProps = Omit<ControlledAssessmentSessionProps, 'experience'>;

export function AssessmentPilotSession(props: PilotSessionProps) {
  return (
    <ControlledAssessmentSession
      {...props}
      experience={{
        warning: <PilotWarning />,
        landingView: 'pilot',
        landingResourceId: 'aqueous-vitreous',
        experienceName: 'pilot',
        contextDescription: 'Draft pilot question. Correctness is shown only after submission.',
      }}
    />
  );
}
