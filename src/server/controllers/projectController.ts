import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Project, POUFile, ApiResponse, AnalysisRequest } from '../../shared/types';
import { ProjectService } from '../services/projectService';
import { AnalysisService } from '../services/analysisService';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class ProjectController {
  private projectService: ProjectService;
  private analysisService: AnalysisService;

  constructor() {
    this.projectService = new ProjectService();
    this.analysisService = new AnalysisService();
  }

  // GET /api/projects
  getProjects = async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10, search } = req.query;

    const projects = await this.projectService.getProjects({
      page: Number(page),
      limit: Number(limit),
      search: search as string,
    });

    const response: ApiResponse = {
      success: true,
      data: projects,
    };

    res.json(response);
  };

  // POST /api/projects
  createProject = async (req: Request, res: Response): Promise<void> => {
    const { name, description, files } = req.body;

    if (!name || !name.trim()) {
      throw createError('Project name is required', 400);
    }

    const projectData: Partial<Project> = {
      name: name.trim(),
      description: description?.trim() || '',
      files: files || [],
      version: '1.0.0',
    };

    const project = await this.projectService.createProject(projectData);

    logger.info(`Project created: ${project.id} - ${project.name}`);

    const response: ApiResponse = {
      success: true,
      data: project,
      message: 'Project created successfully',
    };

    res.status(201).json(response);
  };

  // GET /api/projects/:id
  getProject = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const project = await this.projectService.getProject(id);

    if (!project) {
      throw createError('Project not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: project,
    };

    res.json(response);
  };

  // PUT /api/projects/:id
  updateProject = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updates = req.body;

    const project = await this.projectService.updateProject(id, updates);

    if (!project) {
      throw createError('Project not found', 404);
    }

    logger.info(`Project updated: ${id}`);

    const response: ApiResponse = {
      success: true,
      data: project,
      message: 'Project updated successfully',
    };

    res.json(response);
  };

  // DELETE /api/projects/:id
  deleteProject = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const deleted = await this.projectService.deleteProject(id);

    if (!deleted) {
      throw createError('Project not found', 404);
    }

    logger.info(`Project deleted: ${id}`);

    const response: ApiResponse = {
      success: true,
      message: 'Project deleted successfully',
    };

    res.json(response);
  };

  // GET /api/projects/:id/dependencies
  getDependencies = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const project = await this.projectService.getProject(id);
    if (!project) {
      throw createError('Project not found', 404);
    }

    const dependencies = await this.projectService.getDependencies(id);

    const response: ApiResponse = {
      success: true,
      data: dependencies,
    };

    res.json(response);
  };

  // GET /api/projects/:id/files
  getProjectFiles = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const project = await this.projectService.getProject(id);
    if (!project) {
      throw createError('Project not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: project.files,
    };

    res.json(response);
  };

  // GET /api/projects/:id/variables
  getProjectVariables = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const project = await this.projectService.getProject(id);
    if (!project) {
      throw createError('Project not found', 404);
    }

    const variables = await this.projectService.getProjectVariables(id);

    const response: ApiResponse = {
      success: true,
      data: variables,
    };

    res.json(response);
  };

  // GET /api/projects/:id/runtime-data
  getRuntimeData = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { dataType, startTime, endTime } = req.query;

    const project = await this.projectService.getProject(id);
    if (!project) {
      throw createError('Project not found', 404);
    }

    const runtimeData = await this.projectService.getRuntimeData(id, {
      dataType: dataType as string,
      startTime: startTime ? new Date(startTime as string) : undefined,
      endTime: endTime ? new Date(endTime as string) : undefined,
    });

    const response: ApiResponse = {
      success: true,
      data: runtimeData,
    };

    res.json(response);
  };

  // POST /api/projects/:id/analyze
  analyzeProject = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const analysisRequest: AnalysisRequest = req.body;

    const project = await this.projectService.getProject(id);
    if (!project) {
      throw createError('Project not found', 404);
    }

    logger.info(`Starting analysis for project: ${id}`);

    const startTime = Date.now();
    const analysisResult = await this.analysisService.analyzeProject(id, analysisRequest);
    const duration = Date.now() - startTime;

    logger.info(`Analysis completed for project: ${id} in ${duration}ms`);

    const response: ApiResponse = {
      success: true,
      data: analysisResult,
      message: 'Analysis completed successfully',
    };

    res.json(response);
  };
}