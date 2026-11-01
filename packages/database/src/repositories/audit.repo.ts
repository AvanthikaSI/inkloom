import { AuditReport, ViolationItem } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';

export class AuditRepository {
  public static async saveReport(report: AuditReport): Promise<AuditReport> {
    inMemoryDb.auditReports.set(report.contentId, report);
    inMemoryDb.allAuditReports.set(report.id, report);
    inMemoryDb.persist();
    return report;
  }

  public static async getLatestReportByContentId(contentId: string): Promise<AuditReport | null> {
    return inMemoryDb.auditReports.get(contentId) || null;
  }

  public static async getReportById(reportId: string): Promise<AuditReport | null> {
    return inMemoryDb.allAuditReports.get(reportId) || null;
  }

  public static async getAllReports(): Promise<AuditReport[]> {
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
