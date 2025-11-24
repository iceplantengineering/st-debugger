import { Project, CodeAnalysisResult, AnalysisRequest, CodeIssue, ASTNode } from '../../shared/types';
import { ProjectService } from './projectService';
import { AIAnalysisService } from './aiAnalysisService';
import { logger } from '../utils/logger';

export class AnalysisService {
  private projectService: ProjectService;
  private aiService: AIAnalysisService;

  constructor() {
    this.projectService = new ProjectService();
    this.aiService = new AIAnalysisService();
  }

  async analyzeProject(projectId: string, request: AnalysisRequest): Promise<CodeAnalysisResult> {
    const startTime = Date.now();
    logger.info(`Starting analysis for project ${projectId}`);

    try {
      // Get project data
      const project = await this.projectService.getProject(projectId);
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // Perform different types of analysis
      const issues: CodeIssue[] = [];

      // 1. Syntax and structural analysis
      const structuralIssues = await this.performStructuralAnalysis(project);
      issues.push(...structuralIssues);

      // 2. Cross-POU dependency analysis
      const dependencyIssues = await this.performDependencyAnalysis(project);
      issues.push(...dependencyIssues);

      // 3. Variable usage analysis
      const variableIssues = await this.performVariableAnalysis(project);
      issues.push(...variableIssues);

      // 4. Runtime data correlation (if available)
      const runtimeIssues = await this.performRuntimeAnalysis(project);
      issues.push(...runtimeIssues);

      // 5. AI-powered deep analysis
      if (request.options.includeSuggestions) {
        const aiIssues = await this.aiService.analyzeWithAI(project, request);
        issues.push(...aiIssues);
      }

      // Filter issues based on severity and type
      const filteredIssues = this.filterIssues(issues, request);

      // Sort by severity and confidence
      filteredIssues.sort((a, b) => {
        const severityScore = this.getSeverityScore(b.severity);
        const aScore = severityScore + b.confidence;
        const bScore = this.getSeverityScore(a.severity) + a.confidence;
        return bScore - aScore;
      });

      const analysisTime = Date.now() - startTime;

      const result: CodeAnalysisResult = {
        totalIssues: filteredIssues.length,
        criticalIssues: filteredIssues.filter(i => i.severity === 'CRITICAL').length,
        warnings: filteredIssues.filter(i => i.severity === 'WARNING').length,
        issues: filteredIssues,
        summary: await this.generateAnalysisSummary(project, filteredIssues),
        recommendations: this.generateRecommendations(filteredIssues)
      };

      logger.info(`Analysis completed for project ${projectId} in ${analysisTime}ms. Found ${result.totalIssues} issues`);

      // Store analysis result in database
      await this.storeAnalysisResult(projectId, result, request);

      return result;

    } catch (error) {
      logger.error(`Analysis failed for project ${projectId}:`, error);
      throw error;
    }
  }

  private async performStructuralAnalysis(project: Project): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    for (const pou of project.files) {
      // Check for infinite loops
      const loopIssues = this.analyzeLoops(pou);
      issues.push(...loopIssues);

      // Check for potential division by zero
      const divisionIssues = this.analyzeDivisionOperations(pou);
      issues.push(...divisionIssues);

      // Check for array bounds violations
      const arrayIssues = this.analyzeArrayAccess(pou);
      issues.push(...arrayIssues);

      // Check for proper variable initialization
      const initIssues = this.analyzeVariableInitialization(pou);
      issues.push(...initIssues);
    }

