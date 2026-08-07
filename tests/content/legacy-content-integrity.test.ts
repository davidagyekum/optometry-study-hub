import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { courses } from '@/content/legacy/courseCatalog';
import { moduleMap, modules } from '@/content/legacy/moduleCatalog';
import { questionsFor } from '@/lib/legacy/questionGenerator';

describe('legacy content integrity', () => {
  it('preserves the course, module, section, and question totals', () => {
    expect(courses).toHaveLength(6);
    expect(courses.map((course) => course.id)).toEqual([
      'environmental-vision',
      'human-visual-perception',
      'neuro-anatomy',
      'pharmacology',
      'systemic-pathology',
      'dispensing-optics-ii',
    ]);
    expect(modules).toHaveLength(13);
    expect(modules.map((module) => module.id)).toEqual([
      'environmental-vision',
      'human-visual-perception',
      'tissue-foundations',
      'autonomic-pharmacology',
      'systemic-pathology',
      'ocular-adnexa',
      'aqueous-vitreous',
      'blood-supply',
      'schematic-eye-refractive-states',
      'multifocal-foundations',
      'progressive-addition-lenses',
      'pd-and-dispensing',
      'special-lenses',
    ]);
    expect(modules.reduce((sum, module) => sum + module.sections.length, 0)).toBe(72);
    expect(modules.reduce((sum, module) => sum + questionsFor(module).length, 0)).toBe(400);
    modules.filter((module) => module.facts.length > 0)
      .forEach((module) => expect(questionsFor(module)).toHaveLength(50));
    modules.filter((module) => module.courseId === 'dispensing-optics-ii')
      .forEach((module) => expect(questionsFor(module)).toHaveLength(0));
  });

  it('keeps identifiers and references internally consistent', () => {
    expect(new Set(courses.map((course) => course.id)).size).toBe(courses.length);
    expect(new Set(modules.map((module) => module.id)).size).toBe(modules.length);
    const coursesById = new Map(courses.map((course) => [course.id, course]));

    courses.forEach((course) => {
      course.moduleIds.forEach((moduleId) => expect(moduleMap.has(moduleId)).toBe(true));
    });

    modules.forEach((module) => {
      const course = coursesById.get(module.courseId);
      expect(course).toBeDefined();
      expect(course?.moduleIds).toContain(module.id);
      const sectionIds = new Set(module.sections.map((section) => section.id));
      expect(sectionIds.size).toBe(module.sections.length);
      module.facts.forEach((fact) => expect(sectionIds.has(fact.section)).toBe(true));
      questionsFor(module).forEach((question) => expect(question.options).toHaveLength(4));
    });
  });

  it('resolves every referenced local image under public/', async () => {
    const references = new Set<string>();
    courses.forEach((course) => references.add(course.coverImage.src));
    modules.forEach((module) => {
      references.add(module.coverImage.src);
      module.sections.forEach((section) => references.add(section.image.src));
    });

    const missing: string[] = [];
    for (const reference of [...references].sort()) {
      try {
        await access(resolve(process.cwd(), 'public', reference.slice(1)));
      } catch {
        missing.push(reference);
      }
    }

    expect(missing, `Missing educational image assets:\n${missing.join('\n')}`).toEqual([]);
  });
});
