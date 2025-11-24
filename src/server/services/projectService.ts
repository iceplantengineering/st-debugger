import { Project, POUFile, DependencyGraph, VariableDictionary, RuntimeData, ApiResponse } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import { getQuery, allQuery, runQuery, batchRun } from '../models/database';
import { logger } from '../utils/logger';

export interface ProjectQueryOptions {
  page: number;
  limit: number;
  search?: string;
}

export interface RuntimeDataQuery {
  dataType?: string;
  startTime?: Date;
  endTime?: Date;
}

export class ProjectService {
  // GET all projects
  async getProjects(options: ProjectQueryOptions): Promise<{ projects: Project[]; total: number; page: number; limit: number }> {
    const { page, limit, search } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const projectsSql = `
      SELECT p.*,
             COUNT(f.id) as file_count
      FROM projects p
      LEFT JOIN files f ON p.id = f.project_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.updated_at DESC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM projects p
      ${whereClause}
    `;

    try {
      const [projectsData, countData] = await Promise.all([
        allQuery(projectsSql, [...params, limit, offset]),
        getQuery(countSql, params)
      ]);

      const projects = await Promise.all(
        projectsData.map((row: any) => this.mapRowToProject(row))
      );

      return {
        projects,
        total: countData.total,
        page,
        limit
      };
    } catch (error) {
      logger.error('Error fetching projects:', error);
      throw error;
    }
  }

  // GET project by ID
  async getProject(id: string): Promise<Project | null> {
    try {
      const projectSql = `
        SELECT * FROM projects WHERE id = ?
      `;

      const projectRow = await getQuery(projectSql, [id]);
      if (!projectRow) {
        return null;
      }

      // Get project files
      const filesSql = `
        SELECT * FROM files WHERE project_id = ? ORDER BY name
      `;
      const filesData = await allQuery(filesSql, [id]);

      // Get variables for all files
      const files = await Promise.all(
        filesData.map((fileRow: any) => this.mapRowToFile(fileRow))
      );

      // Get dependencies
      const dependencies = await this.getProjectDependencies(id);

      // Get runtime data
      const runtimeData = await this.getProjectRuntimeData(id);

      const project: Project = {
        id: projectRow.id,
        name: projectRow.name,
        description: projectRow.description || '',
        version: projectRow.version,
        createdAt: new Date(projectRow.created_at),
        updatedAt: new Date(projectRow.updated_at),
        files,
        dependencies,
        variables: this.buildVariableDictionary(files),
        runtimeData,
        lastAnalysisTime: projectRow.last_analysis_time ? new Date(projectRow.last_analysis_time) : undefined
      };

      return project;
    } catch (error) {
      logger.error(`Error fetching project ${id}:`, error);
      throw error;
    }
  }