    return issues;
  }

  private async performDependencyAnalysis(project: Project): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(project.dependencies);
    circularDeps.forEach(cycle => {
      issues.push({
        id: `circular-dep-${Date.now()}`,
        type: 'CIRCULAR_DEPENDENCY',
        severity: 'ERROR',
        title: 'Circular Dependency Detected',
        description: `Circular dependency between: ${cycle.join(' -> ')}`,
        pouFiles: cycle,
        suggestion: 'Refactor to eliminate circular dependencies by creating an intermediate layer or using interfaces.',
        confidence: 0.95
      });
    });

    // Check for orphaned dependencies
    const orphanedDeps = this.findOrphanedDependencies(project);
    orphanedDeps.forEach(dep => {
      issues.push({
        id: `orphaned-dep-${Date.now()}`,
        type: 'POTENTIAL_IMPROVEMENT',
        severity: 'WARNING',
        title: 'Orphaned Dependency',
        description: `Dependency "${dep}" is declared but may not be used`,
        pouFiles: [dep],
        suggestion: 'Consider removing unused dependencies or verify their usage.',
        confidence: 0.7
      });
    });

    return issues;
  }

  private async performVariableAnalysis(project: Project): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    for (const pou of project.files) {
      // Check for unused variables
      const unusedVars = this.findUnusedVariables(pou);
      unusedVars.forEach(variable => {
        issues.push({
          id: `unused-var-${Date.now()}-${variable.name}`,
          type: 'UNUSED_VARIABLE',
          severity: 'WARNING',
          title: `Unused Variable: ${variable.name}`,
          description: `Variable ${variable.name} is declared but never used`,
          pouFiles: [pou.name],
          lineNumber: this.findVariableDeclarationLine(pou, variable.name),
          suggestion: `Remove unused variable ${variable.name} or use it in the code logic.`,
          confidence: 0.8
        });
      });

      // Check for variables without proper naming convention
      const namingIssues = this.checkVariableNaming(pou);
      issues.push(...namingIssues);

      // Check for potential data type mismatches
      const typeIssues = this.checkDataTypes(pou);
      issues.push(...typeIssues);
    }

    return issues;
  }

  private async performRuntimeAnalysis(project: Project): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    if (!project.runtimeData) {
      return issues;
    }

    // Analyze error logs
    if (project.runtimeData.errorLogs && project.runtimeData.errorLogs.length > 0) {
      const errorIssues = this.analyzeErrorLogs(project.runtimeData.errorLogs, project);
      issues.push(...errorIssues);
    }

    // Analyze trace logs for anomalies
    if (project.runtimeData.traceLogs && project.runtimeData.traceLogs.length > 0) {
      const traceIssues = this.analyzeTraceLogs(project.runtimeData.traceLogs, project);
      issues.push(...traceIssues);
    }

    // Analyze variable snapshots for unusual patterns
    if (project.runtimeData.variableSnapshots && project.runtimeData.variableSnapshots.length > 0) {
      const snapshotIssues = this.analyzeVariableSnapshots(project.runtimeData.variableSnapshots, project);
      issues.push(...snapshotIssues);
    }

    return issues;
  }

  private analyzeLoops(pou: any): CodeIssue[] {
    const issues: CodeIssue[] = [];

    const findLoops = (node: ASTNode, path: string[] = []): void => {
      if (node.type === 'FOR_LOOP') {
        // Check for potential infinite FOR loops
        if (node.value && node.value.includes('TO')) {
          const parts = node.value.split('TO');
          if (parts.length === 2) {
            const start = parseInt(parts[0].trim());
            const end = parseInt(parts[1].trim());

            if (start >= end) {
              issues.push({
                id: `loop-issue-${Date.now()}`,
                type: 'LOGIC_ERROR',
                severity: 'WARNING',
                title: 'Potential Infinite Loop',
                description: `FOR loop may never execute: start value (${start}) >= end value (${end})`,
                pouFiles: [pou.name],
                lineNumber: node.lineNumber,
                suggestion: 'Verify loop bounds or consider using a WHILE loop.',
                confidence: 0.8
              });
            }
          }
        }
      } else if (node.type === 'WHILE_LOOP') {
        // Check for WHILE loops without proper exit conditions
        issues.push({
          id: `while-check-${Date.now()}`,
          type: 'LOGIC_ERROR',
          severity: 'WARNING',
          title: 'WHILE Loop Safety Check',
          description: 'WHILE loop detected - ensure proper exit condition exists',
          pouFiles: [pou.name],
          lineNumber: node.lineNumber,
          suggestion: 'Add timeout or counter to prevent infinite loops.',
          confidence: 0.6
        });
      }

      if (node.children) {
        node.children.forEach(child => findLoops(child, [...path, node.type || '']));
      }
    };

    findLoops(pou.ast);
    return issues;
  }

  private analyzeDivisionOperations(pou: any): CodeIssue[] {
    const issues: CodeIssue[] = [];

    const findDivisions = (node: ASTNode): void => {
      if (node.type === 'ASSIGNMENT' && node.value) {
        const value = node.value as string;

        // Check for division operations
        if (value.includes('/') || value.includes('DIV')) {
          // Simple heuristic to check if divisor is validated
          if (!this.hasDivisionSafetyCheck(value, pou.content)) {
            issues.push({
              id: `division-safety-${Date.now()}`,
              type: 'RUNTIME_ERROR',
              severity: 'WARNING',
              title: 'Potential Division by Zero',
              description: 'Division operation detected without proper zero check',
              pouFiles: [pou.name],
              lineNumber: node.lineNumber,
              suggestion: 'Add zero check before division or use safe division function.',
              confidence: 0.7
            });
          }
        }
      }

      if (node.children) {
        node.children.forEach(findDivisions);
      }
    };

    findDivisions(pou.ast);
    return issues;
  }

  private analyzeArrayAccess(pou: any): CodeIssue[] {
    const issues: CodeIssue[] = [];

    const findArrayAccess = (node: ASTNode): void => {
      if (node.type === 'VARIABLE' && node.name && node.name.includes('[')) {
        // This is a simplified check - in practice, you'd want more sophisticated parsing
        const arrayMatch = node.name.match(/^(\w+)\[(.+)\]$/);
        if (arrayMatch) {
          const arrayName = arrayMatch[1];
          const index = arrayMatch[2];

          // Check if array bounds are validated
          if (!this.hasArrayBoundsCheck(arrayName, index, pou.content)) {
            issues.push({
              id: `array-bounds-${Date.now()}`,
              type: 'RUNTIME_ERROR',
              severity: 'WARNING',
              title: 'Potential Array Bounds Violation',
              description: `Array access without bounds validation: ${arrayName}[${index}]`,
              pouFiles: [pou.name],
              lineNumber: node.lineNumber,
              suggestion: 'Add bounds checking before array access.',
              confidence: 0.6
            });
          }
        }
      }

      if (node.children) {
        node.children.forEach(findArrayAccess);
      }
    };

    findArrayAccess(pou.ast);
    return issues;
  }

  private analyzeVariableInitialization(pou: any): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Find variables used before initialization
    const uninitializedVars = this.findUninitializedVariables(pou);

    uninitializedVars.forEach(variableName => {
      issues.push({
        id: `uninitialized-${Date.now()}`,
        type: 'RUNTIME_ERROR',
        severity: 'WARNING',
        title: `Potentially Uninitialized Variable: ${variableName}`,
        description: `Variable ${variableName} may be used before initialization`,
        pouFiles: [pou.name],
        suggestion: 'Initialize variables before use or add initialization logic.',
        confidence: 0.5
      });
    });

    return issues;
  }

  // Helper methods
  private detectCircularDependencies(dependencies: any): string[][] {
    // Simplified circular dependency detection
    // In practice, you'd use graph algorithms like Tarjan's strongly connected components
    return [];
  }

  private findOrphanedDependencies(project: Project): string[] {
    // Find dependencies that don't have corresponding files
    const declaredDeps = new Set<string>();
    project.files.forEach(pou => {
      pou.dependencies.forEach(dep => declaredDeps.add(dep));
    });

    const existingFiles = new Set<string>();
    project.files.forEach(pou => {
      existingFiles.add(pou.name);
    });

    return Array.from(declaredDeps).filter(dep => !existingFiles.has(dep));
  }

  private findUnusedVariables(pou: any): any[] {
    // Simplified unused variable detection
    // In practice, you'd traverse the AST and track variable usage
    return [];
  }

  private checkVariableNaming(pou: any): CodeIssue[] {
    const issues: CodeIssue[] = [];

    pou.variables.forEach((variable: any) => {
      // Check naming conventions
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable.name)) {
        issues.push({
          id: `naming-${Date.now()}-${variable.name}`,
          type: 'STYLE_VIOLATION',
          severity: 'INFO',
          title: `Invalid Variable Name: ${variable.name}`,
          description: `Variable name ${variable.name} doesn't follow standard naming conventions`,
          pouFiles: [pou.name],
          suggestion: 'Use alphanumeric characters and underscores, starting with a letter or underscore.',
          confidence: 0.9
        });
      }
    });

    return issues;
  }

  private checkDataTypes(pou: any): CodeIssue[] {
    // Simplified data type checking
    return [];
  }

  private analyzeErrorLogs(errorLogs: any[], project: Project): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Group errors by block and analyze patterns
    const errorGroups = this.groupErrorsByBlock(errorLogs);

    Object.entries(errorGroups).forEach(([blockName, errors]) => {
      if (errors.length > 5) { // Threshold for concerning error frequency
        issues.push({
          id: `error-pattern-${Date.now()}-${blockName}`,
          type: 'SAFETY_CONCERN',
          severity: 'ERROR',
          title: `High Error Rate in ${blockName}`,
          description: `Block ${blockName} has generated ${errors.length} errors`,
          pouFiles: [blockName],
          suggestion: 'Review error handling and logic in this block.',
          confidence: 0.8
        });
      }
    });

    return issues;
  }

  private analyzeTraceLogs(traceLogs: any[], project: Project): CodeIssue[] {
    // Analyze trace logs for performance issues and anomalies
    return [];
  }

  private analyzeVariableSnapshots(snapshots: any[], project: Project): CodeIssue[] {
    // Analyze variable snapshots for unusual values or trends
    return [];
  }

  private hasDivisionSafetyCheck(division: string, content: string): boolean {
    // Simple heuristic to check for division safety
    const lines = content.split('\n');
    return lines.some(line =>
      line.includes('IF') &&
      (line.includes('<> 0') || line.includes('> 0') || line.includes('!= 0'))
    );
  }

  private hasArrayBoundsCheck(arrayName: string, index: string, content: string): boolean {
    // Simple heuristic to check for array bounds validation
    const lines = content.split('\n');
    return lines.some(line =>
      line.includes(arrayName) &&
      (line.includes('>=') && line.includes('<='))
    );
  }

  private findUninitializedVariables(pou: any): string[] {
    // Simplified uninitialized variable detection
    return [];
  }

  private findVariableDeclarationLine(pou: any, variableName: string): number | undefined {
    const lines = pou.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(variableName) && lines[i].includes(':')) {
        return i + 1;
      }
    }
    return undefined;
  }

  private groupErrorsByBlock(errorLogs: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    errorLogs.forEach(error => {
      if (!groups[error.blockName]) {
        groups[error.blockName] = [];
      }
      groups[error.blockName].push(error);
    });
    return groups;
  }

  private filterIssues(issues: CodeIssue[], request: AnalysisRequest): CodeIssue[] {
    return issues.filter(issue => {
      // Filter by severity
      if (!request.options.severityLevel.includes(issue.severity)) {
        return false;
      }

      // Filter by issue type
      if (!request.options.issueTypes.includes(issue.type)) {
        return false;
      }

      // Filter by confidence threshold
      if (issue.confidence < 0.5) {
        return false;
      }

      return true;
    });
  }

  private getSeverityScore(severity: string): number {
    const scores = {
      'CRITICAL': 4,
      'ERROR': 3,
      'WARNING': 2,
      'INFO': 1
    };
    return scores[severity as keyof typeof scores] || 0;
  }

  private async generateAnalysisSummary(project: Project, issues: CodeIssue[]): Promise<any> {
    return {
      projectId: project.id,
      projectName: project.name,
      totalFiles: project.files.length,
      totalVariables: project.files.reduce((sum, pou) => sum + pou.variables.length, 0),
      analysisTime: new Date().toISOString(),
      complexityScore: this.calculateComplexityScore(project),
      safetyScore: this.calculateSafetyScore(issues),
      maintainabilityScore: this.calculateMaintainabilityScore(project, issues)
    };
  }

  private generateRecommendations(issues: CodeIssue[]): string[] {
    const recommendations: string[] = [];

    // Analyze patterns in issues and generate high-level recommendations
    const issueTypes = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (issueTypes['SAFETY_CONCERN'] > 0) {
      recommendations.push('Address safety concerns immediately to prevent potential runtime errors.');
    }

    if (issueTypes['CIRCULAR_DEPENDENCY'] > 0) {
      recommendations.push('Refactor circular dependencies to improve code maintainability.');
    }

    if (issueTypes['UNUSED_VARIABLE'] > 5) {
      recommendations.push('Consider removing unused variables to improve code clarity.');
    }

    if (issueTypes['RUNTIME_ERROR'] > 3) {
      recommendations.push('Add comprehensive error handling to prevent runtime failures.');
    }

    return recommendations;
  }

  private calculateComplexityScore(project: Project): number {
    // Simple complexity calculation based on file count, variable count, and dependencies
    let score = 0;
    score += project.files.length * 2;
    score += project.files.reduce((sum, pou) => sum + pou.variables.length, 0);
    score += project.dependencies.edges.length * 3;
    return Math.min(score, 100);
  }

  private calculateSafetyScore(issues: CodeIssue[]): number {
    const safetyIssues = issues.filter(issue =>
      issue.type === 'SAFETY_CONCERN' ||
      issue.type === 'RUNTIME_ERROR'
    );
    return Math.max(0, 100 - (safetyIssues.length * 10));
  }

  private calculateMaintainabilityScore(project: Project, issues: CodeIssue[]): number {
    const maintainabilityIssues = issues.filter(issue =>
      issue.type === 'STYLE_VIOLATION' ||
      issue.type === 'UNUSED_VARIABLE' ||
      issue.type === 'CIRCULAR_DEPENDENCY'
    );
    return Math.max(0, 100 - (maintainabilityIssues.length * 5));
  }

  private async storeAnalysisResult(projectId: string, result: CodeAnalysisResult, request: AnalysisRequest): Promise<void> {
    // Store analysis result in database for history tracking
    // This would be implemented with your database layer
    logger.info(`Storing analysis result for project ${projectId}`);
  }
}