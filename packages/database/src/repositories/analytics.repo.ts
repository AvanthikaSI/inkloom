import { GuidelineAmbiguityMetric } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';
import { computeAmbiguityIndex } from '@inkloom/shared';

export class AnalyticsRepository {
  public static async getAmbiguityMetrics(): Promise<GuidelineAmbiguityMetric[]> {
    return Array.from(inMemoryDb.ambiguityMetrics.values());
  }

  public static async recordGuidelineResolution(
    guidelineId: string,
    action: 'accepted' | 'overridden'
  ): Promise<GuidelineAmbiguityMetric | null> {
    let metric = inMemoryDb.ambiguityMetrics.get(guidelineId);
    const guideline = inMemoryDb.guidelines.get(guidelineId);

    if (!metric) {
      metric = {
        guidelineId,
        guidelineTitle: guideline ? guideline.title : 'Brand Guideline Rule',
        category: guideline ? guideline.category : 'general',
        timesFlagged: 0,
        timesOverridden: 0,
        timesAccepted: 0,
        ambiguityFrictionIndex: 0.0
      };
    }

    metric.timesFlagged += 1;
    if (action === 'overridden') {
      metric.timesOverridden += 1;
    } else {
      metric.timesAccepted += 1;
    }

    const { index, recommendation } = computeAmbiguityIndex(
      metric.timesFlagged,
      metric.timesOverridden,
      metric.timesAccepted
    );

    metric.ambiguityFrictionIndex = index;
    metric.recommendation = recommendation;

    inMemoryDb.ambiguityMetrics.set(guidelineId, metric);
    inMemoryDb.persist();
    return metric;
  }
}
