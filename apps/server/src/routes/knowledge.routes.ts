import { Router } from 'express';
import { KnowledgeController } from '../controllers/knowledge.controller.js';

const router = Router();

router.get('/guidelines', KnowledgeController.getGuidelines);
router.post('/guidelines', KnowledgeController.addGuideline);

router.get('/facts', KnowledgeController.getFacts);
router.post('/facts', KnowledgeController.addFact);

router.get('/terminology', KnowledgeController.getTerminology);
router.post('/terminology', KnowledgeController.addTerminology);

router.get('/brand-kit', KnowledgeController.getBrandKit);

export default router;
