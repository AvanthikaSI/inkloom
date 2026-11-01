import { Router } from 'express';
import { ContentController } from '../controllers/content.controller.js';

const router = Router();

router.get('/', ContentController.list);
router.post('/', ContentController.create);
router.get('/:id', ContentController.getById);
router.patch('/:id', ContentController.update);
router.put('/:id', ContentController.update);
router.post('/:id/apply-patch', ContentController.applyPatch);
router.post('/:id/override', ContentController.overrideWarning);

export default router;
