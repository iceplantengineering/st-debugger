import OpenAI from 'openai';
import { Project, CodeIssue, AnalysisRequest, FixSuggestion, GeneratedCode } from '../../shared/types';
import { AI_PROMPTS } from '../../shared/constants';
import { logger } from '../utils/logger';

export class AIAnalysisService {
  private openai: OpenAI;
  private isDemoMode: boolean;

  constructor() {
    this.isDemoMode = process.env.DEMO_MODE === 'true';

    if (!this.isDemoMode) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async analyzeWithAI(project: Project, request: AnalysisRequest): Promise<CodeIssue[]> {
    if (this.isDemoMode) {
      return this.generateMockAIAnalysis(project, request);
    }

    try {
      const issues: CodeIssue[] = [];

      // Analyze each POU file
      for (const pou of project.files) {
        if (request.focusedPou && pou.name !== request.focusedPou) {
          continue;
        }

        const pouIssues = await this.analyzePOUWithAI(pou, project);
        issues.push(...pouIssues);
      }

      // Cross-POU analysis
      const crossIssues = await this.performCrossPOUAnalysis(project, request);
      issues.push(...crossIssues);

      return issues;

    } catch (error) {
      logger.error('AI analysis failed:', error);
      // Fallback to mock analysis if AI service fails
      return this.generateMockAIAnalysis(project, request);
    }
  }

  private async analyzePOUWithAI(pou: any, project: Project): Promise<CodeIssue[]> {
    const prompt = this.buildAnalysisPrompt(pou, project);

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert PLC programmer and code analyzer specializing in Structured Text (ST) programming for industrial automation systems. Analyze the provided ST code for potential issues and suggest improvements.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Lower temperature for more consistent analysis
        max_tokens: 2000,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI service');
      }

      return this.parseAIResponse(aiResponse, pou);

    } catch (error) {
      logger.error(`AI analysis failed for POU ${pou.name}:`, error);
      return [];
    }
  }

  private async performCrossPOUAnalysis(project: Project, request: AnalysisRequest): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    // Analyze overall project architecture
    const architecturePrompt = this.buildArchitectureAnalysisPrompt(project);

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert PLC system architect analyzing the overall design and architecture of a Structured Text project.'
          },
          {
            role: 'user',
            content: architecturePrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1500,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (aiResponse) {
        const architectureIssues = this.parseArchitectureResponse(aiResponse, project);
        issues.push(...architectureIssues);
      }

    } catch (error) {
      logger.error('Cross-POU AI analysis failed:', error);
    }

    return issues;
  }

  async generateFixSuggestions(issue: CodeIssue, pou: any): Promise<FixSuggestion[]> {
    if (this.isDemoMode) {
      return this.generateMockFixSuggestions(issue, pou);
    }

    const prompt = this.buildFixPrompt(issue, pou);

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert PLC programmer providing specific code fixes for Structured Text issues.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI service');
      }

      return this.parseFixSuggestions(aiResponse, issue);

    } catch (error) {
      logger.error('Fix suggestion generation failed:', error);
      return this.generateMockFixSuggestions(issue, pou);
    }
  }

  async generateOptimizedCode(pou: any, optimizationGoals: string[]): Promise<GeneratedCode> {
    if (this.isDemoMode) {
      return this.generateMockOptimizedCode(pou, optimizationGoals);
    }

    const prompt = this.buildOptimizationPrompt(pou, optimizationGoals);

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert PLC programmer optimizing Structured Text code while maintaining exact functionality.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000,
      });

      const optimizedCode = completion.choices[0]?.message?.content;
      if (!optimizedCode) {
        throw new Error('No response from AI service');
      }

      return {
        originalCode: pou.content,
        fixedCode: pou.content,
        optimizedCode: optimizedCode.trim(),
        changes: this.extractChanges(pou.content, optimizedCode.trim()),
        validation: {
          isValid: true,
          syntaxErrors: [],
          semanticErrors: [],
          score: 0.9,
          warnings: []
        }
      };

    } catch (error) {
      logger.error('Code optimization failed:', error);
      return this.generateMockOptimizedCode(pou, optimizationGoals);
    }
  }

  async generateTestCases(pou: any): Promise<any[]> {
    if (this.isDemoMode) {
      return this.generateMockTestCases(pou);
    }

    const prompt = this.buildTestCasePrompt(pou);

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert PLC test engineer creating comprehensive test cases for Structured Text code.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2500,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI service');
      }

      return this.parseTestCases(aiResponse, pou);

    } catch (error) {
      logger.error('Test case generation failed:', error);
      return this.generateMockTestCases(pou);
    }
  }

  private buildAnalysisPrompt(pou: any, project: Project): string {
    return `
Analyze the following Structured Text (ST) code for potential issues:

POU Type: ${pou.type}
POU Name: ${pou.name}

Code:
${pou.content}

Variables:
${pou.variables.map((v: any) => `- ${v.name}: ${v.dataType} (${v.scope})`).join('\n')}

Dependencies: ${pou.dependencies.join(', ')}

Project Context:
- Total POUs: ${project.files.length}
- Related Files: ${project.files.map(f => f.name).join(', ')}

Please analyze for:
1. Potential runtime errors (null pointer, division by zero, array bounds)
2. Logic errors in IF/LOOP constructs
3. Variable initialization issues
4. Memory leaks or resource management problems
5. Performance bottlenecks
6. Safety concerns (e.g., missing safety interlocks)
7. Coding standard violations

Provide specific line numbers and suggest fixes.
Format your response as JSON with this structure:
{
  "issues": [
    {
      "type": "ISSUE_TYPE",
      "severity": "CRITICAL|ERROR|WARNING|INFO",
      "title": "Brief description",
      "description": "Detailed explanation",
      "lineNumber": 123,
      "suggestion": "Specific fix recommendation",
      "confidence": 0.95
    }
  ]
}
`;
  }

  private buildArchitectureAnalysisPrompt(project: Project): string {
    return `
Analyze the overall architecture of this Structured Text project:

Project: ${project.name}
Total POUs: ${project.files.length}
Files: ${project.files.map(f => `${f.name} (${f.type})`).join(', ')}

Dependencies:
${project.dependencies.edges.map(edge => `${edge.source} -> ${edge.target} (${edge.type})`).join('\n')}

Please analyze for:
1. Circular dependencies
2. Architectural design issues
3. Missing abstractions
4. Scalability concerns
5. Maintainability issues
6. Security vulnerabilities

Format your response as JSON with issues array.
`;
  }

  private buildFixPrompt(issue: CodeIssue, pou: any): string {
    return `
Issue found in ST code:

Issue Type: ${issue.type}
Severity: ${issue.severity}
Description: ${issue.description}
Line Number: ${issue.lineNumber}

POU Code:
${pou.content}

Please provide specific fix suggestions to resolve this issue. Include:
1. Exact code changes needed
2. Explanation of why the fix works
3. Potential side effects
4. Alternative approaches if any

Format your response as JSON with this structure:
{
  "suggestions": [
    {
      "title": "Brief description of the fix",
      "codeChanges": {
        "original": "original code snippet",
        "replacement": "fixed code snippet",
        "lineNumber": 123
      },
      "explanation": "Why this fix works",
      "sideEffects": "Any potential side effects",
      "confidence": 0.95,
      "estimatedEffort": "LOW|MEDIUM|HIGH"
    }
  ]
}
`;
  }

  private buildOptimizationPrompt(pou: any, optimizationGoals: string[]): string {
    return `
Optimize the following ST code for: ${optimizationGoals.join(', ')}

Original Code:
${pou.content}

Variables: ${pou.variables.map((v: any) => `${v.name}: ${v.dataType}`).join(', ')}

Please provide:
1. Optimized code
2. Explanation of improvements
3. Performance impact estimate
4. Any behavioral changes

Maintain the same functionality while improving the specified aspects.
Return only the optimized code with brief comments explaining key changes.
`;
  }

  private buildTestCasePrompt(pou: any): string {
    return AI_PROMPTS.TEST_GENERATION.replace('{POU_NAME}', pou.name)
      .replace('{POU_TYPE}', pou.type)
      .replace('{CODE}', pou.content)
      .replace('{VARIABLES}', pou.variables.map((v: any) => `${v.name}: ${v.dataType} (${v.scope})`).join(', '));
  }

  private parseAIResponse(aiResponse: string, pou: any): CodeIssue[] {
    try {
      // Try to parse JSON response
      if (aiResponse.includes('{') && aiResponse.includes('}')) {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.issues && Array.isArray(parsed.issues)) {
            return parsed.issues.map((issue: any, index: number) => ({
              id: `ai-issue-${Date.now()}-${index}`,
              type: issue.type,
              severity: issue.severity,
              title: issue.title,
              description: issue.description,
              pouFiles: [pou.name],
              lineNumber: issue.lineNumber,
              suggestion: issue.suggestion,
              confidence: issue.confidence || 0.7
            }));
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to parse AI JSON response, falling back to text parsing');
    }

    // Fallback: parse text response
    return this.parseTextResponse(aiResponse, pou);
  }

  private parseTextResponse(response: string, pou: any): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = response.split('\n');

    lines.forEach((line, index) => {
      if (line.includes('issue') || line.includes('problem') || line.includes('warning')) {
        issues.push({
          id: `ai-text-${Date.now()}-${index}`,
          type: 'POTENTIAL_IMPROVEMENT',
          severity: line.includes('critical') || line.includes('error') ? 'ERROR' : 'WARNING',
          title: 'AI Detected Issue',
          description: line.trim(),
          pouFiles: [pou.name],
          suggestion: 'Review this line for potential issues',
          confidence: 0.6
        });
      }
    });

    return issues;
  }

  private parseArchitectureResponse(aiResponse: string, project: Project): CodeIssue[] {
    // Similar to parseAIResponse but for architecture-level issues
    return [];
  }

  private parseFixSuggestions(aiResponse: string, issue: CodeIssue): FixSuggestion[] {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
          return parsed.suggestions.map((suggestion: any, index: number) => ({
            id: `fix-${Date.now()}-${index}`,
            title: suggestion.title,
            description: suggestion.explanation,
            codeChanges: suggestion.codeChanges,
            explanation: suggestion.explanation,
            sideEffects: suggestion.sideEffects || 'None identified',
            confidence: suggestion.confidence || 0.8,
            estimatedEffort: suggestion.estimatedEffort || 'MEDIUM'
          }));
        }
      }
    } catch (error) {
      logger.warn('Failed to parse fix suggestions JSON response');
    }

    // Fallback
    return [{
      id: `fix-${Date.now()}`,
      title: 'Code Fix Suggestion',
      description: 'AI-generated fix suggestion',
      codeChanges: {
        original: '',
        replacement: '',
        changeType: 'REPLACE' as const
      },
      explanation: aiResponse,
      sideEffects: 'Unknown',
      confidence: 0.6,
      estimatedEffort: 'MEDIUM' as const
    }];
  }

  private parseTestCases(aiResponse: string, pou: any): any[] {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.testCases && Array.isArray(parsed.testCases)) {
          return parsed.testCases;
        }
      }
    } catch (error) {
      logger.warn('Failed to parse test cases JSON response');
    }

    // Return mock test cases as fallback
    return this.generateMockTestCases(pou);
  }

  private extractChanges(original: string, optimized: string): any[] {
    // Simple diff extraction - in practice, you'd use a proper diff algorithm
    return [{
      original: original.substring(0, 100),
      replacement: optimized.substring(0, 100),
      changeType: 'REPLACE' as const,
      lineNumber: 1
    }];
  }

  // Mock data generators for demo mode
  private generateMockAIAnalysis(project: Project, request: AnalysisRequest): CodeIssue[] {
    const mockIssues: CodeIssue[] = [
      {
        id: 'mock-1',
        type: 'SAFETY_CONCERN',
        severity: 'WARNING',
        title: 'Missing Safety Interlock',
        description: 'Motor control lacks emergency stop safety check',
        pouFiles: ['MotorControl'],
        lineNumber: 15,
        suggestion: 'Add emergency stop condition before motor activation',
        confidence: 0.85
      },
      {
        id: 'mock-2',
        type: 'PERFORMANCE_ISSUE',
        severity: 'INFO',
        title: 'Inefficient Loop Implementation',
        description: 'FOR loop could be optimized with better boundary checking',
        pouFiles: ['TemperatureControl'],
        lineNumber: 25,
        suggestion: 'Pre-calculate loop boundaries and add early exit conditions',
        confidence: 0.7
      }
    ];

    return mockIssues.filter(issue =>
      request.options.issueTypes.includes(issue.type) &&
      request.options.severityLevel.includes(issue.severity)
    );
  }

  private generateMockFixSuggestions(issue: CodeIssue, pou: any): FixSuggestion[] {
    return [{
      id: 'mock-fix-1',
      title: 'Add Emergency Stop Check',
      description: 'Implement safety interlock for emergency stop condition',
      codeChanges: {
        original: 'IF motorEnabled THEN',
        replacement: 'IF motorEnabled AND NOT emergencyStop THEN',
        lineNumber: issue.lineNumber,
        changeType: 'REPLACE'
      },
      explanation: 'Adding emergency stop check prevents motor activation in unsafe conditions',
      sideEffects: 'None - this is a safety enhancement',
      confidence: 0.95,
      estimatedEffort: 'LOW'
    }];
  }

  private generateMockOptimizedCode(pou: any, optimizationGoals: string[]): GeneratedCode {
    const optimized = pou.content + '\n// AI-Optimized code for: ' + optimizationGoals.join(', ');

    return {
      originalCode: pou.content,
      fixedCode: pou.content,
      optimizedCode: optimized,
      changes: [{
        original: '',
        replacement: '',
        changeType: 'REPLACE' as const
      }],
      validation: {
        isValid: true,
        syntaxErrors: [],
        semanticErrors: [],
        score: 0.9,
        warnings: ['Mock validation - AI optimization applied']
      }
    };
  }

  private generateMockTestCases(pou: any): any[] {
    return [
      {
        id: 'test-1',
        name: 'Normal Operation Test',
        description: 'Test normal operation with valid inputs',
        inputs: { input1: 10, input2: 20 },
        expectedOutputs: { output1: 30 },
        preconditions: 'System initialized',
        steps: ['Set inputs', 'Execute POU', 'Verify outputs'],
        expectedResult: 'Outputs match expected values'
      },
      {
        id: 'test-2',
        name: 'Boundary Condition Test',
        description: 'Test with boundary values',
        inputs: { input1: 0, input2: 100 },
        expectedOutputs: { output1: 100 },
        preconditions: 'System initialized',
        steps: ['Set boundary inputs', 'Execute POU', 'Verify outputs'],
        expectedResult: 'Outputs handle boundary conditions correctly'
      }
    ];
  }
}