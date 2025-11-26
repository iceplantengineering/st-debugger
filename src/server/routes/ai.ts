import { Router } from 'express';
import { AIController } from '../controllers/aiController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const aiController = new AIController();

// AI analysis endpoints
router.post('/analyze', asyncHandler(aiController.analyzeCode.bind(aiController)));
router.post('/fix-suggestions', asyncHandler(aiController.getFixSuggestions.bind(aiController)));
router.post('/optimize', asyncHandler(aiController.optimizeCode.bind(aiController)));
router.post('/generate-tests', asyncHandler(aiController.generateTests.bind(aiController)));

// AI chat/conversation endpoints
router.post('/chat', asyncHandler(aiController.chatWithAI.bind(aiController)));

export default router;