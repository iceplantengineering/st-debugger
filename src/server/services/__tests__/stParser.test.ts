import { STParser } from '../stParser';
import { POUCategory } from '../../../shared/types';

describe('STParser', () => {
  let parser: STParser;

  beforeEach(() => {
    parser = new STParser();
  });

  describe('parse', () => {
    test('should parse a simple PROGRAM', () => {
      const stCode = `
PROGRAM TestProgram
VAR
  counter: INT := 0;
  enabled: BOOL := TRUE;
END_VAR

// Main logic
IF enabled THEN
  counter := counter + 1;
END_IF;
END_PROGRAM
      `.trim();

      const result = parser.parse('TestProgram.st', stCode);

      expect(result.name).toBe('TestProgram');
      expect(result.type).toBe('PROGRAM');
      expect(result.variables).toHaveLength(2);
      expect(result.variables[0].name).toBe('counter');
      expect(result.variables[0].dataType).toBe('INT');
      expect(result.variables[1].name).toBe('enabled');
      expect(result.variables[1].dataType).toBe('BOOL');
    });

    test('should parse a FUNCTION_BLOCK with inputs and outputs', () => {
      const stCode = `
FUNCTION_BLOCK MotorControl
VAR_INPUT
  speed: INT := 0;
  enable: BOOL := FALSE;
END_VAR

VAR_OUTPUT
  actualSpeed: INT := 0;
  status: STRING := '';
END_VAR

VAR
  running: BOOL := FALSE;
END_VAR

IF enable AND NOT running THEN
  actualSpeed := speed;
  running := TRUE;
  status := 'Running';
END_IF;
END_FUNCTION_BLOCK
      `.trim();

      const result = parser.parse('MotorControl.fb', stCode);

      expect(result.name).toBe('MotorControl');
      expect(result.type).toBe('FUNCTION_BLOCK');
      expect(result.variables).toHaveLength(4);

      const inputVars = result.variables.filter(v => v.scope === 'INPUT');
      const outputVars = result.variables.filter(v => v.scope === 'OUTPUT');
      const localVars = result.variables.filter(v => v.scope === 'LOCAL');

      expect(inputVars).toHaveLength(2);
      expect(outputVars).toHaveLength(2);
      expect(localVars).toHaveLength(1);
    });

    test('should extract variable descriptions from comments', () => {
      const stCode = `
FUNCTION_BLOCK TestFB
VAR_INPUT
  temperature: REAL := 25.0;  // Current temperature reading
END_VAR
END_FUNCTION_BLOCK
      `.trim();

      const result = parser.parse('TestFB.fb', stCode);

      expect(result.variables[0].description).toBe('Current temperature reading');
    });

    test('should handle complex data types and initial values', () => {
      const stCode = `
PROGRAM DataTypesTest
VAR
 stringValue: STRING := 'Hello World';
  timeValue: TIME := T#5S;
  dateValue: DATE := D#2024-01-01;
  boolValue: BOOL := TRUE;
END_VAR
END_PROGRAM
      `.trim();

      const result = parser.parse('DataTypesTest.prg', stCode);

      expect(result.variables[0].initialValue).toBe('Hello World');
      expect(result.variables[1].initialValue).toBe('T#5S');
      expect(result.variables[2].initialValue).toBe('D#2024-01-01');
      expect(result.variables[3].initialValue).toBe(true);
    });
  });

  describe('AST generation', () => {
    test('should generate AST for assignment statements', () => {
      const stCode = `
PROGRAM AssignmentTest
VAR
  x: INT;
  y: INT;
END_VAR

x := y + 10;
x := x * 2;
END_PROGRAM
      `.trim();

      const result = parser.parse('AssignmentTest.st', stCode);

      expect(result.ast.children).toHaveLength(2);

      const firstAssignment = result.ast.children[0];
      expect(firstAssignment.type).toBe('ASSIGNMENT');
      expect(firstAssignment.name).toBe('x');
      expect(firstAssignment.children).toHaveLength(2);
      expect(firstAssignment.children[0].type).toBe('VARIABLE');
      expect(firstAssignment.children[0].name).toBe('x');
    });

    test('should generate AST for IF statements', () => {
      const stCode = `
PROGRAM IfTest
VAR
  condition: BOOL := TRUE;
  result: INT := 0;
END_VAR

IF condition THEN
  result := 1;
END_IF;
END_PROGRAM
      `.trim();

      const result = parser.parse('IfTest.st', stCode);

      const ifNode = result.ast.children.find(node => node.type === 'IF_STATEMENT');
      expect(ifNode).toBeDefined();
      expect(ifNode!.name).toBe('IF');
      expect(ifNode!.value).toBe('condition');
    });

    test('should generate AST for FOR loops', () => {
      const stCode = `
PROGRAM ForTest
VAR
  i: INT;
  sum: INT := 0;
END_VAR

FOR i := 1 TO 10 DO
  sum := sum + i;
END_FOR;
END_PROGRAM
      `.trim();

      const result = parser.parse('ForTest.st', stCode);

      const forNode = result.ast.children.find(node => node.type === 'FOR_LOOP');
      expect(forNode).toBeDefined();
      expect(forNode!.name).toBe('i');
      expect(forNode!.value).toBe('1 TO 10');
    });

    test('should generate AST for function calls', () => {
      const stCode = `
PROGRAM FunctionCallTest
VAR
  result: REAL;
  input1: REAL := 10.0;
  input2: REAL := 20.0;
END_VAR

result := MAX(input1, input2);
END_PROGRAM
      `.trim();

      const result = parser.parse('FunctionCallTest.st', stCode);

      const assignment = result.ast.children[0] as any;
      expect(assignment.type).toBe('ASSIGNMENT');

      const functionCall = assignment.children[1];
      expect(functionCall.type).toBe('FUNCTION_CALL');
      expect(functionCall.name).toBe('MAX');
    });
  });

  describe('dependency extraction', () => {
    test('should extract function dependencies', () => {
      const stCode = `
PROGRAM DependencyTest
VAR
  result: REAL;
  value: REAL := 5.0;
END_VAR

result := CustomFunction(value);
result := AnotherFunction(CustomFunction(value));
END_PROGRAM
      `.trim();

      const result = parser.parse('DependencyTest.st', stCode);

      expect(result.dependencies).toContain('CustomFunction');
      expect(result.dependencies).toContain('AnotherFunction');
      expect(result.dependencies).toHaveLength(2);
    });

    test('should not extract built-in function dependencies', () => {
      const stCode = `
PROGRAM BuiltInTest
VAR
  result: REAL;
  input1: REAL := 5.0;
  input2: REAL := 10.0;
END_VAR

result := MAX(input1, input2);
result := ABS(result);
END_PROGRAM
      `.trim();

      const result = parser.parse('BuiltInTest.st', stCode);

      expect(result.dependencies).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    test('should handle invalid POU declarations', () => {
      const stCode = `
VAR
  x: INT;
END_VAR

x := 5;
      `.trim();

      expect(() => {
        parser.parse('Invalid.st', stCode);
      }).toThrow('No valid POU declaration found');
    });

    test('should handle malformed variable declarations', () => {
      const stCode = `
PROGRAM TestProgram
VAR
  x: INT
  y: BOOL
END_VAR

END_PROGRAM
      `.trim();

      // Should not throw, but may skip malformed declarations
      const result = parser.parse('TestProgram.st', stCode);
      expect(result.variables).toHaveLength(0);
    });

    test('should handle comments correctly', () => {
      const stCode = `
PROGRAM CommentTest
VAR
  x: INT;  // This is a comment
  y: BOOL; (* This is a block comment *)
END_VAR

// Line comment should be ignored
(* Block comment should be ignored *)
x := 5;
END_PROGRAM
      `.trim();

      expect(() => {
        parser.parse('CommentTest.st', stCode);
      }).not.toThrow();
    });
  });
});