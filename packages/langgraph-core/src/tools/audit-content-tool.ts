import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { brandAuditGraph } from '../graph.js';
import { ContentRepository, AuditRepository } from '@inkloom/database';

export const auditContentTool = tool(
  async ({ text, contentId, title }) => {
    try {
      let contentText = text || '';

      if (contentId && !contentText) {
        const item = await ContentRepository.getById(contentId);
        if (item) {
          contentText = item.rawText;
        }
      }

      if (!contentText.trim()) {
        return JSON.stringify({
          error: 'No content text provided to audit.'
        });
      }

      const graphResult = await brandAuditGraph.invoke({
        orgId: 'org_inkloom_01',
        contentId: contentId || `audit_${Date.now()}`,
        rawText: contentText,
        visualData: undefined
      });

      return JSON.stringify({
        overallComplianceScore: graphResult.overallScore,
        riskTier: graphResult.riskTier,
        categoryScores: graphResult.categoryScores,
        totalViolations: graphResult.allViolations.length,
        violations: graphResult.allViolations.map((v: any) => ({
          category: v.category,
          severity: v.severity,
          violatingExcerpt: v.violatingExcerpt,
          explanation: v.explanation,
          ruleCitation: v.ruleCitation,
          suggestedRewrite: v.suggestedRewrite
        }))
      });
    } catch (err: any) {
      return JSON.stringify({ error: err.message, overallComplianceScore: 0 });
    }
  },
  {
    name: 'run_brand_governance_audit',
    description: 'Executes a comprehensive brand audit across Tone, Terminology, Factual Claims, and Accessibility, returning an overall score (0-100), risk tier, and specific violations with citations.',
    schema: z.object({
      text: z.string().optional().describe('The raw marketing text or copy to audit.'),
      contentId: z.string().optional().describe('Optional existing content document ID.'),
      title: z.string().optional().describe('Optional campaign or document title.')
    })
  }
);
