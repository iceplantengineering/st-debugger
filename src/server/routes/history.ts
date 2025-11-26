import { Router } from 'express';
import { HistoryController } from '../controllers/historyController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const historyController = new HistoryController();

// History endpoints
router.get('/project/:projectId', asyncHandler(historyController.getProjectHistory.bind(historyController)));
router.post('/project/:projectId', asyncHandler(historyController.addHistoryEntry.bind(historyController)));
router.get('/session/:sessionId', asyncHandler(historyController.getSessionHistory.bind(historyController)));
router.delete('/project/:projectId', asyncHandler(historyController.clearProjectHistory.bind(historyController)));

export default router;