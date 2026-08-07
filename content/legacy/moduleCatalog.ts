import { additionalModules } from '@/content/legacy/additionalModules';
import { hvpDepthColourModules } from '@/content/legacy/hvpDepthColourModules';
import { opt370Modules } from '@/content/legacy/opt370Modules';
import { opt376Modules } from '@/content/legacy/opt376Modules';
import { isHvpDepthColourExpansionEnabled } from '@/lib/assessment/hvp-depth-colour/config';
import type { Module } from '@/lib/legacy/types';

export const modules: Module[] = [
  ...additionalModules,
  ...(isHvpDepthColourExpansionEnabled() ? hvpDepthColourModules : []),
  ...opt376Modules,
  ...opt370Modules,
];

export const moduleMap = new Map(modules.map((module) => [module.id, module]));
