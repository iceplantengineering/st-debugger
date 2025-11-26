import { Router } from 'express';
import { VersionController } from '../controllers/versionController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const versionController = new VersionController();

// Version management endpoints
router.get('/project/:projectId', asyncHandler(versionController.getProjectVersions.bind(versionController)));
router.post('/project/:projectId', asyncHandler(versionController.createVersion.bind(versionController)));
router.get('/:id', asyncHandler(versionController.getVersion.bind(versionController)));
router.put('/:id', asyncHandler(versionController.updateVersion.bind(versionController)));
router.delete('/:id', asyncHandler(versionController.deleteVersion.bind(versionController)));
router.post('/:id/restore', asyncHandler(versionController.restoreVersion.bind(versionController)));

export default router;