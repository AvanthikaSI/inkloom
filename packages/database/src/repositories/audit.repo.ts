import { AuditReport, ViolationItem } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';

export class AuditRepository {
  public static async saveReport(report: AuditReport): Promise<AuditReport> {
    inMemoryDb.auditReports.set(report.contentId, report);
    inMemoryDb.persist();
    return report;
  }

  public static async getLatestReportByContentId(contentId: string): Promise<AuditReport | null> {
    return inMemoryDb.auditReports.get(contentId) || null;
  }

  public static async updateViolationStatus(
    contentId: string,
    violationId: string,
    status: 'open' | 'accepted' | 'rejected' | 'modified'
  ): Promise<ViolationItem | null> {
    const report = inMemoryDb.auditReports.get(contentId);
    if (!report) return null;

    const violation = report.violations.find(v => v.id === violationId);
    if (!violation) return null;

    violation.status = status;

    // Recalculate if needed
    inMemoryDb.auditReports.set(contentId, report);
    inMemoryDb.persist();
    return violation;
  }
}
