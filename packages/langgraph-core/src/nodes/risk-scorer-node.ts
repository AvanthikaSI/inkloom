import { BrandAuditStateType } from '../state.js';
import { calculateComplianceScore } from '@inkloom/shared';

export async function riskScorerNode(state: BrandAuditStateType): Promise<Partial<BrandAuditStateType>> {
  const violations = state.allViolations || [];
  const { score, riskTier, categoryBreakdown } = calculateComplianceScore(violations);

  return {
    overallScore: score,
    riskTier,
    categoryScores: categoryBreakdown
  };
}
