import { Router } from 'express';
import { ImportController } from '../controllers/importController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const importController = new ImportController();

// Import endpoints
router.post('/files', asyncHandler(importController.importFiles.bind(importController)));
router.post('/project', asyncHandler(importController.importProject.bind(importController)));
router.get('/templates', asyncHandler(importController.getImportTemplates.bind(importController)));

export default router;