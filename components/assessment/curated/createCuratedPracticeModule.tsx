'use client';

import { CuratedDefinitionRouter } from '@/components/assessment/curated/CuratedDefinitionRouter';
import type { CuratedPracticeDefinition } from '@/lib/assessment/curated/definition';
import type {
  CuratedPracticeModule,
  CuratedPracticeRouterProps,
} from '@/lib/assessment/curated/types';

export function createCuratedPracticeModule(
  definition: CuratedPracticeDefinition,
): CuratedPracticeModule {
  function PracticeRouter(props: CuratedPracticeRouterProps) {
    return <CuratedDefinitionRouter definition={definition} {...props} />;
  }
  return { PracticeRouter };
}
