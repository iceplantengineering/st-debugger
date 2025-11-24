import { Router } from 'express';
import { AIController } from '../controllers/aiController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const aiController = new AIController();

// AI service endpoints
router.post('/analyze-code', asyncHandler(aiController.analyzeCode.bind(aiController)));
router.post('/generate-fixes', asyncHandler(aiController.generateFixes.bind(aiController)));
router.post('/optimize-code', asyncHandler(aiController.optimizeCode.bind(aiController)));
router.post('/generate-tests', asyncHandler(aiController.generateTests.bind(aiController)));
router.post('/chat', asyncHandler(aiController.chat.bind(aiController)));

export default router;