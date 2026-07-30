'use client';

import { useEffect, useState, type ComponentType } from 'react';
import {
  curatedExperienceRegistry,
  isCuratedExperienceEnabled,
} from '@/lib/assessment/curated/experienceRegistry';
import { loadCuratedProgressModule } from '@/lib/assessment/curated/loaders';
import { resolveCuratedExperienceById } from '@/lib/assessment/curated/resolveExperience';
import type {
  CuratedExperienceAdapter,
  CuratedProgressPanelProps,
} from '@/lib/assessment/curated/types';

function CuratedProgressAdapterHost({
  adapter,
  fallbackLabel,
  props,
}: {
  adapter: CuratedExperienceAdapter;
  fallbackLabel: string;
  props: CuratedProgressPanelProps;
}) {
  const [ProgressComponent, setProgressComponent] = useState<
    ComponentType<CuratedProgressPanelProps> | null
  >(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const pending = loadCuratedProgressModule(adapter);
    pending.then((loadedModule) => {
        if (active) setProgressComponent(() => loadedModule.ProgressPanel);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [adapter]);

  if (failed) {
    return <p className="integrity-note" role="alert">Curated progress is temporarily unavailable.</p>;
  }
  if (!ProgressComponent) {
    return <div className="analytics-loading" role="status">{fallbackLabel}</div>;
  }
  return <ProgressComponent {...props} />;
}

export function CuratedProgressPanel({
  experienceId,
  registry = curatedExperienceRegistry,
  fallbackLabel = 'Loading curated progress…',
  ...props
}: CuratedProgressPanelProps & {
  experienceId: string;
  fallbackLabel?: string;
  registry?: readonly CuratedExperienceAdapter[];
}) {
  const adapter = resolveCuratedExperienceById(experienceId, registry);
  if (
    !adapter?.loadProgressModule
    || !isCuratedExperienceEnabled(adapter)
  ) return null;
  return (
    <CuratedProgressAdapterHost
      adapter={adapter}
      fallbackLabel={fallbackLabel}
      key={adapter.summary.experienceId}
      props={props}
    />
  );
}
