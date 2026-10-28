import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';

const router = Router();

router.get('/overview', AnalyticsController.getOverview);
router.get('/ambiguity-metrics', AnalyticsController.getAmbiguityMetrics);

export default router;
