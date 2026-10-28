import { BrandAuditStateType } from '../state.js';
import { ViolationItem } from '@inkloom/shared';

export async function visionNode(state: BrandAuditStateType): Promise<Partial<BrandAuditStateType>> {
  const violations: ViolationItem[] = [];
  const visual = state.visualData;

  if (visual) {
    // 1. Check WCAG Contrast Failures
    if (visual.contrastChecks) {
      for (const check of visual.contrastChecks) {
        if (check.status === 'FAIL') {
          violations.push({
            id: `viol_a11y_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            category: 'accessibility',
            severity: 'moderate',
            violatingExcerpt: `Color pair ${check.foreground} on ${check.background}`,
            explanation: `Contrast ratio is ${check.contrast_ratio}:1, failing WCAG 2.1 AA requirement (minimum 4.5:1).`,
            ruleCitation: 'Brand Accessibility Guidelines: WCAG 2.1 AA Contrast Ratios',
            suggestedRewrite: 'Increase contrast by darkening the foreground or lightening the background.',
            status: 'open'
          });
        }
      }
    }

    // 2. Check for off-brand colors in primary palette
    if (visual.dominantColors && visual.dominantColors.length > 0) {
      const topColor = visual.dominantColors[0].hex;
      // Approved sample brand colors
      const approvedColors = ['#0F172A', '#3B82F6', '#FFFFFF', '#64748B', '#F8FAFC'];
      if (!approvedColors.includes(topColor.toUpperCase())) {
        violations.push({
          id: `viol_vis_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          category: 'visual_inconsistency',
          severity: 'minor',
          violatingExcerpt: `Dominant color ${topColor}`,
          explanation: `The primary color ${topColor} does not match the official brand palette.`,
          ruleCitation: 'Brand Design System: Primary Colors',
          suggestedRewrite: 'Use brand Midnight Navy (#0F172A) or Electric Blue (#3B82F6).',
          status: 'open'
        });
      }
    }
  }

  return { visualViolations: violations };
}
