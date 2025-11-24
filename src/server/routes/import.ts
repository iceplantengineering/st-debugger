import { Router } from 'express';
import { ImportController } from '../controllers/importController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const importController = new ImportController();

// Import endpoints
router.post('/variables', asyncHandler(importController.importVariableSnapshots.bind(importController)));
router.post('/traces', asyncHandler(importController.importTraceLogs.bind(importController)));
router.post('/errors', asyncHandler(importController.importErrorLogs.bind(importController)));
router.post('/project', asyncHandler(importController.importProject.bind(importController)));

export default router;