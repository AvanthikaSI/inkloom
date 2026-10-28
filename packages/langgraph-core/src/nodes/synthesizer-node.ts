import { BrandAuditStateType } from '../state.js';
import { ViolationItem } from '@inkloom/shared';

export async function synthesizerNode(state: BrandAuditStateType): Promise<Partial<BrandAuditStateType>> {
  const combined: ViolationItem[] = [
    ...(state.linterViolations || []),
    ...(state.toneViolations || []),
    ...(state.factViolations || []),
    ...(state.visualViolations || [])
  ];

  // Deduplicate by violatingExcerpt
  const seen = new Set<string>();
  const uniqueViolations: ViolationItem[] = [];

  for (const v of combined) {
    const key = `${v.category}:${v.violatingExcerpt.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueViolations.push(v);
    }
  }

  return { allViolations: uniqueViolations };
}
