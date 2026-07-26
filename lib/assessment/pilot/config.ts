export const AQUEOUS_PILOT_ID = 'aqueous-vitreous';
export const AQUEOUS_PILOT_BLUEPRINT_ID = 'aqueous-vitreous-pilot-v1';

export function isAssessmentPilotEnabled(
  rawValue = process.env.NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT,
): boolean {
  return rawValue === 'true';
}
