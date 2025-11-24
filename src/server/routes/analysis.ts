import { Router } from 'express';
import { AnalysisController } from '../controllers/analysisController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const analysisController = new AnalysisController();

// Analysis endpoints
router.post('/issues', asyncHandler(analysisController.analyzeIssues.bind(analysisController)));
router.post('/suggest-fixes', asyncHandler(analysisController.suggestFixes.bind(analysisController)));
router.post('/optimize-code', asyncHandler(analysisController.optimizeCode.bind(analysisController)));
router.post('/generate-test', asyncHandler(analysisController.generateTest.bind(analysisController)));

export default router;