import { Request, Response } from 'express';
import { ContentRepository, AuditRepository, WorkflowRepository, AnalyticsRepository } from '@inkloom/database';
import { applySurgicalPatch } from '@inkloom/shared';

export class ContentController {
  public static async list(req: Request, res: Response): Promise<void> {
    try {
      const items = await ContentRepository.getAll();
      res.json({ success: true, items });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const item = await ContentRepository.getById(id);
      if (!item) {
        res.status(404).json({ success: false, error: 'Content not found' });
        return;
      }
      res.json({ success: true, item });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  public static async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, rawText, contentFormat } = req.body;
      const newItem = await ContentRepository.create({
        orgId: 'org_inkloom_01',
        authorId: 'usr_creator_01',
        authorName: 'Sarah Jenkins',
        title: title || 'Untitled Content',
        contentFormat: contentFormat || 'text_copy',
        rawText: rawText || '',
        status: 'draft'
      });
      res.json({ success: true, item: newItem });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  /**
   * Improvement 3: Intent-Preserving Surgical Diff Patch Application
   */
  public static async applyPatch(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { violationId, excerpt, replacement, currentText } = req.body;

      let item = await ContentRepository.getById(id);
      if (!item) {
        item = await ContentRepository.create({
          orgId: 'org_inkloom_01',
          authorId: 'usr_creator_01',
          authorName: 'Sarah Jenkins',
          title: 'Draft Publication',
          contentFormat: 'text_copy',
          rawText: currentText || '',
          status: 'draft'
        });
      }

      // If client sent current text from the active editor, prioritize and sync it
      const baseText = typeof currentText === 'string' && currentText.trim()
        ? currentText
        : (item.rawText || '');

      const report = violationId ? await AuditRepository.getLatestReportByContentId(item.id) : null;
      const violation = report?.violations.find((entry) => entry.id === String(violationId));
      const requestedExcerpt = typeof excerpt === 'string' ? excerpt : '';
      const requestedReplacement = typeof replacement === 'string' ? replacement : '';

      const patchResult = applySurgicalPatch(
        baseText,
        violation?.violatingExcerpt || requestedExcerpt,
        requestedReplacement
      );

      const updatedItem = await ContentRepository.update(item.id, { rawText: patchResult.newText });
      if (violationId) {
        await AuditRepository.updateViolationStatus(item.id, String(violationId), 'accepted');
        await WorkflowRepository.logAction({
          contentId: item.id,
          actorId: 'usr_creator_01',
          actorName: 'Sarah Jenkins',
          action: 'applied_suggestion',
          metadata: { violationId, excerpt: violation?.violatingExcerpt || excerpt, replacement }
        });
      }

      res.json({ success: true, item: updatedItem || { ...item, rawText: patchResult.newText } });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  /**
   * Improvement 1 & 2: Creator Override for non-critical warnings
   */
  public static async overrideWarning(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { violationId, guidelineId, justification } = req.body;

      await AuditRepository.updateViolationStatus(id, String(violationId), 'rejected');
      await WorkflowRepository.logAction({
        contentId: id,
        actorId: 'usr_creator_01',
        actorName: 'Sarah Jenkins',
        action: 'overridden_warning',
        metadata: { violationId, justification }
      });

      if (guidelineId) {
        await AnalyticsRepository.recordGuidelineResolution(String(guidelineId), 'overridden');
      }

      res.json({ success: true, message: 'Warning overridden and logged to governance records.' });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }
}
