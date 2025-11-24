import { Router } from 'express';
import { ExportController } from '../controllers/exportController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const exportController = new ExportController();

// Export endpoints
router.get('/projects/:id', asyncHandler(exportController.exportProject.bind(exportController)));
router.get('/projects/:id/versions/:versionId', asyncHandler(exportController.exportVersion.bind(exportController)));
router.get('/projects/:id/diff/:fromVersion/:toVersion', asyncHandler(exportController.exportDiff.bind(exportController)));

export default router;