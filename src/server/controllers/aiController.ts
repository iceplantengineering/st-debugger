import { Request, Response } from 'express';
import { AIAnalysisService } from '../services/aiAnalysisService';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AIController {
  private aiService: AIAnalysisService;

  constructor() {
    this.aiService = new AIAnalysisService();
  }

  // POST /api/ai/analyze-code
  analyzeCode = async (req: Request, res: Response): Promise<void> => {
    const { code, options } = req.body;

    if (!code || typeof code !== 'string') {
      throw createError('Code is required', 400);
    }

    try {
      const analysis = await this.aiService.analyzeWithAI({
        id: 'temp',
        name: 'Temp Analysis',
        description: '',
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        files: [{
          id: 'temp-file',
          name: 'Temp',
          type: 'PROGRAM',
          filePath: '',
          content: code,
          ast: { type: 'PROGRAM', children: [], lineNumber: 1, columnNumber: 1, scope: 'global' },
          variables: [],
          dependencies: [],
          instances: [],
          version: '1.0.0',
          lastModified: new Date()
        }],
        dependencies: { nodes: [], edges: [] },
        variables: {}
      }, options || {});

      const response = {
        success: true,
        data: analysis,
        message: 'Code analysis completed'
      };

      res.json(response);
    } catch (error) {
      logger.error('AI code analysis failed:', error);
      throw createError('AI analysis failed', 500);
    }
  };

  // POST /api/ai/generate-fixes
  generateFixes = async (req: Request, res: Response): Promise<void> => {
    const { issue, pou } = req.body;

    if (!issue || !pou) {
      throw createError('Issue and POU data are required', 400);
    }

    try {
      const fixes = await this.aiService.generateFixSuggestions(issue, pou);

      const response = {
        success: true,
        data: fixes,
        message: 'Fix suggestions generated'
      };

      res.json(response);
    } catch (error) {
      logger.error('Fix generation failed:', error);
      throw createError('Fix generation failed', 500);
    }
  };

  // POST /api/ai/optimize-code
  optimizeCode = async (req: Request, res: Response): Promise<void> => {
    const { pou, optimizationGoals } = req.body;

    if (!pou) {
      throw createError('POU data is required', 400);
    }

    try {
      const optimized = await this.aiService.generateOptimizedCode(
        pou,
        optimizationGoals || ['performance', 'readability']
      );

      const response = {
        success: true,
        data: optimized,
        message: 'Code optimization completed'
      };

      res.json(response);
    } catch (error) {
      logger.error('Code optimization failed:', error);
      throw createError('Code optimization failed', 500);
    }
  };

  // POST /api/ai/generate-tests
  generateTests = async (req: Request, res: Response): Promise<void> => {
    const { pou } = req.body;

    if (!pou) {
      throw createError('POU data is required', 400);
    }

    try {
      const testCases = await this.aiService.generateTestCases(pou);

      const response = {
        success: true,
        data: testCases,
        message: 'Test cases generated'
      };

      res.json(response);
    } catch (error) {
      logger.error('Test generation failed:', error);
      throw createError('Test generation failed', 500);
    }
  };

  // POST /api/ai/chat
  chat = async (req: Request, res: Response): Promise<void> => {
    const { message, context } = req.body;

    if (!message) {
      throw createError('Message is required', 400);
    }

    try {
      // Simple chat response - in production, you'd integrate with a chat AI service
      const chatResponse = {
        message: 'This is a mock chat response. In production, this would integrate with an AI chat service.',
        timestamp: new Date().toISOString()
      };

      const response = {
        success: true,
        data: chatResponse,
        message: 'Chat response generated'
      };

      res.json(response);
    } catch (error) {
      logger.error('AI chat failed:', error);
      throw createError('AI chat failed', 500);
    }
  };
}