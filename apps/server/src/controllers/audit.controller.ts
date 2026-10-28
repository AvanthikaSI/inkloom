import { Request, Response } from 'express';
import { AuditRunnerService } from '../services/audit-runner.service.js';
import { ContentRepository, AuditRepository } from '@inkloom/database';
import { ContentFormat } from '@inkloom/shared';

export class AuditController {
  private static getContentFormat(file?: Express.Multer.File, requestedFormat?: string): ContentFormat {
    if (requestedFormat === 'text_copy' || requestedFormat === 'document_pdf' || requestedFormat === 'document_docx' || requestedFormat === 'image_creative') {
      return requestedFormat;
    }
    if (!file) return 'text_copy';
    if (file.mimetype.includes('image')) return 'image_creative';
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'document_docx';
    if (file.mimetype === 'text/plain') return 'text_copy';
    return 'document_pdf';
  }

  public static async analyze(req: Request, res: Response): Promise<void> {
    try {
      const { contentId, text, title, format } = req.body;
      const file = req.file;

      let item = null;
      if (contentId) {
        item = await ContentRepository.getById(contentId);
      }

      if (!item) {
        item = await ContentRepository.create({
          orgId: 'org_inkloom_01',
          authorId: 'usr_creator_01',
          authorName: 'Sarah Jenkins',
          title: title || 'Draft Publication',
          contentFormat: AuditController.getContentFormat(file, format),
          rawText: text || '',
          assetFileUrl: file ? file.path : undefined,
          status: 'draft'
        });
      } else if (text !== undefined) {
        const updates: Record<string, string> = { rawText: text };
        if (file) {
          updates.assetFileUrl = file.path;
          updates.contentFormat = AuditController.getContentFormat(file, format);
        }
        await ContentRepository.update(item.id, updates);
        await ContentRepository.updateStatus(item.id, 'draft');
        Object.assign(item, updates);
        item.status = 'draft';
      } else if (file) {
        const contentFormat = AuditController.getContentFormat(file, format);
        await ContentRepository.update(item.id, {
          assetFileUrl: file.path,
          contentFormat
        });
        await ContentRepository.updateStatus(item.id, 'draft');
        item.assetFileUrl = file.path;
        item.contentFormat = contentFormat as typeof item.contentFormat;
        item.status = 'draft';
      }

      const report = await AuditRunnerService.runAudit(item, file ? file.path : undefined);
      const refreshedItem = await ContentRepository.getById(item.id);
      res.json({ success: true, contentItem: refreshedItem || item, report });
    } catch (e: any) {
      const message = e?.message || 'The audit could not be completed.';
      res.status(message.includes('No readable text') ? 422 : 500).json({ success: false, error: message });
    }
  }

  public static async getReport(req: Request, res: Response): Promise<void> {
    try {
      const contentId = String(req.params.contentId);
      const report = await AuditRepository.getLatestReportByContentId(contentId);
      if (!report) {
        res.status(404).json({ success: false, error: 'Report not found' });
        return;
      }
      res.json({ success: true, report });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  public static async updateViolation(req: Request, res: Response): Promise<void> {
    try {
      const contentId = String(req.params.contentId);
      const violationId = String(req.params.violationId);
      const { status } = req.body;
      const updated = await AuditRepository.updateViolationStatus(contentId, violationId, status);
      res.json({ success: true, violation: updated });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  }
}
