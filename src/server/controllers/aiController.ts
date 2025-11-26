import { Request, Response } from 'express';
import { AIAnalysisService } from '../services/aiAnalysisService';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AIController {
  private aiService: AIAnalysisService;

  constructor() {
    this.aiService = new AIAnalysisService();
  }

  // POST /api/ai/analyze
  analyzeCode = async (req: Request, res: Response): Promise<void> => {
    const { projectId, code, options } = req.body;

    if (!projectId || !code) {
      throw createError('Project ID and code are required', 400);
    }

    try {
      const analysisResult = await this.aiService.analyzeWithAI({
        id: projectId,
        name: 'Analysis Request',
        description: '',
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        files: [{
          id: 'temp',
          name: 'temp',
          type: 'PROGRAM',
          filePath: '',
          content: code,
          ast: { type: 'PROGRAM', children: [], lineNumber: 1, columnNumber: 1, scope: 'global' },
          variables: [],
          dependencies: [],
          instances: [],
          version: '1.0.0',
          lastModified: new Date(),
        }],
        dependencies: { nodes: [], edges: [] },
        variables: {},
      }, {
        projectId,
        options: options || {
          includeRuntimeData: false,
          severityLevel: ['CRITICAL', 'ERROR', 'WARNING', 'INFO'],
          issueTypes: ['SYNTAX_ERROR', 'RUNTIME_ERROR', 'LOGIC_ERROR', 'PERFORMANCE_ISSUE', 'STYLE_VIOLATION', 'SAFETY_CONCERN'],
          includeSuggestions: true,
        },
      });

      const response = {
        success: true,
        data: analysisResult,
        message: 'AI analysis completed successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('AI analysis failed:', error);
      throw createError('AI analysis failed', 500);
    }
  };

  // POST /api/ai/fix-suggestions
  getFixSuggestions = async (req: Request, res: Response): Promise<void> => {
    const { issue, code } = req.body;

    if (!issue || !code) {
      throw createError('Issue and code are required', 400);
    }

    try {
      const suggestions = await this.aiService.generateFixSuggestions(issue, {
        id: 'temp',
        name: 'temp',
        type: 'PROGRAM',
        filePath: '',
        content: code,
        ast: { type: 'PROGRAM', children: [], lineNumber: 1, columnNumber: 1, scope: 'global' },
        variables: [],
        dependencies: [],
        instances: [],
        version: '1.0.0',
        lastModified: new Date(),
      });

      const response = {
        success: true,
        data: suggestions,
        message: 'Fix suggestions generated successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('Fix suggestion generation failed:', error);
      throw createError('Fix suggestion generation failed', 500);
    }
  };

  // POST /api/ai/optimize
  optimizeCode = async (req: Request, res: Response): Promise<void> => {
    const { code, optimizationGoals } = req.body;

    if (!code) {
      throw createError('Code is required', 400);
    }

    try {
      const optimizedCode = await this.aiService.generateOptimizedCode({
        id: 'temp',
        name: 'temp',
        type: 'PROGRAM',
        filePath: '',
        content: code,
        ast: { type: 'PROGRAM', children: [], lineNumber: 1, columnNumber: 1, scope: 'global' },
        variables: [],
        dependencies: [],
        instances: [],
        version: '1.0.0',
        lastModified: new Date(),
      }, optimizationGoals || ['performance', 'readability']);

      const response = {
        success: true,
        data: optimizedCode,
        message: 'Code optimization completed successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('Code optimization failed:', error);
      throw createError('Code optimization failed', 500);
    }
  };

  // POST /api/ai/generate-tests
  generateTests = async (req: Request, res: Response): Promise<void> => {
    const { code } = req.body;

    if (!code) {
      throw createError('Code is required', 400);
    }

    try {
      const testCases = await this.aiService.generateTestCases({
        id: 'temp',
        name: 'temp',
        type: 'PROGRAM',
        filePath: '',
        content: code,
        ast: { type: 'PROGRAM', children: [], lineNumber: 1, columnNumber: 1, scope: 'global' },
        variables: [],
        dependencies: [],
        instances: [],
        version: '1.0.0',
        lastModified: new Date(),
      });

      const response = {
        success: true,
        data: testCases,
        message: 'Test cases generated successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('Test case generation failed:', error);
      throw createError('Test case generation failed', 500);
    }
  };

  // POST /api/ai/chat
  chatWithAI = async (req: Request, res: Response): Promise<void> => {
    const { message, context } = req.body;

    if (!message) {
      throw createError('Message is required', 400);
    }

    try {
      // Mock chat response for now
      const chatResponse = {
        success: true,
        data: {
          response: `AI Response to: ${message}`,
          suggestions: [],
          context: context || {},
        },
        message: 'Chat response generated successfully',
      };

      res.json(chatResponse);
    } catch (error) {
      logger.error('AI chat failed:', error);
      throw createError('AI chat failed', 500);
    }
  };
}