  // CREATE new project
  async createProject(projectData: Partial<Project>): Promise<Project> {
    const id = uuidv4();
    const now = new Date();

    const sql = `
      INSERT INTO projects (
        id, name, description, version, created_at, updated_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      projectData.name,
      projectData.description || '',
      projectData.version || '1.0.0',
      now.toISOString(),
      now.toISOString(),
      JSON.stringify({})
    ];

    try {
      await runQuery(sql, params);

      // Create project with empty data
      const project: Project = {
        id,
        name: projectData.name!,
        description: projectData.description || '',
        version: projectData.version || '1.0.0',
        createdAt: now,
        updatedAt: now,
        files: projectData.files || [],
        dependencies: { nodes: [], edges: [] },
        variables: {}
      };

      logger.info(`Created project: ${id} - ${project.name}`);
      return project;
    } catch (error) {
      logger.error('Error creating project:', error);
      throw error;
    }
  }

  // UPDATE project
  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const existingProject = await this.getProject(id);
    if (!existingProject) {
      return null;
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      params.push(updates.name);
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      params.push(updates.description);
    }
    if (updates.version !== undefined) {
      updateFields.push('version = ?');
      params.push(updates.version);
    }

    if (updateFields.length === 0) {
      return existingProject; // No updates to make
    }

    updateFields.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const sql = `
      UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?
    `;

    try {
      await runQuery(sql, params);

      // Return updated project
      const updatedProject = await this.getProject(id);
      logger.info(`Updated project: ${id}`);
      return updatedProject;
    } catch (error) {
      logger.error(`Error updating project ${id}:`, error);
      throw error;
    }
  }

  // DELETE project
  async deleteProject(id: string): Promise<boolean> {
    try {
      const result = await runQuery('DELETE FROM projects WHERE id = ?', [id]);
      const deleted = result.changes > 0;

      if (deleted) {
        logger.info(`Deleted project: ${id}`);
      }

      return deleted;
    } catch (error) {
      logger.error(`Error deleting project ${id}:`, error);
      throw error;
    }
  }

  // GET project dependencies
  async getDependencies(projectId: string): Promise<DependencyGraph> {
    try {
      const sql = `
        SELECT d.*,
               sf.name as source_file_name,
               tf.name as target_file_name
        FROM dependencies d
        LEFT JOIN files sf ON d.source_file_id = sf.id
        LEFT JOIN files tf ON d.target_file_id = tf.id
        WHERE d.project_id = ?
      `;

      const dependencies = await allQuery(sql, [projectId]);

      // Build dependency graph
      const nodes: any[] = [];
      const edges: any[] = [];
      const nodeSet = new Set<string>();

      dependencies.forEach((dep: any) => {
        // Add source node
        if (!nodeSet.has(dep.source_file_id)) {
          nodes.push({
            id: dep.source_file_id,
            name: dep.source_file_name,
            type: 'PROGRAM', // Default type, should be determined from file data
            position: { x: 0, y: 0 },
            data: { variables: 0, dependencies: 0, instances: 0 }
          });
          nodeSet.add(dep.source_file_id);
        }

        // Add target node
        if (dep.target_file_id && !nodeSet.has(dep.target_file_id)) {
          nodes.push({
            id: dep.target_file_id,
            name: dep.target_file_name,
            type: 'PROGRAM', // Default type
            position: { x: 0, y: 0 },
            data: { variables: 0, dependencies: 0, instances: 0 }
          });
          nodeSet.add(dep.target_file_id);
        }

        // Add edge
        if (dep.target_file_id) {
          edges.push({
            id: dep.id,
            source: dep.source_file_id,
            target: dep.target_file_id,
            type: dep.dependency_type,
            data: {
              strength: dep.strength,
              instanceName: dep.dependency_name
            }
          });
        }
      });

      return { nodes, edges };
    } catch (error) {
      logger.error(`Error fetching dependencies for project ${projectId}:`, error);
      return { nodes: [], edges: [] };
    }
  }

  // GET project variables
  async getProjectVariables(projectId: string): Promise<VariableDictionary> {
    try {
      const sql = `
        SELECT v.*, f.name as file_name
        FROM variables v
        JOIN files f ON v.file_id = f.id
        WHERE f.project_id = ?
        ORDER BY v.name
      `;

      const variables = await allQuery(sql, [projectId]);

      const variableDict: VariableDictionary = {};
      variables.forEach((variable: any) => {
        variableDict[variable.name] = {
          name: variable.name,
          dataType: variable.data_type,
          address: variable.address,
          initialValue: variable.initial_value,
          scope: variable.scope,
          isConstant: Boolean(variable.is_constant),
          description: variable.description
        };
      });

      return variableDict;
    } catch (error) {
      logger.error(`Error fetching variables for project ${projectId}:`, error);
      return {};
    }
  }

  // GET runtime data
  async getRuntimeData(projectId: string, query: RuntimeDataQuery): Promise<RuntimeData | null> {
    try {
      let whereClause = 'WHERE project_id = ?';
      const params: any[] = [projectId];

      if (query.dataType) {
        whereClause += ' AND data_type = ?';
        params.push(query.dataType);
      }
      if (query.startTime) {
        whereClause += ' AND timestamp >= ?';
        params.push(query.startTime.toISOString());
      }
      if (query.endTime) {
        whereClause += ' AND timestamp <= ?';
        params.push(query.endTime.toISOString());
      }

      const sql = `
        SELECT * FROM runtime_data
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT 1000
      `;

      const runtimeDataRows = await allQuery(sql, params);

      // Parse runtime data based on type
      const runtimeData: RuntimeData = {
        variableSnapshots: [],
        traceLogs: [],
        errorLogs: []
      };

      runtimeDataRows.forEach((row: any) => {
        const data = JSON.parse(row.data);

        switch (row.data_type) {
          case 'VARIABLE_SNAPSHOT':
            runtimeData.variableSnapshots.push(data);
            break;
          case 'TRACE_LOG':
            runtimeData.traceLogs.push(data);
            break;
          case 'ERROR_LOG':
            runtimeData.errorLogs.push(data);
            break;
        }
      });

      return runtimeData;
    } catch (error) {
      logger.error(`Error fetching runtime data for project ${projectId}:`, error);
      return null;
    }
  }

  // Helper methods
  private async mapRowToProject(row: any): Promise<Project> {
    // This would need to fetch files, dependencies, etc.
    // For now, return basic project structure
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      version: row.version,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      files: [],
      dependencies: { nodes: [], edges: [] },
      variables: {}
    };
  }

  private async mapRowToFile(row: any): Promise<POUFile> {
    // Get variables for this file
    const variablesSql = 'SELECT * FROM variables WHERE file_id = ?';
    const variablesData = await allQuery(variablesSql, [row.id]);

    return {
      id: row.id,
      name: row.name,
      type: row.type,
      filePath: row.file_path || '',
      content: row.content || '',
      ast: row.ast ? JSON.parse(row.ast) : { type: 'PROGRAM', children: [], lineNumber: 1, columnNumber: 1, scope: 'global' },
      variables: variablesData.map((variable: any) => ({
        name: variable.name,
        dataType: variable.data_type,
        address: variable.address,
        initialValue: variable.initial_value,
        scope: variable.scope,
        isConstant: Boolean(variable.is_constant),
        description: variable.description
      })),
      dependencies: [], // Would need to be populated separately
      instances: [],    // Would need to be populated separately
      version: row.version || '1.0.0',
      lastModified: new Date(row.last_modified),
      description: row.description
    };
  }

  private buildVariableDictionary(files: POUFile[]): VariableDictionary {
    const variables: VariableDictionary = {};

    files.forEach(file => {
      file.variables.forEach(variable => {
        variables[variable.name] = variable;
      });
    });

    return variables;
  }

  private async getProjectDependencies(projectId: string): Promise<DependencyGraph> {
    // Implementation already provided in getDependencies method
    return this.getDependencies(projectId);
  }

  private async getProjectRuntimeData(projectId: string): Promise<RuntimeData | null> {
    // Implementation already provided in getRuntimeData method
    return this.getRuntimeData(projectId, {});
  }
}