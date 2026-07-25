import type { Fact, Module, Question } from '@/lib/legacy/types';

const questionCache = new Map<string, Question[]>();

/**
 * Legacy compatibility only. This positional distractor generator is
 * intentionally preserved during the behaviour-neutral refactor and must not
 * be used for the new assessment schema.
 */
export function questionsFor(module: Module): Question[] {
  const cached = questionCache.get(module.id);
  if (cached) return cached;

  const groups = new Map<string, Fact[]>();
  module.facts.forEach((fact) => {
    const key = `${fact.section}:${fact.group ?? 'answer'}`;
    groups.set(key, [...(groups.get(key) ?? []), fact]);
  });

  const questions = module.facts.map((fact, index) => {
    const key = `${fact.section}:${fact.group ?? 'answer'}`;
    const peers = (groups.get(key) ?? module.facts).filter((item) => item.a !== fact.a);
    const fallback = module.facts.filter((item) => item.a !== fact.a && (!fact.group || item.group === fact.group));
    const pool = peers.length >= 3 ? peers : fallback;
    const distractors = [1, 2, 3].map((offset) => pool[(index + offset) % pool.length].a);
    const sectionData = module.sections.find((item) => item.id === fact.section)!;
    return {
      id: `${module.id}-${index + 1}`,
      prompt: fact.q,
      options: [fact.a, ...distractors],
      correct: fact.a,
      explanation: `${fact.a}. ${sectionData.summary}`,
      sectionId: fact.section,
    };
  });

  questionCache.set(module.id, questions);
  return questions;
}
