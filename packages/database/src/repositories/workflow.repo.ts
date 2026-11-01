import { ReviewComment, AuditLogEntry } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';
import { getSupabase } from '../supabase-client.js';

function toComment(row: any): ReviewComment {
  return {
    id: row.id,
    contentId: row.content_id || row.contentId,
    violationId: row.violation_id || row.violationId,
    authorId: row.author_id || row.authorId || 'usr_creator_01',
    authorName: row.author_name || row.authorName || 'Reviewer',
    authorRole: row.author_role || row.authorRole || 'reviewer',
    commentText: row.comment_text || row.commentText || '',
    createdAt: row.created_at || row.createdAt || new Date().toISOString()
  };
}

function toLog(row: any): AuditLogEntry {
  return {
    id: row.id,
    contentId: row.content_id || row.contentId,
    actorId: row.actor_id || row.actorId || 'usr_creator_01',
    actorName: row.actor_name || row.actorName || 'User',
    action: row.action,
    metadata: row.metadata || {},
    timestamp: row.timestamp || row.created_at || new Date().toISOString()
  };
}

export class WorkflowRepository {
  public static async getComments(contentId: string): Promise<ReviewComment[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('review_threads').select('*').eq('content_id', contentId).order('created_at', { ascending: true });
        if (!error && Array.isArray(data) && data.length > 0) return data.map(toComment);
      } catch (err) {
        console.warn('Supabase getComments failed, using fallback store:', err);
      }
    }
    return inMemoryDb.reviewComments.get(contentId) || [];
  }

  public static async addComment(comment: Omit<ReviewComment, 'id' | 'createdAt'>): Promise<ReviewComment> {
    const id = `comment_${Date.now()}`;
    const newComment: ReviewComment = {
      ...comment,
      id,
      createdAt: new Date().toISOString()
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('review_threads').insert({
          id,
          content_id: comment.contentId,
          violation_id: comment.violationId,
          author_id: comment.authorId,
          author_name: comment.authorName,
          author_role: comment.authorRole,
          comment_text: comment.commentText,
          created_at: newComment.createdAt
        });
      } catch (err) {
        console.warn('Supabase addComment failed, using fallback store:', err);
      }
    }

    const list = inMemoryDb.reviewComments.get(comment.contentId) || [];
    list.push(newComment);
    inMemoryDb.reviewComments.set(comment.contentId, list);
    inMemoryDb.persist();
    return newComment;
  }

  public static async getAuditLogs(contentId: string): Promise<AuditLogEntry[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('compliance_audit_log').select('*').eq('content_id', contentId).order('timestamp', { ascending: true });
        if (!error && Array.isArray(data) && data.length > 0) return data.map(toLog);
      } catch (err) {
        console.warn('Supabase getAuditLogs failed, using fallback store:', err);
      }
    }
    return inMemoryDb.auditLogs.get(contentId) || [];
  }

  public static async logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const id = `log_${Date.now()}`;
    const logItem: AuditLogEntry = {
      ...entry,
      id,
      timestamp: new Date().toISOString()
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('compliance_audit_log').insert({
          id,
          content_id: entry.contentId,
          actor_id: entry.actorId,
          actor_name: entry.actorName,
          action: entry.action,
          metadata: entry.metadata,
          timestamp: logItem.timestamp
        });
      } catch (err) {
        console.warn('Supabase logAction failed, using fallback store:', err);
      }
    }

    const list = inMemoryDb.auditLogs.get(entry.contentId) || [];
    list.push(logItem);
    inMemoryDb.auditLogs.set(entry.contentId, list);
    inMemoryDb.persist();
    return logItem;
  }
}
