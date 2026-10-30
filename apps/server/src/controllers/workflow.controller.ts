import { Request, Response } from 'express';
import { WorkflowRepository, ContentRepository } from '@inkloom/database';

export class WorkflowController {
  public static async getComments(req: Request, res: Response): Promise<void> {
    try {
      const contentId = String(req.params.contentId);
      const comments = await WorkflowRepository.getComments(contentId);
      res.json({ success: true, comments });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  public static async addComment(req: Request, res: Response): Promise<void> {
    try {
      const contentId = String(req.params.contentId);
      const { violationId, authorId, authorName, authorRole, commentText } = req.body;

      const comment = await WorkflowRepository.addComment({
        contentId,
        violationId: violationId ? String(violationId) : undefined,
        authorId: authorId || 'usr_reviewer_01',
        authorName: authorName || 'Marcus Vance',
        authorRole: authorRole || 'reviewer',
        commentText
      });

      res.json({ success: true, comment });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  public static async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const contentId = String(req.params.contentId);
      const logs = await WorkflowRepository.getAuditLogs(contentId);
      res.json({ success: true, logs });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  public static async changeStatus(req: Request, res: Response): Promise<void> {
    try {
      const contentId = String(req.params.contentId);
      const { status, actorId, actorName, role } = req.body;

      // Status machine checks
      const validStatuses = ['draft', 'in_review', 'changes_requested', 'approved', 'published'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ success: false, error: 'Invalid status' });
        return;
      }

      const updated = await ContentRepository.updateStatus(contentId, status);
      await WorkflowRepository.logAction({
        contentId,
        actorId: actorId || 'usr_manager_01',
        actorName: actorName || 'Elena Rostova',
        action:
          status === 'approved'
            ? 'approved_content'
            : status === 'published'
            ? 'published'
            : status === 'changes_requested'
            ? 'changes_requested'
            : 'submitted_review',
        metadata: { newStatus: status, role }
      });

      res.json({ success: true, item: updated });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }
}
