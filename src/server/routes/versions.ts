import { Router } from 'express';
import { VersionController } from '../controllers/versionController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const versionController = new VersionController();

// Version management endpoints
router.get('/projects/:id', asyncHandler(versionController.getProjectVersions.bind(versionController)));
router.post('/projects/:id', asyncHandler(versionController.createVersion.bind(versionController)));
router.get('/:versionId', asyncHandler(versionController.getVersion.bind(versionController)));
router.get('/:versionId/compare/:otherVersionId', asyncHandler(versionController.compareVersions.bind(versionController)));
router.post('/:versionId/checkout', asyncHandler(versionController.checkoutVersion.bind(versionController)));

export default router;