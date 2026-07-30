'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { CuratedPracticeUnavailable } from '@/components/assessment/curated/CuratedPracticeUnavailable';
import {
  curatedExperienceRegistry,
  isCuratedExperienceEnabled,
} from '@/lib/assessment/curated/experienceRegistry';
import { loadCuratedPracticeModule } from '@/lib/assessment/curated/loaders';
import {
  resolveCuratedExperienceForControlledRoute,
} from '@/lib/assessment/curated/resolveExperience';
import type {
  CuratedExperienceAdapter,
  CuratedPracticeRouterProps,
} from '@/lib/assessment/curated/types';

function CuratedPracticeAdapterHost({
  adapter,
  props,
}: {
  adapter: CuratedExperienceAdapter;
  props: CuratedPracticeRouterProps;
}) {
  const [PracticeComponent, setPracticeComponent] = useState<
    ComponentType<CuratedPracticeRouterProps> | null
  >(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadCuratedPracticeModule(adapter)
      .then((loadedModule) => {
        if (active) setPracticeComponent(() => loadedModule.PracticeRouter);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [adapter]);

  if (failed) {
    return <CuratedPracticeUnavailable go={props.go} summary={adapter.summary} />;
  }
  if (!PracticeComponent) {
    return <div className="pilot-loading" role="status">Loading curated practice…</div>;
  }
  return <PracticeComponent {...props} />;
}

export function CuratedPracticeRouter({
  registry = curatedExperienceRegistry,
  ...props
}: CuratedPracticeRouterProps & {
  registry?: readonly CuratedExperienceAdapter[];
}) {
  const snapshot = props.view === 'assessment'
    ? props.store.assessment.activeAttempts[props.resourceId]
    : props.view === 'assessment-result'
      ? props.store.assessment.results[props.resourceId]
      : undefined;
  const adapter = resolveCuratedExperienceForControlledRoute(
    props.view,
    props.resourceId,
    snapshot?.blueprintId,
    registry,
  );
  if (!adapter || !isCuratedExperienceEnabled(adapter)) {
    return (
      <CuratedPracticeUnavailable
        go={props.go}
        summary={adapter?.summary}
      />
    );
  }
  return (
    <CuratedPracticeAdapterHost
      adapter={adapter}
      key={adapter.summary.experienceId}
      props={props}
    />
  );
}
