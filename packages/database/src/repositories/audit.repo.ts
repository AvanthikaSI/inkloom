import { AuditReport, ViolationItem } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';
import { getSupabase } from '../supabase-client.js';

function toReport(row: any, violations: any[] = []): AuditReport {
  const viols = (violations && violations.length > 0)
    ? violations
    : (row.audit_violations || row.violations || []);

  return {
    id: row.id,
    contentId: row.content_id || row.contentId,
    contentTitle: row.content_title || row.contentTitle,
    rawText: row.raw_text || row.rawText,
    overallComplianceScore: row.overall_compliance_score ?? row.overallComplianceScore ?? 0,
    toneScore: row.tone_score ?? row.toneScore ?? 0,
    factualScore: row.factual_score ?? row.factualScore ?? 0,
    claimScore: row.claim_score ?? row.claimScore ?? 0,
    visualScore: row.visual_score ?? row.visualScore ?? 0,
    accessibilityScore: row.accessibility_score ?? row.accessibilityScore ?? 0,
    riskTier: row.risk_level || row.riskTier || 'warning',
    violations: viols.map((v: any) => ({
      id: v.id,
      category: v.category,
      severity: v.severity,
      violatingExcerpt: v.violating_excerpt || v.violatingExcerpt || '',
      lineStart: v.line_start || v.lineStart,
      lineEnd: v.line_end || v.lineEnd,
      characterRange: v.character_range || v.characterRange,
      explanation: v.explanation || '',
      ruleCitation: v.rule_citation || v.ruleCitation || '',
      suggestedRewrite: v.suggested_rewrite || v.suggestedRewrite || '',
      status: v.status || 'open'
    })),
    executionTimeMs: row.execution_time_ms ?? row.executionTimeMs ?? 0,
    createdAt: row.created_at || row.createdAt || new Date().toISOString()
  };
}

export class AuditRepository {
  public static async saveReport(report: AuditReport): Promise<AuditReport> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('audit_reports').upsert({
          id: report.id,
          content_id: report.contentId,
          content_title: report.contentTitle,
          raw_text: report.rawText,
          overall_compliance_score: report.overallComplianceScore,
          tone_score: report.toneScore,
          factual_score: report.factualScore,
          claim_score: report.claimScore,
          visual_score: report.visualScore,
          accessibility_score: report.accessibilityScore,
          risk_level: report.riskTier,
          execution_time_ms: report.executionTimeMs,
          created_at: report.createdAt
        }, { onConflict: 'id' });

        if (report.violations && report.violations.length > 0) {
          const violRows = report.violations.map(v => ({
            id: v.id,
            audit_report_id: report.id,
            category: v.category,
            severity: v.severity,
            violating_excerpt: v.violatingExcerpt,
            line_start: v.lineStart,
            line_end: v.lineEnd,
            character_range: v.characterRange,
            explanation: v.explanation,
            rule_citation: v.ruleCitation,
            suggested_rewrite: v.suggestedRewrite,
            status: v.status || 'open'
          }));
          await supabase.from('audit_violations').upsert(violRows, { onConflict: 'id' });
        }
      } catch (err) {
        console.warn('Supabase saveReport failed, using fallback store:', err);
      }
    }

    inMemoryDb.auditReports.set(report.contentId, report);
    inMemoryDb.allAuditReports.set(report.id, report);
    inMemoryDb.persist();
    return report;
  }

  public static async getLatestReportByContentId(contentId: string): Promise<AuditReport | null> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: rep, error: rErr } = await supabase
          .from('audit_reports')
          .select('*')
          .eq('content_id', contentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (!rErr && rep) {
          const { data: viols } = await supabase
            .from('audit_violations')
            .select('*')
            .eq('audit_report_id', rep.id);
          return toReport(rep, viols || []);
        }
      } catch (err) {
        console.warn('Supabase getLatestReport failed, using fallback store:', err);
      }
    }
    return inMemoryDb.auditReports.get(contentId) || null;
  }

  public static async getReportById(reportId: string): Promise<AuditReport | null> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: rep, error: rErr } = await supabase
          .from('audit_reports')
          .select('*')
          .eq('id', reportId)
          .single();
        if (!rErr && rep) {
          const { data: viols } = await supabase
            .from('audit_violations')
            .select('*')
            .eq('audit_report_id', rep.id);
          return toReport(rep, viols || []);
        }
      } catch (err) {
        console.warn('Supabase getReportById failed, using fallback store:', err);
      }
    }
    return inMemoryDb.allAuditReports.get(reportId) || null;
  }

  public static async getAllReports(): Promise<AuditReport[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const [repsRes, violsRes] = await Promise.all([
          supabase.from('audit_reports').select('*').order('created_at', { ascending: false }),
          supabase.from('audit_violations').select('*')
        ]);

        if (!repsRes.error && Array.isArray(repsRes.data) && repsRes.data.length > 0) {
          const violationsByReportId: Record<string, any[]> = {};
          if (!violsRes.error && Array.isArray(violsRes.data)) {
            for (const v of violsRes.data) {
              const rId = v.audit_report_id;
              if (rId) {
                if (!violationsByReportId[rId]) violationsByReportId[rId] = [];
                violationsByReportId[rId].push(v);
              }
            }
          }
          return repsRes.data.map(r => toReport(r, violationsByReportId[r.id] || []));
        }
      } catch (err) {
        console.warn('Supabase getAllReports failed, using fallback store:', err);
      }
    }

    const list = Array.from(inMemoryDb.allAuditReports.values());
    if (list.length === 0 && inMemoryDb.auditReports.size > 0) {
      return Array.from(inMemoryDb.auditReports.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public static async updateViolationStatus(
    contentId: string,
    violationId: string,
    status: 'open' | 'accepted' | 'rejected' | 'modified'
  ): Promise<ViolationItem | null> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('audit_violations').update({ status }).eq('id', violationId);
      } catch (err) {
        console.warn('Supabase updateViolationStatus failed, using fallback store:', err);
      }
    }

    const report = inMemoryDb.auditReports.get(contentId);
    if (!report) return null;

    const violation = report.violations.find(v => v.id === violationId);
    if (!violation) return null;

    violation.status = status;

    inMemoryDb.auditReports.set(contentId, report);
    if (report.id) {
      inMemoryDb.allAuditReports.set(report.id, report);
    }
    inMemoryDb.persist();
    return violation;
  }
}
