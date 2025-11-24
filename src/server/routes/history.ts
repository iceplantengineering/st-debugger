import { Router } from 'express';
import { HistoryController } from '../controllers/historyController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const historyController = new HistoryController();

// History tracking endpoints
router.get('/projects/:id/timeline', asyncHandler(historyController.getProjectTimeline.bind(historyController)));
router.get('/projects/:id/variables/:name/history', asyncHandler(historyController.getVariableHistory.bind(historyController)));
router.get('/projects/:id/files/:fileId/history', asyncHandler(historyController.getFileChangeHistory.bind(historyController)));
router.post('/projects/:id/activity', asyncHandler(historyController.recordActivity.bind(historyController)));

export default router;