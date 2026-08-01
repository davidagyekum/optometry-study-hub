import { resolveNotesV2 } from '@/content/notes-v2/catalog';
import { studyModuleContentV3Schema } from '@/content/notes-v3/schema';
import type { NotesResolution, StudyModuleContentV3 } from '@/content/notes-v3/types';
import type { Module } from '@/lib/legacy/types';

const authoredModuleIds = new Set(['environmental-vision', 'autonomic-pharmacology']);

export function hasAuthoredNotesV3(moduleId: string): boolean {
  return authoredModuleIds.has(moduleId);
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

export async function loadNotes(module: Module): Promise<NotesResolution> {
  try {
    if (module.id === 'environmental-vision') {
      const { environmentalVisionNotesV3 } = await import('@/content/notes-v3/modules/environmental-vision');
      return resolveNotes(module, environmentalVisionNotesV3);
    }
    if (module.id === 'autonomic-pharmacology') {
      const { autonomicPharmacologyNotesV3 } = await import('@/content/notes-v3/modules/autonomic-pharmacology');
      return resolveNotes(module, autonomicPharmacologyNotesV3);
    }
  } catch {
    const fallback = resolveNotesV2(module);
    return fallback.kind === 'v2'
      ? { kind: 'v2', content: fallback.content, reason: 'Authored notes could not be loaded. The structured Notes V2 version is shown instead.' }
      : fallback;
  }
  return resolveNotesV2(module);
}

export function notesReadingPercentage(
  content: Pick<StudyModuleContentV3, 'sections'> | { sections: Array<{ id: string }>; legacySupplementalSections?: Array<{ id: string }> },
  read: readonly string[],
): number {
  const ids = [
    ...content.sections,
    ...('legacySupplementalSections' in content ? content.legacySupplementalSections ?? [] : []),
  ].map((section) => section.id);
  const completed = ids.filter((id) => read.includes(id)).length;
  return ids.length === 0 ? 0 : Math.round((completed / ids.length) * 100);
}
