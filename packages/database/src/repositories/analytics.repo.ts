import { GuidelineAmbiguityMetric, computeAmbiguityIndex } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';
import { getSupabase } from '../supabase-client.js';

export class AnalyticsRepository {
  public static async getAmbiguityMetrics(): Promise<GuidelineAmbiguityMetric[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('guideline_ambiguity_metrics')
          .select('*')
          .order('times_flagged', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((row: any) => ({
            guidelineId: row.guideline_id || row.id,
            guidelineTitle: row.guideline_title || 'Brand Guideline Rule',
            category: row.category || 'general',
            timesFlagged: row.times_flagged ?? 0,
            timesOverridden: row.times_overridden ?? 0,
            timesAccepted: row.times_accepted ?? 0,
            ambiguityFrictionIndex: row.ambiguity_friction_index ?? 0,
            recommendation: row.recommendation || ''
          }));
        }

        // If table is empty in Supabase, auto-compute from guidelines & violations
        const [gRes, vRes] = await Promise.all([
          supabase.from('brand_guidelines').select('*'),
          supabase.from('audit_violations').select('*')
        ]);

        if (!gRes.error && Array.isArray(gRes.data) && gRes.data.length > 0) {
          const violations = vRes.data || [];
          const metricsToUpsert: any[] = [];

          for (const g of gRes.data) {
            const cat = g.category;
            // Match violations by category
            const matchingViols = violations.filter((v: any) => {
              if (cat === 'tone_voice' && v.category === 'tone') return true;
              if (cat === 'legal' && (v.category === 'unsupported_claim' || v.category === 'factual_inaccuracy')) return true;
              if (cat === 'visual' && (v.category === 'visual_inconsistency' || v.category === 'accessibility')) return true;
              return v.category === cat;
            });

            const timesFlagged = matchingViols.length;
            const timesOverridden = matchingViols.filter((v: any) => v.status === 'rejected').length;
            const timesAccepted = matchingViols.filter((v: any) => v.status === 'accepted').length;

            const { index, recommendation } = computeAmbiguityIndex(
              timesFlagged,
              timesOverridden,
              timesAccepted
            );

            const row = {
              guideline_id: g.id,
              guideline_title: g.title,
              category: g.category,
              times_flagged: timesFlagged,
              times_overridden: timesOverridden,
              times_accepted: timesAccepted,
              ambiguity_friction_index: index,
              recommendation
            };

            metricsToUpsert.push(row);
          }

          if (metricsToUpsert.length > 0) {
            for (const row of metricsToUpsert) {
              const { data: upd } = await supabase
                .from('guideline_ambiguity_metrics')
                .update(row)
                .eq('guideline_id', row.guideline_id)
                .select();
              if (!upd || upd.length === 0) {
                await supabase
                  .from('guideline_ambiguity_metrics')
                  .insert({ id: `gam_${row.guideline_id}`, org_id: 'org_inkloom_01', ...row });
              }
            }
            return metricsToUpsert.map((m) => ({
              guidelineId: m.guideline_id,
              guidelineTitle: m.guideline_title,
              category: m.category,
              timesFlagged: m.times_flagged,
              timesOverridden: m.times_overridden,
              timesAccepted: m.times_accepted,
              ambiguityFrictionIndex: m.ambiguity_friction_index,
              recommendation: m.recommendation
            }));
          }
        }
      } catch (err) {
        console.warn('Supabase getAmbiguityMetrics failed, using fallback store:', err);
      }
    }

    return Array.from(inMemoryDb.ambiguityMetrics.values());
  }

  public static async recordGuidelineResolution(
    guidelineId: string,
    action: 'accepted' | 'overridden'
  ): Promise<GuidelineAmbiguityMetric | null> {
    let metric = inMemoryDb.ambiguityMetrics.get(guidelineId);
    let guidelineTitle = 'Brand Guideline Rule';
    let guidelineCategory = 'general';

    // Try fetching from Supabase first
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: gData } = await supabase
          .from('brand_guidelines')
          .select('*')
          .eq('id', guidelineId)
          .single();
        if (gData) {
          guidelineTitle = gData.title;
          guidelineCategory = gData.category;
        }

        const { data: mData } = await supabase
          .from('guideline_ambiguity_metrics')
          .select('*')
          .eq('guideline_id', guidelineId)
          .maybeSingle();
        if (mData) {
          metric = {
            guidelineId,
            guidelineTitle: mData.guideline_title || guidelineTitle,
            category: mData.category || guidelineCategory,
            timesFlagged: mData.times_flagged ?? 0,
            timesOverridden: mData.times_overridden ?? 0,
            timesAccepted: mData.times_accepted ?? 0,
            ambiguityFrictionIndex: mData.ambiguity_friction_index ?? 0
          };
        }
      } catch {}
    }

    if (!metric) {
      const guideline = inMemoryDb.guidelines.get(guidelineId);
      metric = {
        guidelineId,
        guidelineTitle: guideline ? guideline.title : guidelineTitle,
        category: guideline ? guideline.category : guidelineCategory,
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

    // Persist to Supabase
    if (supabase) {
      try {
        const payload = {
          guideline_id: guidelineId,
          guideline_title: metric.guidelineTitle,
          category: metric.category,
          times_flagged: metric.timesFlagged,
          times_overridden: metric.timesOverridden,
          times_accepted: metric.timesAccepted,
          ambiguity_friction_index: metric.ambiguityFrictionIndex,
          recommendation: metric.recommendation,
          updated_at: new Date().toISOString()
        };

        const { data: updated, error: updErr } = await supabase
          .from('guideline_ambiguity_metrics')
          .update(payload)
          .eq('guideline_id', guidelineId)
          .select();

        if (updErr || !updated || updated.length === 0) {
          await supabase
            .from('guideline_ambiguity_metrics')
            .insert({
              id: `gam_${guidelineId}`,
              org_id: 'org_inkloom_01',
              ...payload
            });
        }
      } catch (err) {
        console.warn('Supabase update ambiguity metric failed:', err);
      }
    }

    return metric;
  }
}
