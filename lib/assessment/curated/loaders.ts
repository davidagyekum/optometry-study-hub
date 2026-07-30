import type {
  CuratedExperienceAdapter,
  CuratedPracticeModule,
  CuratedProgressModule,
} from '@/lib/assessment/curated/types';

const practiceCache = new WeakMap<
  CuratedExperienceAdapter,
  Promise<CuratedPracticeModule>
>();
const progressCache = new WeakMap<
  CuratedExperienceAdapter,
  Promise<CuratedProgressModule>
>();

function validPracticeModule(value: unknown): value is CuratedPracticeModule {
  return Boolean(
    value
    && typeof value === 'object'
    && typeof (value as CuratedPracticeModule).PracticeRouter === 'function',
  );
}

function validProgressModule(value: unknown): value is CuratedProgressModule {
  return Boolean(
    value
    && typeof value === 'object'
    && typeof (value as CuratedProgressModule).ProgressPanel === 'function'
    && typeof (value as CuratedProgressModule).getContribution === 'function',
  );
}

export function loadCuratedPracticeModule(
  adapter: CuratedExperienceAdapter,
): Promise<CuratedPracticeModule> {
  const cached = practiceCache.get(adapter);
  if (cached) return cached;
  const pending = adapter.loadPracticeModule().then((loaded) => {
    if (!validPracticeModule(loaded)) {
      throw new Error('CURATED_PRACTICE_MODULE_INVALID');
    }
    return loaded;
  }).catch((error: unknown) => {
    practiceCache.delete(adapter);
    throw error;
  });
  practiceCache.set(adapter, pending);
  return pending;
}

export function loadCuratedProgressModule(
  adapter: CuratedExperienceAdapter,
): Promise<CuratedProgressModule> {
  if (!adapter.loadProgressModule) {
    return Promise.reject(new Error('CURATED_PROGRESS_MODULE_MISSING'));
  }
  const cached = progressCache.get(adapter);
  if (cached) return cached;
  const pending = adapter.loadProgressModule().then((loaded) => {
    if (!validProgressModule(loaded)) {
      throw new Error('CURATED_PROGRESS_MODULE_INVALID');
    }
    return loaded;
  }).catch((error: unknown) => {
    progressCache.delete(adapter);
    throw error;
  });
  progressCache.set(adapter, pending);
  return pending;
}
