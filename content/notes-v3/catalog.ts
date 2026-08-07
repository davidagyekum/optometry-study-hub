import { resolveNotesV2 } from '@/content/notes-v2/catalog';
import { studyModuleContentV3Schema } from '@/content/notes-v3/schema';
import type { NotesResolution, StudyModuleContentV3 } from '@/content/notes-v3/types';
import type { Module } from '@/lib/legacy/types';

type AuthoredNotesLoader = () => Promise<StudyModuleContentV3>;

const authoredNotesLoaders = {
  'environmental-vision': async () =>
    (await import('@/content/notes-v3/modules/environmental-vision')).environmentalVisionNotesV3,
  'autonomic-pharmacology': async () =>
    (await import('@/content/notes-v3/modules/autonomic-pharmacology')).autonomicPharmacologyNotesV3,
  'tissue-foundations': async () =>
    (await import('@/content/notes-v3/modules/tissue-foundations')).tissueFoundationsNotesV3,
  'ocular-adnexa': async () =>
    (await import('@/content/notes-v3/modules/ocular-adnexa')).ocularAdnexaNotesV3,
  'aqueous-vitreous': async () =>
    (await import('@/content/notes-v3/modules/aqueous-vitreous')).aqueousVitreousNotesV3,
  'blood-supply': async () =>
    (await import('@/content/notes-v3/modules/blood-supply')).bloodSupplyNotesV3,
  'human-visual-perception': async () =>
    (await import('@/content/notes-v3/modules/human-visual-perception')).humanVisualPerceptionNotesV3,
  'systemic-pathology': async () =>
    (await import('@/content/notes-v3/modules/systemic-pathology')).systemicPathologyNotesV3,
  'schematic-eye-refractive-states': async () =>
    (await import('@/content/notes-v3/modules/schematic-eye-refractive-states')).schematicEyeRefractiveStatesNotesV3,
  'multifocal-foundations': async () =>
    (await import('@/content/notes-v3/modules/multifocal-foundations')).multifocalFoundationsNotesV3,
  'progressive-addition-lenses': async () =>
    (await import('@/content/notes-v3/modules/progressive-addition-lenses')).progressiveAdditionLensesNotesV3,
  'pd-and-dispensing': async () =>
    (await import('@/content/notes-v3/modules/pd-and-dispensing')).pdAndDispensingNotesV3,
  'special-lenses': async () =>
    (await import('@/content/notes-v3/modules/special-lenses')).specialLensesNotesV3,
} satisfies Record<string, AuthoredNotesLoader>;

export function hasAuthoredNotesV3(moduleId: string): boolean {
  return Object.hasOwn(authoredNotesLoaders, moduleId);
}

export function resolveNotes(
  module: Module,
  candidate?: unknown,
): NotesResolution {
  if (candidate !== undefined) {
    const parsed = studyModuleContentV3Schema.safeParse(candidate);
    if (
      parsed.success
      && parsed.data.moduleId === module.id
      && parsed.data.courseId === module.courseId
    ) {
      return { kind: 'v3', content: parsed.data };
    }

    const fallback = resolveNotesV2(module);
    if (fallback.kind === 'v2') {
      return {
        kind: 'v2',
        content: fallback.content,
        reason: 'Authored notes could not be validated. The structured Notes V2 version is shown instead.',
      };
    }
    return fallback;
  }

  return resolveNotesV2(module);
}

export async function loadNotes(
  module: Module,
  loader: AuthoredNotesLoader | null | undefined = authoredNotesLoaders[
    module.id as keyof typeof authoredNotesLoaders
  ],
): Promise<NotesResolution> {
  if (!loader) return resolveNotesV2(module);

  try {
    return resolveNotes(module, await loader());
  } catch {
    const fallback = resolveNotesV2(module);
    return fallback.kind === 'v2'
      ? { kind: 'v2', content: fallback.content, reason: 'Authored notes could not be loaded. The structured Notes V2 version is shown instead.' }
      : fallback;
  }
}

export function notesReadingPercentage(
  content: { sections: Array<{ id: string }>; legacySupplementalSections?: Array<{ id: string }> },
  read: readonly string[],
): number {
  const ids = [
    ...content.sections,
    ...(content.legacySupplementalSections ?? []),
  ].map((section) => section.id);
  const completed = ids.filter((id) => read.includes(id)).length;
  return ids.length === 0 ? 0 : Math.round((completed / ids.length) * 100);
}
