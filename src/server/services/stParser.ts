import { POUFile, POUCategory, Variable, VariableScope, ASTNode, ASTNodeType } from '../../shared/types';
import { ST_PATTERNS, ST_KEYWORDS } from '../../shared/constants';
import { logger } from '../utils/logger';

interface ParseContext {
  currentScope: string;
  lineNumber: number;
  columnNumber: number;
  inComment: boolean;
  commentType: 'LINE' | 'BLOCK' | null;
}

interface POUHeader {
  type: POUCategory;
  name: string;
  description?: string;
}

export class STParser {
  private context: ParseContext;

  constructor() {
    this.context = {
      currentScope: 'global',
      lineNumber: 1,
      columnNumber: 1,
      inComment: false,
      commentType: null
    };
  }

  // Main parsing entry point
  parse(fileName: string, content: string): POUFile {
    try {
      logger.info(`Parsing file: ${fileName}`);

      // Reset context
      this.context = {
        currentScope: 'global',
        lineNumber: 1,
        columnNumber: 1,
        inComment: false,
        commentType: null
      };

      // Pre-process content (remove comments, normalize whitespace)
      const preprocessedContent = this.preprocessContent(content);

      // Extract POU header
      const header = this.extractHeader(preprocessedContent);
      if (!header) {
        throw new Error('No valid POU declaration found');
      }

      // Extract variables
      const variables = this.extractVariables(preprocessedContent);

      // Extract main body
      const body = this.extractBody(preprocessedContent);

      // Generate AST
      const ast = this.generateAST(body);

      // Extract dependencies
      const dependencies = this.extractDependencies(ast);

      // Extract function block instances
      const instances = this.extractInstances(ast, variables);

      const pouFile: POUFile = {
        id: '', // Will be set by caller
        name: header.name,
        type: header.type,
        filePath: fileName,
        content: content.trim(),
        ast,
        variables,
        dependencies,
        instances,
        version: '1.0.0',
        lastModified: new Date(),
        description: header.description
      };

      logger.info(`Successfully parsed POU: ${header.name} (${header.type}) with ${variables.length} variables`);
      return pouFile;

    } catch (error) {
      logger.error(`Error parsing file ${fileName}:`, error);
      throw error;
    }
  }

  private preprocessContent(content: string): string {
    let processed = content;

    // Remove line comments (// ...)
    processed = processed.replace(/\/\/.*$/gm, '');

    // Remove block comments (* ... *)
    processed = processed.replace(/\(\*[\s\S]*?\*\)/g, '');

    // Normalize line endings
    processed = processed.replace(/\r\n/g, '\n');

    // Remove excessive blank lines
    processed = processed.replace(/\n\s*\n\s*\n/g, '\n\n');

    return processed.trim();
  }

  private extractHeader(content: string): POUHeader | null {
    const match = content.match(ST_PATTERNS.POU_DECLARATION);
    if (!match) {
      return null;
    }

    const type = match[1].toUpperCase() as POUCategory;
    const name = match[2];

    // Extract description from comments before the POU declaration
    const linesBeforeDeclaration = content.substring(0, match.index).split('\n');
    const description = this.extractDescriptionFromComments(linesBeforeDeclaration);

    return { type, name, description };
  }

  private extractDescriptionFromComments(lines: string[]): string | undefined {
    const descriptions: string[] = [];

    for (const line of lines.reverse()) {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('(*')) {
        const comment = trimmed.replace(/^\/\/|\/\*|\*\/\s*$/g, '').trim();
        if (comment) {
          descriptions.unshift(comment);
        }
      } else if (trimmed) {
        break; // Stop at first non-comment, non-empty line
      }
    }

