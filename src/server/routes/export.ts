import { Router } from 'express';
import { ExportController } from '../controllers/exportController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const exportController = new ExportController();

// Export endpoints
router.post('/project', asyncHandler(exportController.exportProject.bind(exportController)));
router.post('/files', asyncHandler(exportController.exportFiles.bind(exportController)));
router.get('/formats', asyncHandler(exportController.getExportFormats.bind(exportController)));

export default router;