import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireAuth, optionalAuth } from '../middleware/auth';

const router = Router();
const projectController = new ProjectController();

// Project CRUD operations
router.get('/', optionalAuth, asyncHandler(projectController.getProjects.bind(projectController)));
router.post('/', requireAuth, asyncHandler(projectController.createProject.bind(projectController)));
router.get('/:id', optionalAuth, asyncHandler(projectController.getProject.bind(projectController)));
router.put('/:id', requireAuth, asyncHandler(projectController.updateProject.bind(projectController)));
router.delete('/:id', requireAuth, asyncHandler(projectController.deleteProject.bind(projectController)));

// Project-specific operations
router.get('/:id/dependencies', optionalAuth, asyncHandler(projectController.getDependencies.bind(projectController)));
router.get('/:id/files', optionalAuth, asyncHandler(projectController.getProjectFiles.bind(projectController)));
router.get('/:id/variables', optionalAuth, asyncHandler(projectController.getProjectVariables.bind(projectController)));
router.get('/:id/runtime-data', optionalAuth, asyncHandler(projectController.getRuntimeData.bind(projectController)));
router.post('/:id/analyze', requireAuth, asyncHandler(projectController.analyzeProject.bind(projectController)));

export default router;