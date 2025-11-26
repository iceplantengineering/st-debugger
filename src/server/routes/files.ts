import { Router } from 'express';
import { FileController } from '../controllers/fileController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const fileController = new FileController();

// File CRUD operations
router.get('/:id', asyncHandler(fileController.getFile.bind(fileController)));
router.put('/:id', asyncHandler(fileController.updateFile.bind(fileController)));
router.delete('/:id', asyncHandler(fileController.deleteFile.bind(fileController)));
router.get('/:id/download', asyncHandler(fileController.downloadFile.bind(fileController)));

// File upload
router.post('/upload', asyncHandler(fileController.uploadFile.bind(fileController)));

// File analysis
router.get('/:id/ast', asyncHandler(fileController.getAST.bind(fileController)));
router.post('/:id/analyze', asyncHandler(fileController.analyzeFile.bind(fileController)));

export default router;