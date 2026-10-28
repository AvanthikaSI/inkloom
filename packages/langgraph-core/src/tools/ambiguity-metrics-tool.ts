import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { AnalyticsRepository } from '@inkloom/database';

export const getAmbiguityMetricsTool = tool(
  async ({ minFrictionThreshold }) => {
    try {
      const threshold = minFrictionThreshold !== undefined ? minFrictionThreshold : 0.2;
      const metrics = await AnalyticsRepository.getAmbiguityMetrics();
      const filtered = metrics.filter(m => m.ambiguityFrictionIndex >= threshold);

      return JSON.stringify({
        totalAnalyzedGuidelines: metrics.length,
        highFrictionGuidelinesCount: filtered.length,
        thresholdUsed: threshold,
        guidelinesWithFriction: filtered.map(m => ({
          guidelineId: m.guidelineId,
          title: m.guidelineTitle,
          category: m.category,
          timesFlagged: m.timesFlagged,
          timesOverridden: m.timesOverridden,
          frictionPercentage: `${Math.round(m.ambiguityFrictionIndex * 100)}%`,
          recommendation: m.recommendation
        }))
      });
    } catch (err: any) {
      return JSON.stringify({ error: err.message, guidelinesWithFriction: [] });
    }
  },
  {
    name: 'get_guideline_ambiguity_metrics',
    description: 'Retrieves algorithmic ambiguity friction metrics showing which brand guidelines have high creator override rates and need clarifying examples or revision.',
    schema: z.object({
      minFrictionThreshold: z.number().optional().describe('Minimum friction index (0.0 to 1.0) to filter (default: 0.2 = 20% overrides).')
    })
  }
);
