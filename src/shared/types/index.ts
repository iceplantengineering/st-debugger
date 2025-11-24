// Core data structures for ST Debugger

export interface Project {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  files: POUFile[];
  dependencies: DependencyGraph;
  variables: VariableDictionary;
  runtimeData?: RuntimeData;
  lastAnalysisTime?: Date;
  activeIssues?: CodeIssue[];
}

export interface POUFile {
  id: string;
  name: string;
  type: POUCategory;
  filePath: string;
  content: string;
  ast: ASTNode;
  variables: Variable[];
  dependencies: string[];
  instances: FBInstance[];
  version: string;
  lastModified: Date;
  description?: string;
}

export type POUCategory = 'PROGRAM' | 'FUNCTION_BLOCK' | 'FUNCTION';

export interface Variable {
  name: string;
  dataType: string;
  address?: string;
  initialValue?: any;
  scope: VariableScope;
  isConstant: boolean;
  description?: string;
}

export type VariableScope = 'LOCAL' | 'GLOBAL' | 'INPUT' | 'OUTPUT' | 'TEMP';

export interface ASTNode {
  type: ASTNodeType;
  name?: string;
  dataType?: string;
  value?: any;
  children: ASTNode[];
  lineNumber: number;
  columnNumber: number;
  scope: string;
}

export type ASTNodeType =
  | 'PROGRAM' | 'FUNCTION_BLOCK' | 'FUNCTION'
  | 'VAR_DECLARATION' | 'ASSIGNMENT' | 'IF_STATEMENT'
  | 'FOR_LOOP' | 'WHILE_LOOP' | 'FUNCTION_CALL'
  | 'VARIABLE' | 'LITERAL' | 'BINARY_EXPRESSION'
  | 'CASE_STATEMENT' | 'REPEAT_LOOP';

export interface FBInstance {
  name: string;
  type: string;
  count?: number;
  lineNumber: number;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  name: string;
  type: POUCategory;
  position: { x: number; y: number };
  data: {
    variables: number;
    dependencies: number;
    instances: number;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: DependencyType;
  data: {
    strength?: number;
    instanceName?: string;
    instanceCount?: number;
  };
}

export type DependencyType = 'DEPENDS_ON' | 'INSTANCE_OF' | 'CALLS';

export interface VariableDictionary {
  [key: string]: Variable;
}

// Runtime data structures
export interface RuntimeData {
  variableSnapshots: VariableSnapshot[];
  traceLogs: TraceLog[];
  errorLogs: ErrorLog[];
}

export interface VariableSnapshot {
  timestamp: Date;
  variables: VariableValue[];
}

export interface VariableValue {
  name: string;
  value: any;
  dataType: string;
  address: string;
  quality: DataQuality;
}

export type DataQuality = 'GOOD' | 'BAD' | 'UNCERTAIN';

export interface TraceLog {
  timestamp: Date;
  blockName: string;
  lineNumber: number;
  executionTime: number;
  variablesChanged: VariableChange[];
  triggerEvent: string;
}

export interface VariableChange {
  name: string;
  oldValue: any;
  newValue: any;
}

export interface ErrorLog {
  id: string;
  timestamp: Date;
  errorNumber: number;
  message: string;
  severity: ErrorSeverity;
  blockName: string;
  lineNumber?: number;
  details: Record<string, any>;
}

export type ErrorSeverity = 'FATAL' | 'ERROR' | 'WARNING' | 'INFO';

// AI Analysis structures
export interface CodeAnalysisResult {
  totalIssues: number;
  criticalIssues: number;
  warnings: number;
  issues: CodeIssue[];
  summary: AnalysisSummary;
  recommendations: string[];
}

export interface CodeIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  pouFiles: string[];
  lineNumber?: number;
  suggestion: string;
  confidence: number;
  context?: IssueContext;
}

