import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import { AuditController } from '../controllers/audit.controller.js';

const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (_req, file, callback) => {
      callback(null, `inkloom-${Date.now()}${path.extname(file.originalname).toLowerCase()}`);
    }
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = new Set([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/webp'
    ]);
    callback(null, allowed.has(file.mimetype));
  }
});
const router = Router();

router.post('/analyze', upload.single('file'), AuditController.analyze);
router.get('/:contentId', AuditController.getReport);
router.patch('/:contentId/violations/:violationId', AuditController.updateViolation);

export default router;
