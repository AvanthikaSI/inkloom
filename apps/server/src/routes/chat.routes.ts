import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import { ChatController } from '../controllers/chat.controller.js';

const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (_req, file, callback) => {
      callback(null, `inkloom-chat-${Date.now()}${path.extname(file.originalname).toLowerCase()}`);
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

router.post('/message', upload.single('file'), ChatController.sendMessage);
router.get('/history/:sessionId', ChatController.getHistory);
router.post('/reset/:sessionId', ChatController.resetSession);
router.get('/stream', ChatController.streamMessage);

export default router;
