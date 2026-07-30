import { describe, expect, it } from 'vitest';
import { controlledExperienceKind } from '@/lib/assessment/routing/controlledExperience';
import { HVP_CURATED_BLUEPRINT_ID } from '@/lib/assessment/hvp/config';
import { HVP_WRITTEN_BLUEPRINT_ID } from '@/lib/assessment/hvp/practiceBlueprint';

describe('controlled assessment experience routing', () => {
  it('routes both scored and written HVP attempts through the HVP feature gate', () => {
    expect(controlledExperienceKind('assessment', HVP_CURATED_BLUEPRINT_ID)).toBe('curated');
    expect(controlledExperienceKind('assessment', HVP_WRITTEN_BLUEPRINT_ID)).toBe('curated');
    expect(controlledExperienceKind('assessment-result', HVP_WRITTEN_BLUEPRINT_ID)).toBe('curated');
  });

  it('keeps the Aqueous pilot and unknown snapshots isolated', () => {
    expect(controlledExperienceKind('pilot')).toBe('aqueous');
    expect(controlledExperienceKind('assessment', 'aqueous-vitreous-pilot-v1')).toBe('aqueous');
    expect(controlledExperienceKind('assessment', 'unrelated-blueprint')).toBe('unknown');
  });
});
