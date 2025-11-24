import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const projectController = new ProjectController();

// Project CRUD operations
router.get('/', asyncHandler(projectController.getProjects.bind(projectController)));
router.post('/', asyncHandler(projectController.createProject.bind(projectController)));
router.get('/:id', asyncHandler(projectController.getProject.bind(projectController)));
router.put('/:id', asyncHandler(projectController.updateProject.bind(projectController)));
router.delete('/:id', asyncHandler(projectController.deleteProject.bind(projectController)));

// Project-specific operations
router.get('/:id/dependencies', asyncHandler(projectController.getDependencies.bind(projectController)));
router.get('/:id/files', asyncHandler(projectController.getProjectFiles.bind(projectController)));
router.get('/:id/variables', asyncHandler(projectController.getProjectVariables.bind(projectController)));
router.get('/:id/runtime-data', asyncHandler(projectController.getRuntimeData.bind(projectController)));
router.post('/:id/analyze', asyncHandler(projectController.analyzeProject.bind(projectController)));

export default router;