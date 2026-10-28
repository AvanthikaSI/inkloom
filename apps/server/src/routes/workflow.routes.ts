import { Router } from 'express';
import { WorkflowController } from '../controllers/workflow.controller.js';

const router = Router();

router.get('/:contentId/comments', WorkflowController.getComments);
router.post('/:contentId/comments', WorkflowController.addComment);
router.get('/:contentId/audit-logs', WorkflowController.getAuditLogs);
router.post('/:contentId/status', WorkflowController.changeStatus);

export default router;
