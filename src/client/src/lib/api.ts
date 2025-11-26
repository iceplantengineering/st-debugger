import axios from 'axios';
import type {
  Project,
  CodeAnalysisResult,
  AnalysisRequest,
  CodeIssue,
  FixSuggestion,
  ExportOptions
} from '../shared/types';

interface RuntimeDataQuery {
  dataType?: string;
  startTime?: Date;
  endTime?: Date;
}

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

// API Client class
export class APIClient {
  // Project Management
  async getProjects(page = 1, limit = 10, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const response = await apiClient.get(`/projects?${params}`);
    return response.data;
  }

  async createProject(projectData: Partial<Project>) {
    const response = await apiClient.post('/projects', projectData);
    return response.data;
  }

  async getProject(id: string) {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  }

  async updateProject(id: string, updates: Partial<Project>) {
    const response = await apiClient.put(`/projects/${id}`, updates);
    return response.data;
  }

  async deleteProject(id: string) {
    const response = await apiClient.delete(`/projects/${id}`);
    return response.data;
  }

  async getProjectFiles(id: string) {
    const response = await apiClient.get(`/projects/${id}/files`);
    return response.data;
  }

  async getProjectDependencies(id: string) {
    const response = await apiClient.get(`/projects/${id}/dependencies`);
    return response.data;
  }

  async getProjectVariables(id: string) {
    const response = await apiClient.get(`/projects/${id}/variables`);
    return response.data;
  }

  async getRuntimeData(id: string, query: RuntimeDataQuery) {
    const params = new URLSearchParams();
    if (query.dataType) params.append('dataType', query.dataType);
    if (query.startTime) params.append('startTime', query.startTime.toISOString());
    if (query.endTime) params.append('endTime', query.endTime.toISOString());

    const response = await apiClient.get(`/projects/${id}/runtime-data?${params}`);
    return response.data;
  }

  // Code Analysis
  async analyzeProject(id: string, request: AnalysisRequest): Promise<CodeAnalysisResult> {
    const response = await apiClient.post(`/projects/${id}/analyze`, request);
    return response.data.data;
  }

  async analyzeIssues(request: { projectId: string; focusedPou?: string; options: any }) {
    const response = await apiClient.post('/analysis/issues', request);
    return response.data.data;
  }

  async suggestFixes(issueId: string, projectId: string) {
    const response = await apiClient.post('/analysis/suggest-fixes', { issueId, projectId });
    return response.data.data;
  }

  async optimizeCode(fileId: string, optimizationGoals: string[]) {
    const response = await apiClient.post('/analysis/optimize-code', { fileId, optimizationGoals });
    return response.data.data;
  }

  async generateTestCases(fileId: string, testOptions: any) {
    const response = await apiClient.post('/analysis/generate-test', { fileId, testOptions });
    return response.data.data;
  }

  // AI Services
  async analyzeCodeWithAI(code: string, options: any) {
    const response = await apiClient.post('/ai/analyze-code', { code, options });
    return response.data.data;
  }

  async generateFixesWithAI(issue: CodeIssue, pou: any) {
    const response = await apiClient.post('/ai/generate-fixes', { issue, pou });
    return response.data.data;
  }

  async optimizeCodeWithAI(pou: any, optimizationGoals: string[]) {
    const response = await apiClient.post('/ai/optimize-code', { pou, optimizationGoals });
    return response.data.data;
  }

  async generateTestsWithAI(pou: any) {
    const response = await apiClient.post('/ai/generate-tests', { pou });
    return response.data.data;
  }

  async chatWithAI(message: string, context: any) {
    const response = await apiClient.post('/ai/chat', { message, context });
    return response.data.data;
  }

  // File Management
  async getFile(id: string) {
    const response = await apiClient.get(`/files/${id}`);
    return response.data.data;
  }

  async updateFile(id: string, updates: any) {
    const response = await apiClient.put(`/files/${id}`, updates);
    return response.data.data;
  }

  async deleteFile(id: string) {
    const response = await apiClient.delete(`/files/${id}`);
    return response.data;
  }

