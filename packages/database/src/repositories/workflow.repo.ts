import { ReviewComment, AuditLogEntry } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';

export class WorkflowRepository {
  public static async getComments(contentId: string): Promise<ReviewComment[]> {
    return inMemoryDb.reviewComments.get(contentId) || [];
  }

  public static async addComment(comment: Omit<ReviewComment, 'id' | 'createdAt'>): Promise<ReviewComment> {
    const id = `comment_${Date.now()}`;
    const newComment: ReviewComment = {
      ...comment,
      id,
      createdAt: new Date().toISOString()
    };
    const list = inMemoryDb.reviewComments.get(comment.contentId) || [];
    list.push(newComment);
    inMemoryDb.reviewComments.set(comment.contentId, list);
    inMemoryDb.persist();
    return newComment;
  }

  public static async getAuditLogs(contentId: string): Promise<AuditLogEntry[]> {
    return inMemoryDb.auditLogs.get(contentId) || [];
  }

  public static async logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const id = `log_${Date.now()}`;
    const logItem: AuditLogEntry = {
      ...entry,
      id,
      timestamp: new Date().toISOString()
    };
    const list = inMemoryDb.auditLogs.get(entry.contentId) || [];
    list.push(logItem);
    inMemoryDb.auditLogs.set(entry.contentId, list);
    inMemoryDb.persist();
    return logItem;
  }
}