export type IssueType =
  | 'SYNTAX_ERROR' | 'RUNTIME_ERROR' | 'LOGIC_ERROR'
  | 'PERFORMANCE_ISSUE' | 'STYLE_VIOLATION' | 'SAFETY_CONCERN'
  | 'POTENTIAL_IMPROVEMENT' | 'CIRCULAR_DEPENDENCY' | 'UNUSED_VARIABLE';

export type IssueSeverity = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';

export interface IssueContext {
    currentView?: string;
    focusedFile?: string;
    selectionRange?: {
      start: { line: number; column: number };
      end: { line: number; column: number };
    };
  };

export interface AnalysisSummary {
  complexityScore: number;
  safetyScore: number;
  maintainabilityScore: number;
  testCoverage: number;
}

// Fix suggestion structures
export interface FixSuggestion {
  id: string;
  title: string;
  description: string;
  codeChanges: CodeChange;
  explanation: string;
  sideEffects: string;
  confidence: number;
  estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CodeChange {
  original: string;
  replacement: string;
  lineNumber?: number;
  changeType: 'INSERT' | 'DELETE' | 'REPLACE';
}

// Code generation structures
export interface GeneratedCode {
  originalCode: string;
  fixedCode: string;
  optimizedCode: string;
  changes: CodeChange[];
  validation: CodeValidation;
}

export interface CodeValidation {
  isValid: boolean;
  syntaxErrors: string[];
  semanticErrors: string[];
  score: number;
  warnings: string[];
}

// Version control structures
export interface VersionInfo {
  id: string;
  projectId: string;
  version: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  changes: VersionChanges;
  parentVersionId?: string;
  tags: string[];
  metadata: VersionMetadata;
}

export interface VersionChanges {
  addedFiles: string[];
  modifiedFiles: string[];
  deletedFiles: string[];
  issuesFixed?: number;
  description: string;
}

export interface VersionMetadata {
  totalFilesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  issuesFixed: number;
}

// History tracking structures
export interface ProjectActivity {
  type: ActivityType;
  description: string;
  data: any;
  context?: any;
}

export type ActivityType =
  | 'PROJECT_CREATED' | 'FILE_UPLOADED' | 'CODE_ANALYZED'
  | 'ISSUES_FIXED' | 'VERSION_CREATED' | 'EXPORT_COMPLETED'
  | 'AI_ANALYSIS_RUN' | 'CODE_MODIFIED';

export interface HistoryEntry {
  id: string;
  projectId: string;
  timestamp: Date;
  activity: ProjectActivity;
  userId?: string;
  sessionId: string;
  context: ActivityContext;
  metadata: any;
}

export interface ActivityContext {
  projectVersion: string;
  fileCount: number;
  lastAnalysis?: Date;
  activeIssues: number;
  dependencies: number;
  recentErrors: ErrorLog[];
  userContext: {
    currentView: string;
    focusedFile?: string;
    selectionRange?: any;
  };
}

// API request/response types
export interface AnalysisRequest {
  projectId: string;
  focusedPou?: string;
  options: AnalysisOptions;
}

export interface AnalysisOptions {
  includeRuntimeData: boolean;
  severityLevel: IssueSeverity[];
  issueTypes: IssueType[];
  includeSuggestions: boolean;
}

export interface ImportRequest {
  files: FileData[];
  options: ImportOptions;
}

export interface FileData {
  name: string;
  content: string;
  type: string;
  size: number;
}

export interface ImportOptions {
  overwrite: boolean;
  createProject: boolean;
  analyzeOnImport: boolean;
}

export interface ExportRequest {
  projectId: string;
  format: ExportFormat;
  options: ExportOptions;
}

export type ExportFormat = 'ZIP' | 'DIFF' | 'PROJECT';

export interface ExportOptions {
  includeSource: boolean;
  includeMetadata: boolean;
  includeDocumentation: boolean;
  includeDiff: boolean;
  versionId?: string;
}

// Utility types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface FileSnapshot {
  id: string;
  name: string;
  type: POUCategory;
  content?: string;
  modifiedAt: Date;
  description?: string;
}