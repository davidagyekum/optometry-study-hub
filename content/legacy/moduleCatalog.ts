import { additionalModules } from '@/content/legacy/additionalModules';
import { opt376Modules } from '@/content/legacy/opt376Modules';
import type { Module } from '@/lib/legacy/types';

export const modules: Module[] = [...additionalModules, ...opt376Modules];

export const moduleMap = new Map(modules.map((module) => [module.id, module]));
