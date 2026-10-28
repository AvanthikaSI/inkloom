import { Request, Response } from 'express';
import { AnalyticsRepository, inMemoryDb } from '@inkloom/database';

export class AnalyticsController {
  public static async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const reports = Array.from(inMemoryDb.auditReports.values());
      const totalAudits = reports.length;
      
      const avgScore = totalAudits > 0
        ? Math.round(reports.reduce((acc, r) => acc + r.overallComplianceScore, 0) / totalAudits)
        : 88;

      const categoryCounts: Record<string, number> = {
        tone: 0,
        terminology: 0,
        unsupported_claim: 0,
        factual_inaccuracy: 0,
        visual_inconsistency: 0,
        accessibility: 0
      };

      for (const r of reports) {
        for (const v of r.violations) {
          categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1;
        }
      }

      res.json({
        success: true,
        stats: {
          totalAudits,
          averageComplianceScore: avgScore,
          activeGuidelines: inMemoryDb.guidelines.size,
          verifiedFactsCount: inMemoryDb.facts.size,
          categoryDistribution: categoryCounts
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  public static async getAmbiguityMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await AnalyticsRepository.getAmbiguityMetrics();
      res.json({ success: true, metrics });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }
}
