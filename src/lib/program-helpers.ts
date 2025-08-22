export type Split = 'PPL' | 'ULF' | 'FULLx3';
export type SplitDay = 'PUSH' | 'PULL' | 'LEGS' | 'UPPER' | 'LOWER' | 'FULL';

export function chooseSplit(user: { age_range?: string; limitations?: string | null }): Split {
  if (user?.age_range?.includes('56+') || user?.limitations) return 'ULF';
  return 'PPL';
}

export function getSplitDays(split: Split): SplitDay[] {
  if (split === 'PPL') return ['PUSH', 'PULL', 'LEGS'];
  if (split === 'ULF') return ['UPPER', 'LOWER', 'FULL'];
  return ['FULL', 'FULL', 'FULL'];
}