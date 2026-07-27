import { PilotWarning } from '@/components/assessment/pilot/PilotWarning';
import {
  ControlledAssessmentResults,
  type ControlledAssessmentResultsProps,
} from '@/components/assessment/controlled/ControlledAssessmentResults';

type PilotResultsProps = Omit<ControlledAssessmentResultsProps, 'experience'>;

export function AssessmentPilotResults(props: PilotResultsProps) {
  return (
    <ControlledAssessmentResults
      {...props}
      experience={{
        warning: <PilotWarning />,
        landingView: 'pilot',
        landingResourceId: 'aqueous-vitreous',
        experienceName: 'pilot',
        resultTitle: 'Pilot result',
      }}
    />
  );
}
