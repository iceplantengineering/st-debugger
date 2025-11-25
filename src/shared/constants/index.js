"use strict";
// Application constants
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEVERITY_COLORS = exports.UI_COLORS = exports.API_PATHS = exports.DB_TABLES = exports.LOG_LEVELS = exports.EXPORT_FORMATS = exports.FILE_CATEGORIES = exports.CSV_HEADERS = exports.SAFETY_PATTERNS = exports.ST_KEYWORDS = exports.ST_PATTERNS = exports.AI_PROMPTS = exports.ACTIVITY_TYPES = exports.DATA_QUALITY = exports.ERROR_SEVERITY = exports.ISSUE_SEVERITY = exports.ISSUE_TYPES = exports.DATA_TYPES = exports.VARIABLE_SCOPES = exports.POU_TYPES = exports.APP_CONFIG = void 0;
exports.APP_CONFIG = {
    NAME: 'AI-ST Debugger Pro',
    VERSION: '1.0.0',
    DESCRIPTION: 'AI-powered ST (Structured Text) debugger for PLC programming',
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    SUPPORTED_EXTENSIONS: ['.st', '.txt', '.prg', '.fnc', '.fb', '.csv'],
    DEFAULT_PROJECT_NAME: 'Untitled Project'
};
exports.POU_TYPES = {
    PROGRAM: 'PROGRAM',
    FUNCTION_BLOCK: 'FUNCTION_BLOCK',
    FUNCTION: 'FUNCTION'
};
exports.VARIABLE_SCOPES = {
    LOCAL: 'LOCAL',
    GLOBAL: 'GLOBAL',
    INPUT: 'INPUT',
    OUTPUT: 'OUTPUT',
    TEMP: 'TEMP'
};
exports.DATA_TYPES = {
    BOOL: 'BOOL',
    INT: 'INT',
    DINT: 'DINT',
    UINT: 'UINT',
    UDINT: 'UDINT',
    REAL: 'REAL',
    LREAL: 'LREAL',
    STRING: 'STRING',
    TIME: 'TIME',
    DATE: 'DATE',
    TOD: 'TOD',
    DT: 'DT',
    BYTE: 'BYTE',
    WORD: 'WORD',
    DWORD: 'DWORD'
};
exports.ISSUE_TYPES = {
    SYNTAX_ERROR: 'SYNTAX_ERROR',
    RUNTIME_ERROR: 'RUNTIME_ERROR',
    LOGIC_ERROR: 'LOGIC_ERROR',
    PERFORMANCE_ISSUE: 'PERFORMANCE_ISSUE',
    STYLE_VIOLATION: 'STYLE_VIOLATION',
    SAFETY_CONCERN: 'SAFETY_CONCERN',
    POTENTIAL_IMPROVEMENT: 'POTENTIAL_IMPROVEMENT',
    CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
    UNUSED_VARIABLE: 'UNUSED_VARIABLE'
};
exports.ISSUE_SEVERITY = {
    CRITICAL: 'CRITICAL',
    ERROR: 'ERROR',
    WARNING: 'WARNING',
    INFO: 'INFO'
};
exports.ERROR_SEVERITY = {
    FATAL: 'FATAL',
    ERROR: 'ERROR',
    WARNING: 'WARNING',
    INFO: 'INFO'
};
exports.DATA_QUALITY = {
    GOOD: 'GOOD',
    BAD: 'BAD',
    UNCERTAIN: 'UNCERTAIN'
};
exports.ACTIVITY_TYPES = {
    PROJECT_CREATED: 'PROJECT_CREATED',
    FILE_UPLOADED: 'FILE_UPLOADED',
    CODE_ANALYZED: 'CODE_ANALYZED',
    ISSUES_FIXED: 'ISSUES_FIXED',
    VERSION_CREATED: 'VERSION_CREATED',
    EXPORT_COMPLETED: 'EXPORT_COMPLETED',
    AI_ANALYSIS_RUN: 'AI_ANALYSIS_RUN',
    CODE_MODIFIED: 'CODE_MODIFIED'
};
exports.AI_PROMPTS = {
    CODE_ANALYSIS: `Analyze the following Structured Text (ST) code for potential issues:

Please analyze for:
1. Potential runtime errors (null pointer, division by zero, array bounds)
2. Logic errors in IF/LOOP constructs
3. Variable initialization issues
4. Memory leaks or resource management problems
5. Performance bottlenecks
6. Safety concerns (e.g., missing safety interlocks)
7. Coding standard violations

Provide specific line numbers and suggest fixes.`,
    FIX_SUGGESTION: `Generate specific fix suggestions to resolve this issue:

Include:
1. Exact code changes needed
2. Explanation of why the fix works
3. Potential side effects
4. Alternative approaches if any

Format as JSON with suggestions array.`,
    CODE_OPTIMIZATION: `Optimize the following Structured Text code while maintaining exact functionality:

Optimization Goals:
1. Performance improvement
2. Code readability
3. Memory efficiency
4. Maintainability
5. Error handling

Requirements:
- Do not change the external behavior
- Maintain all input/output functionality
- Keep variable declarations unchanged
- Optimize only the implementation logic
- Add safety improvements where appropriate

Return only the optimized code without explanations.`,
    TEST_GENERATION: `Generate comprehensive test cases for the following ST POU:

Please generate test cases that cover:
1. Normal operation scenarios
2. Edge cases and boundary conditions
3. Error conditions
4. Performance scenarios
5. Safety critical paths

For each test case, provide:
- Test description
- Input values
- Expected outputs
- Preconditions
- Test steps
- Expected behavior

Format as JSON test cases that can be executed in a test environment.`
};
exports.ST_PATTERNS = {
    VARIABLE_DECLARATION: /(?:VAR|VAR_INPUT|VAR_OUTPUT|VAR_TEMP|VAR_GLOBAL)\s+([\s\S]*?)\s*END_VAR/gi,
    POU_DECLARATION: /(PROGRAM|FUNCTION_BLOCK|FUNCTION)\s+(\w+)/i,
    ASSIGNMENT: /(\w+)\s*:=\s*([^;]+);?/g,
    IF_STATEMENT: /IF\s+(.+?)\s+THEN/gi,
    FOR_LOOP: /FOR\s+(\w+)\s*:=\s*(\d+)\s+TO\s+(\d+)/gi,
    WHILE_LOOP: /WHILE\s+(.+?)\s+DO/gi,
    FUNCTION_CALL: /(\w+)\s*\([^)]*\)/g,
    COMMENT_LINE: /\/\/.*$/gm,
    COMMENT_BLOCK: /\(\*[\s\S]*?\*\)/g,
    DEVICE_ADDRESS: /^[DMXY]\d+$/i
};
exports.ST_KEYWORDS = [
    'IF', 'THEN', 'ELSIF', 'ELSE', 'END_IF',
    'FOR', 'TO', 'BY', 'DO', 'END_FOR',
    'WHILE', 'DO', 'END_WHILE',
    'REPEAT', 'UNTIL', 'END_REPEAT',
    'CASE', 'OF', 'ELSE', 'END_CASE',
    'VAR', 'VAR_INPUT', 'VAR_OUTPUT', 'VAR_TEMP', 'VAR_GLOBAL', 'END_VAR',
    'PROGRAM', 'FUNCTION_BLOCK', 'FUNCTION', 'END_PROGRAM', 'END_FUNCTION_BLOCK', 'END_FUNCTION',
    'RETURN', 'EXIT', 'CONTINUE',
    'TRUE', 'FALSE', 'NOT', 'AND', 'OR', 'XOR',
    'MOD', 'DIV', 'SEL', 'MUX', 'MAX', 'MIN',
    'LIMIT', 'MOVE', 'ADR', 'ADRINST', 'BITADR', 'INDEX',
    'SIZEOF', 'SHL', 'SHR', 'ROL', 'ROR',
    'ROUND', 'TRUNC', 'SIN', 'COS', 'TAN', 'ASIN', 'ACOS', 'ATAN',
    'EXP', 'LN', 'LOG', 'SQRT'
];
exports.SAFETY_PATTERNS = {
    EMERGENCY_STOP: /emergency|estop|e.stop/i,
    TEMPERATURE_CHECK: /temperature|temp|heat/i,
    PRESSURE_CHECK: /pressure|press|psi|bar/i,
    SPEED_LIMIT: /speed|velocity|rpm/i,
    POSITION_LIMIT: /position|pos|location/i,
    VIBRATION_CHECK: /vibration|vib|shake/i,
    OVERLOAD_CHECK: /overload|load|current/i,
    INTERLOCK_CHECK: /interlock|safety|guard/i
};
exports.CSV_HEADERS = {
    VARIABLE_SNAPSHOT: ['Timestamp', 'VariableName', 'Value', 'DataType', 'Address', 'Quality'],
    TRACE_LOG: ['Timestamp', 'BlockName', 'LineNumber', 'ExecutionTime', 'TriggerEvent', 'VariableChanges'],
    ERROR_LOG: ['Timestamp', 'ErrorNumber', 'Message', 'Severity', 'BlockName', 'LineNumber', 'Details']
};
exports.FILE_CATEGORIES = {
    SOURCE: ['st', 'txt', 'prg', 'fnc', 'fb'],
    DATA: ['csv', 'txt'],
    DOCUMENTATION: ['md', 'pdf', 'doc', 'docx']
};
exports.EXPORT_FORMATS = {
    ZIP: 'zip',
    DIFF: 'diff',
    PROJECT: 'project'
};
exports.LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
};
// Database schema constants
exports.DB_TABLES = {
    PROJECTS: 'projects',
    FILES: 'files',
    DEPENDENCIES: 'dependencies',
    VARIABLES: 'variables',
    RUNTIME_DATA: 'runtime_data',
    ANALYSIS_RESULTS: 'analysis_results',
    VERSIONS: 'versions',
    HISTORY: 'history'
};
// API endpoint paths
exports.API_PATHS = {
    PROJECTS: '/api/projects',
    FILES: '/api/files',
    ANALYSIS: '/api/analysis',
    AI: '/api/ai',
    IMPORT: '/api/import',
    EXPORT: '/api/export',
    VERSIONS: '/api/versions',
    HISTORY: '/api/history'
};
// UI Constants
exports.UI_COLORS = {
    PRIMARY: '#2563eb',
    SUCCESS: '#16a34a',
    WARNING: '#d97706',
    ERROR: '#dc2626',
    INFO: '#0891b2'
};
exports.SEVERITY_COLORS = {
    CRITICAL: '#dc2626',
    ERROR: '#ea580c',
    WARNING: '#facc15',
    INFO: '#3b82f6'
};
//# sourceMappingURL=index.js.map