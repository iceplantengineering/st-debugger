import { Request, Response } from 'express';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { POUFile } from '../../shared/types';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export class FileController {
  private upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    }),
    fileFilter: (req, file, cb) => {
      // Accept ST-related files
      const allowedExtensions = ['.st', '.prg', '.fnc', '.fb', '.txt'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedExtensions.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only .st, .prg, .fnc, .fb, .txt files are allowed.'));
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  });

  // POST /api/files/upload
  uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
      this.upload.single('file')(req, res, (error: any) => {
        if (error) {
          logger.error('File upload error:', error);
          if (error.code === 'LIMIT_FILE_SIZE') {
            throw createError('File size exceeds the maximum limit (10MB)', 400);
          }
          throw createError('File upload failed', 400);
        }

        if (!req.file) {
          throw createError('No file uploaded', 400);
        }

        const fileData = {
          id: Date.now().toString(),
          originalName: req.file.originalname,
          filename: req.file.filename,
          path: req.file.path,
          size: req.file.size,
          type: path.extname(req.file.originalname).toLowerCase(),
          uploadedAt: new Date()
        };

        const response = {
          success: true,
          data: fileData,
          message: 'File uploaded successfully'
        };

        logger.info(`File uploaded: ${req.file.originalname} (${req.file.size} bytes)`);
        res.status(201).json(response);
      });
    } catch (error) {
      logger.error('File upload failed:', error);
      throw createError('File upload failed', 500);
    }
  };

  // GET /api/files/:id
  getFile = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      // Mock implementation - would fetch from database
      const mockFile: POUFile = {
        id: id || 'unknown',
        name: 'SampleFile',
        type: 'PROGRAM',
        filePath: `/uploads/${id}.st`,
        content: 'PROGRAM SampleFile\nVAR\n  testVar: INT;\nEND_VAR\ntestVar := 0;\nEND_PROGRAM',
        ast: { type: 'PROGRAM', children: [], lineNumber: 1, columnNumber: 1, scope: 'global' },
        variables: [],
        dependencies: [],
        instances: [],
        version: '1.0.0',
        lastModified: new Date(),
        description: 'Sample ST file'
      };

      const response = {
        success: true,
        data: mockFile,
        message: 'File retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error(`Failed to get file ${id}:`, error);
      throw createError('Failed to retrieve file', 500);
    }
  };

  // PUT /api/files/:id
  updateFile = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updates = req.body;

    try {
      // Mock implementation
      const updatedFile = {
        id,
        ...updates,
        lastModified: new Date()
      };

      const response = {
        success: true,
        data: updatedFile,
        message: 'File updated successfully'
      };

      logger.info(`File ${id} updated successfully`);
      res.json(response);
    } catch (error) {
      logger.error(`Failed to update file ${id}:`, error);
      throw createError('Failed to update file', 500);
    }
  };

  // DELETE /api/files/:id
  deleteFile = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      // Mock implementation
      logger.info(`File deleted: ${id}`);

      const response = {
        success: true,
        data: { id },
        message: 'File deleted successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error(`Failed to delete file ${id}:`, error);
      throw createError('Failed to delete file', 500);
    }
  };

  // GET /api/files/:id/download
  downloadFile = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Mock implementation
    const fileContent = 'PROGRAM SampleFile\nVAR\n  testVar: INT;\nEND_VAR\ntestVar := 0;\nEND_PROGRAM';

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="SampleFile_${id}.st"`);
    res.send(fileContent);
  };

  // GET /api/files/:id/ast
  getAST = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Mock AST
    const mockAST = {
      type: 'PROGRAM',
      children: [
        {
          type: 'VAR_DECLARATION',
          name: 'testVar',
          dataType: 'INT',
          children: []
        },
        {
          type: 'ASSIGNMENT',
          name: 'testVar',
          value: '0',
          children: []
        }
      ]
    };

    const response = {
      success: true,
      data: mockAST,
      message: 'AST retrieved successfully'
    };

    res.json(response);
  };

  // POST /api/files/:id/analyze
  analyzeFile = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Mock analysis result
    const mockAnalysis = {
      issues: [
        {
          type: 'INFO',
          severity: 'WARNING',
          title: 'Unused Variable',
          description: 'Variable testVar is declared but not used'
        }
      ],
      metrics: {
        complexity: 1,
        lines: 4,
        variables: 1
      }
    };

    const response = {
      success: true,
      data: mockAnalysis,
      message: 'File analysis completed'
    };

    res.json(response);
  };
}