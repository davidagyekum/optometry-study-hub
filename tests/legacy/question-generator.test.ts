import { describe, expect, it } from 'vitest';
import { modules } from '@/content/legacy/moduleCatalog';
import { questionsFor } from '@/lib/legacy/questionGenerator';

describe('legacy question generator', () => {
  for (const studyModule of modules) {
    describe(studyModule.id, () => {
      it('preserves every fact and generated question field', () => {
        const questions = questionsFor(studyModule);
        expect(questions).toHaveLength(studyModule.facts.length);

        questions.forEach((question, index) => {
          const fact = studyModule.facts[index];
          const section = studyModule.sections.find((item) => item.id === fact.section)!;

          expect(question.id).toBe(`${studyModule.id}-${index + 1}`);
          expect(question.prompt).toBe(fact.q);
          expect(question.correct).toBe(fact.a);
          expect(question.sectionId).toBe(fact.section);
          expect(question.options[0]).toBe(fact.a);
          expect(question.options).toHaveLength(4);
          expect(question.explanation).toBe(`${fact.a}. ${section.summary}`);
        });
      });

      it('returns the same cached array reference', () => {
        const questions = questionsFor(studyModule);
        expect(questionsFor(studyModule)).toBe(questions);
      });
    });
  }
});