    return descriptions.length > 0 ? descriptions.join(' ') : undefined;
  }

  private extractVariables(content: string): Variable[] {
    const variables: Variable[] = [];

    // Find all VAR sections
    const varSectionRegex = /(VAR(?:_INPUT|_OUTPUT|_TEMP|_GLOBAL)?)\s*([\s\S]*?)\s*END_VAR/gi;
    let match;

    while ((match = varSectionRegex.exec(content)) !== null) {
      const sectionType = match[1].toUpperCase();
      const sectionContent = match[2];

      const scope = this.mapVarSectionToScope(sectionType);
      const sectionVariables = this.parseVariableSection(sectionContent, scope);
      variables.push(...sectionVariables);
    }

    return variables;
  }

  private mapVarSectionToScope(sectionType: string): VariableScope {
    const scopeMap: Record<string, VariableScope> = {
      'VAR': 'LOCAL',
      'VAR_INPUT': 'INPUT',
      'VAR_OUTPUT': 'OUTPUT',
      'VAR_TEMP': 'TEMP',
      'VAR_GLOBAL': 'GLOBAL'
    };

    return scopeMap[sectionType] || 'LOCAL';
  }

  private parseVariableSection(sectionContent: string, scope: VariableScope): Variable[] {
    const variables: Variable[] = [];
    const lines = sectionContent.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and comments
      if (!line || line.startsWith('//') || line.startsWith('(*')) {
        continue;
      }

      // Parse variable declaration: name : type := initialValue;
      const varMatch = line.match(/^(\w+)\s*:\s*([^:;]+)(?:\s*:\s*=\s*([^;]+))?\s*;?\s*(?:\/\/\s*(.*))?$/);

      if (varMatch) {
        const variable: Variable = {
          name: varMatch[1],
          dataType: varMatch[2].trim(),
          scope,
          isConstant: false,
          initialValue: varMatch[3] ? this.parseInitialValue(varMatch[3].trim()) : undefined,
          description: varMatch[4]?.trim()
        };

        // Check if it's a constant (starts with VAR CONSTANT)
        if (lines.slice(Math.max(0, i - 2), i).some(line =>
          line.trim().toUpperCase().includes('VAR CONSTANT')
        )) {
          variable.isConstant = true;
        }

        variables.push(variable);
      }
    }

    return variables;
  }

  private parseInitialValue(value: string): any {
    // Try to parse as different data types
    if (value === 'TRUE' || value === 'FALSE') {
      return value === 'TRUE';
    }

    if (/^-?\d+$/.test(value)) {
      return parseInt(value, 10);
    }

    if (/^-?\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }

    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1); // Remove quotes
    }

    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1); // Remove quotes
    }

    // Return as string if no specific type matches
    return value;
  }

  private extractBody(content: string): string {
    // Find the body content (after VAR sections, before END_*)
    const lines = content.split('\n');
    const bodyStartIndex = this.findBodyStartIndex(lines);
    const bodyEndIndex = this.findBodyEndIndex(lines);

    if (bodyStartIndex === -1 || bodyEndIndex === -1) {
      return '';
    }

    return lines.slice(bodyStartIndex, bodyEndIndex + 1).join('\n');
  }

  private findBodyStartIndex(lines: string[]): number {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toUpperCase();
      if (line.startsWith('END_VAR') || line === 'VAR') {
        // Find the next non-empty line after END_VAR
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim() && !lines[j].trim().startsWith('//')) {
            return j;
          }
        }
      }
    }
    return 0;
  }

  private findBodyEndIndex(lines: string[]): number {
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim().toUpperCase();
      if (line.startsWith('END_') || line.startsWith('FUNCTION') || line.startsWith('PROGRAM')) {
        return i - 1;
      }
    }
    return lines.length - 1;
  }

  private generateAST(body: string): ASTNode {
    const rootNode: ASTNode = {
      type: 'PROGRAM',
      children: [],
      lineNumber: 1,
      columnNumber: 1,
      scope: 'global'
    };

    const lines = body.split('\n');
    this.context.lineNumber = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      this.context.lineNumber = i + 1;

      if (!line || line.startsWith('//') || line.startsWith('(*')) {
        continue;
      }

      try {
        const node = this.parseLine(line);
        if (node) {
          rootNode.children.push(node);
        }
      } catch (error) {
        logger.warn(`Failed to parse line ${this.context.lineNumber}: ${line}`, error);
        // Continue parsing other lines
      }
    }

    return rootNode;
  }

  private parseLine(line: string): ASTNode | null {
    // Assignment statement
    if (line.includes(':=')) {
      return this.parseAssignment(line);
    }

    // IF statement
    if (line.startsWith('IF')) {
      return this.parseIfStatement(line);
    }

    // FOR loop
    if (line.startsWith('FOR')) {
      return this.parseForLoop(line);
    }

    // WHILE loop
    if (line.startsWith('WHILE')) {
      return this.parseWhileLoop(line);
    }

    // CASE statement
    if (line.startsWith('CASE')) {
      return this.parseCaseStatement(line);
    }

    // REPEAT loop
    if (line.startsWith('REPEAT')) {
      return this.parseRepeatLoop(line);
    }

    // Function call
    if (this.isFunctionCall(line)) {
      return this.parseFunctionCall(line);
    }

    // RETURN statement
    if (line.toUpperCase().startsWith('RETURN')) {
      return this.parseReturnStatement(line);
    }

    return null;
  }

  private parseAssignment(line: string): ASTNode {
    const parts = line.split(':=');
    const variable = parts[0].trim();
    const value = parts[1].trim().replace(';', '');

    return {
      type: 'ASSIGNMENT',
      name: variable,
      value: value,
      children: [
        {
          type: 'VARIABLE',
          name: variable,
          children: [],
          lineNumber: this.context.lineNumber,
          columnNumber: 1,
          scope: this.context.currentScope
        },
        this.parseExpression(value)
      ],
      lineNumber: this.context.lineNumber,
      columnNumber: 1,
      scope: this.context.currentScope
    };
  }

  private parseIfStatement(line: string): ASTNode {
    const conditionMatch = line.match(/IF\s+(.+?)\s+THEN/i);
    const condition = conditionMatch ? conditionMatch[1] : '';

    return {
      type: 'IF_STATEMENT',
      name: 'IF',
      value: condition,
      children: [
        this.parseExpression(condition)
      ],
      lineNumber: this.context.lineNumber,
      columnNumber: 1,
      scope: this.context.currentScope
    };
  }

  private parseForLoop(line: string): ASTNode {
    const forMatch = line.match(/FOR\s+(\w+)\s*:=\s*(\d+)\s+TO\s+(\d+)/i);

    return {
      type: 'FOR_LOOP',
      name: forMatch?.[1] || '',
      value: `${forMatch?.[2]} TO ${forMatch?.[3]}`,
      children: [
        {
          type: 'VARIABLE',
          name: forMatch?.[1] || '',
          children: [],
          lineNumber: this.context.lineNumber,
          columnNumber: 1,
          scope: this.context.currentScope
        }
      ],
      lineNumber: this.context.lineNumber,
      columnNumber: 1,
      scope: this.context.currentScope
    };
  }

  private parseWhileLoop(line: string): ASTNode {
    const conditionMatch = line.match(/WHILE\s+(.+?)\s+DO/i);
    const condition = conditionMatch ? conditionMatch[1] : '';

    return {
      type: 'WHILE_LOOP',
      name: 'WHILE',
      value: condition,
      children: [
        this.parseExpression(condition)
      ],
      lineNumber: this.context.lineNumber,
      columnNumber: 1,
      scope: this.context.currentScope
    };
  }

  private parseCaseStatement(line: string): ASTNode {
    const caseMatch = line.match(/CASE\s+(.+?)\s+OF/i);
    const expression = caseMatch ? caseMatch[1] : '';

    return {
      type: 'CASE_STATEMENT',
      name: 'CASE',
      value: expression,
      children: [
        this.parseExpression(expression)
      ],
      lineNumber: this.context.lineNumber,
      columnNumber: 1,
      scope: this.context.currentScope
    };
  }

  private parseRepeatLoop(line: string): ASTNode {
    const conditionMatch = line.match(/REPEAT\s+(.+?)\s+UNTIL\s+(.+?)(?:\s*;)?$/i);
    const body = conditionMatch ? conditionMatch[1] : '';
    const condition = conditionMatch ? conditionMatch[2] : '';

    return {
      type: 'REPEAT_LOOP',
      name: 'REPEAT',
      value: condition,
      children: [
        this.parseExpression(condition)
      ],
      lineNumber: this.context.lineNumber,
      columnNumber: 1,
      scope: this.context.currentScope
    };
  }

  private parseFunctionCall(line: string): ASTNode {
    const callMatch = line.match(/^(\w+)\s*\(([^)]*)\)/);
    if (!callMatch) {
      return null;
    }

    const functionName = callMatch[1];
    const args = callMatch[2].split(',').map(arg => arg.trim());

    return {
      type: 'FUNCTION_CALL',
      name: functionName,
      value: args.join(', '),
      children: args.map(arg => this.parseExpression(arg)),
      lineNumber: this.context.lineNumber,
      columnNumber: 1,
      scope: this.context.currentScope
    };
  }

  private parseReturnStatement(line: string): ASTNode {
    const returnMatch = line.match(/RETURN\s*(.+)?/i);
    const returnValue = returnMatch ? returnMatch[1] : '';

    return {
      type: 'FUNCTION_CALL',
      name: 'RETURN',
      value: returnValue,
      children: returnValue ? [this.parseExpression(returnValue)] : [],
      lineNumber: this.context.lineNumber,
      columnNumber: 1,
      scope: this.context.currentScope
    };
  }

  private parseExpression(expression: string): ASTNode {
    // Simple expression parsing - can be enhanced
    expression = expression.trim();

    // Check if it's a literal
    if (this.isLiteral(expression)) {
      return {
        type: 'LITERAL',
        value: expression,
        children: [],
        lineNumber: this.context.lineNumber,
        columnNumber: 1,
        scope: this.context.currentScope
      };
    }

    // Check if it's a variable
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expression)) {
      return {
        type: 'VARIABLE',
        name: expression,
        children: [],
        lineNumber: this.context.lineNumber,
        columnNumber: 1,
        scope: this.context.currentScope
      };
    }

    // Check if it's a binary expression
    if (this.isBinaryExpression(expression)) {
      return this.parseBinaryExpression(expression);
    }

    // Default to variable
    return {
      type: 'VARIABLE',
      name: expression,
      children: [],
      lineNumber: this.context.lineNumber,
      columnNumber: 1,
      scope: this.context.currentScope
    };
  }

  private parseBinaryExpression(expression: string): ASTNode {
    // Simple binary expression parsing
    const operators = ['AND', 'OR', 'XOR', '+', '-', '*', '/', 'MOD', 'DIV', '=', '<>', '<', '>', '<=', '>='];

    for (const op of operators) {
      if (expression.includes(` ${op} `)) {
        const parts = expression.split(` ${op} `);
        if (parts.length === 2) {
          return {
            type: 'BINARY_EXPRESSION',
            name: op,
            value: expression,
            children: [
              this.parseExpression(parts[0].trim()),
              this.parseExpression(parts[1].trim())
            ],
            lineNumber: this.context.lineNumber,
            columnNumber: 1,
            scope: this.context.currentScope
          };
        }
      }
    }

    // Fallback
    return this.parseExpression(expression);
  }

  private isLiteral(expression: string): boolean {
    // Check for string literals
    if ((expression.startsWith("'") && expression.endsWith("'")) ||
        (expression.startsWith('"') && expression.endsWith('"'))) {
      return true;
    }

    // Check for numeric literals
    if (/^-?\d+(\.\d+)?$/.test(expression)) {
      return true;
    }

    // Check for boolean literals
    if (expression.toUpperCase() === 'TRUE' || expression.toUpperCase() === 'FALSE') {
      return true;
    }

    // Check for time literals
    if (expression.toUpperCase().startsWith('T#') ||
        expression.toUpperCase().startsWith('TIME#')) {
      return true;
    }

    return false;
  }

  private isFunctionCall(line: string): boolean {
    const functionCallPattern = /^(\w+)\s*\(/;
    return functionCallPattern.test(line) && !ST_KEYWORDS.some(keyword => line.toUpperCase().startsWith(keyword));
  }

  private isBinaryExpression(expression: string): boolean {
    const operators = [' AND ', ' OR ', ' XOR ', ' + ', ' - ', ' * ', ' / ', ' MOD ', ' DIV ', ' = ', '<> ', ' < ', ' > ', '<= ', '>= '];
    return operators.some(op => expression.includes(op));
  }

  private extractDependencies(ast: ASTNode): string[] {
    const dependencies = new Set<string>();

    const extractFromNode = (node: ASTNode) => {
      if (node.type === 'FUNCTION_CALL' && node.name) {
        // Check if it's a user-defined function (not a built-in)
        if (!ST_KEYWORDS.includes(node.name.toUpperCase())) {
          dependencies.add(node.name);
        }
      }

      if (node.children) {
        node.children.forEach(extractFromNode);
      }
    };

    extractFromNode(ast);
    return Array.from(dependencies);
  }

  private extractInstances(ast: ASTNode, variables: Variable[]) {
    const instances: any[] = [];

    const extractFromNode = (node: ASTNode) => {
      if (node.type === 'ASSIGNMENT' && node.children && node.children[1]) {
        const valueNode = node.children[1];
        if (valueNode.type === 'FUNCTION_CALL') {
          // Check if this is an FB instance call (e.g., myFB.SomeMethod())
          const functionName = valueNode.name;
          const fbInstance = this.findFBInstance(functionName, variables);

          if (fbInstance) {
            instances.push({
              name: functionName,
              type: fbInstance.type,
              lineNumber: node.lineNumber
            });
          }
        }
      }

      if (node.children) {
        node.children.forEach(extractFromNode);
      }
    };

    extractFromNode(ast);
    return instances;
  }

  private findFBInstance(instanceName: string, variables: Variable[]): { type: string } | null {
    // Look for FB instance variables that match the call pattern
    const instanceVar = variables.find(v =>
      v.name === instanceName &&
      v.dataType &&
      !['BOOL', 'INT', 'DINT', 'REAL', 'STRING'].includes(v.dataType.toUpperCase())
    );

    if (instanceVar) {
      return { type: instanceVar.dataType };
    }

    return null;
  }
}