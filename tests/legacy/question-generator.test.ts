import { describe, expect, it } from 'vitest';
import { modules } from '@/content/legacy/moduleCatalog';
import { questionsFor } from '@/lib/legacy/questionGenerator';

describe('legacy question generator', () => {
  const studyModule = modules[0];

  it('preserves generated IDs and one-question-per-fact order', () => {
    const questions = questionsFor(studyModule);
    expect(questions).toHaveLength(studyModule.facts.length);
    questions.forEach((question, index) => {
      expect(question.id).toBe(`${studyModule.id}-${index + 1}`);
      expect(question.prompt).toBe(studyModule.facts[index].q);
      expect(question.correct).toBe(studyModule.facts[index].a);
      expect(question.sectionId).toBe(studyModule.facts[index].section);
    });
  });

  it('preserves explanation and option construction', () => {
    const firstFact = studyModule.facts[0];
    const section = studyModule.sections.find((item) => item.id === firstFact.section)!;
    const question = questionsFor(studyModule)[0];

    expect(question.options[0]).toBe(firstFact.a);
    expect(question.explanation).toBe(`${firstFact.a}. ${section.summary}`);
    expect(question.options).toHaveLength(4);
  });

  it('returns the cached output without changing it', () => {
    const first = questionsFor(studyModule);
    const second = questionsFor(studyModule);
    expect(second).toBe(first);
    expect(second).toEqual(first);
  });
});