  async downloadFile(id: string) {
    const response = await apiClient.get(`/files/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getFileAST(id: string) {
    const response = await apiClient.get(`/files/${id}/ast`);
    return response.data.data;
  }

  async analyzeFile(id: string, options: any) {
    const response = await apiClient.post(`/files/${id}/analyze`, options);
    return response.data.data;
  }

  // Import/Export
  async importVariableSnapshots(projectId: string, csvContent: string, options: any) {
    const response = await apiClient.post('/import/variables', { projectId, csvContent, options });
    return response.data.data;
  }

  async importTraceLogs(projectId: string, csvContent: string, options: any) {
    const response = await apiClient.post('/import/traces', { projectId, csvContent, options });
    return response.data.data;
  }

  async importErrorLogs(projectId: string, csvContent: string, options: any) {
    const response = await apiClient.post('/import/errors', { projectId, csvContent, options });
    return response.data.data;
  }

  async importProject(files: File[], options: any) {
    const formData = new FormData();

    files.forEach(file => {
      formData.append('files', file);
    });

    formData.append('options', JSON.stringify(options));

    const response = await apiClient.post('/import/project', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async exportProject(id: string, options: ExportOptions) {
    const params = new URLSearchParams();
    if (options.format) params.append('format', options.format);
    if (options.includeSource) params.append('includeSource', 'true');
    if (options.includeMetadata) params.append('includeMetadata', 'true');
    if (options.includeDocumentation) params.append('includeDocumentation', 'true');
    if (options.includeDiff) params.append('includeDiff', 'true');
    if (options.versionId) params.append('versionId', options.versionId);

    const response = await apiClient.get(`/export/projects/${id}?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportVersion(projectId: string, versionId: string) {
    const response = await apiClient.get(`/export/projects/${projectId}/versions/${versionId}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportDiff(projectId: string, fromVersion: string, toVersion: string) {
    const response = await apiClient.get(`/export/projects/${projectId}/diff/${fromVersion}/${toVersion}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Version Management
  async getProjectVersions(projectId: string) {
    const response = await apiClient.get(`/versions/projects/${projectId}`);
    return response.data.data;
  }

  async createVersion(projectId: string, versionData: any) {
    const response = await apiClient.post(`/versions/projects/${projectId}`, versionData);
    return response.data.data;
  }

  async getVersion(versionId: string) {
    const response = await apiClient.get(`/versions/${versionId}`);
    return response.data.data;
  }

  async compareVersions(versionId: string, otherVersionId: string) {
    const response = await apiClient.get(`/versions/${versionId}/compare/${otherVersionId}`);
    return response.data.data;
  }

  async checkoutVersion(versionId: string) {
    const response = await apiClient.post(`/versions/${versionId}/checkout`);
    return response.data.data;
  }

  // History and Activity
  async getProjectTimeline(projectId: string, options: any) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.startDate) params.append('startDate', options.startDate.toISOString());
    if (options.endDate) params.append('endDate', options.endDate.toISOString());

    const response = await apiClient.get(`/history/projects/${projectId}/timeline?${params}`);
    return response.data.data;
  }

  async getVariableHistory(projectId: string, variableName: string, options: any) {
    const params = new URLSearchParams();
    if (options.startTime) params.append('startTime', options.startTime.toISOString());
    if (options.endTime) params.append('endTime', options.endTime.toISOString());

    const response = await apiClient.get(`/history/projects/${projectId}/variables/${variableName}/history?${params}`);
    return response.data.data;
  }

  async getFileChangeHistory(projectId: string, fileId: string, options: any) {
    const params = new URLSearchParams();
    if (options.startTime) params.append('startTime', options.startTime.toISOString());
    if (options.endTime) params.append('endTime', options.endTime.toISOString());

    const response = await apiClient.get(`/history/projects/${projectId}/files/${fileId}/history?${params}`);
    return response.data.data;
  }

  async recordActivity(projectId: string, activity: any, userId?: string, context?: any) {
    const response = await apiClient.post(`/history/projects/${projectId}/activity`, {
      activity,
      userId,
      context,
    });
    return response.data.data;
  }

  // Health Check
  async healthCheck() {
    const response = await apiClient.get('/health');
    return response.data;
  }

  // Demo endpoints
  async getDemoProjects() {
    const response = await apiClient.get('/demo/projects');
    return response.data;
  }

  async runDemoAnalysis(projectId: string) {
    const response = await apiClient.post(`/demo/projects/${projectId}/analyze`);
    return response.data;
  }
}

// Export singleton instance
export const api = new APIClient();

// Export types for convenience
export type {
  Project,
  CodeAnalysisResult,
  CodeIssue,
  FixSuggestion,
  RuntimeDataQuery
};