export declare const APP_CONFIG: {
    readonly NAME: "AI-ST Debugger Pro";
    readonly VERSION: "1.0.0";
    readonly DESCRIPTION: "AI-powered ST (Structured Text) debugger for PLC programming";
    readonly MAX_FILE_SIZE: number;
    readonly SUPPORTED_EXTENSIONS: readonly [".st", ".txt", ".prg", ".fnc", ".fb", ".csv"];
    readonly DEFAULT_PROJECT_NAME: "Untitled Project";
};
export declare const POU_TYPES: {
    readonly PROGRAM: "PROGRAM";
    readonly FUNCTION_BLOCK: "FUNCTION_BLOCK";
    readonly FUNCTION: "FUNCTION";
};
export declare const VARIABLE_SCOPES: {
    readonly LOCAL: "LOCAL";
    readonly GLOBAL: "GLOBAL";
    readonly INPUT: "INPUT";
    readonly OUTPUT: "OUTPUT";
    readonly TEMP: "TEMP";
};
export declare const DATA_TYPES: {
    readonly BOOL: "BOOL";
    readonly INT: "INT";
    readonly DINT: "DINT";
    readonly UINT: "UINT";
    readonly UDINT: "UDINT";
    readonly REAL: "REAL";
    readonly LREAL: "LREAL";
    readonly STRING: "STRING";
    readonly TIME: "TIME";
    readonly DATE: "DATE";
    readonly TOD: "TOD";
    readonly DT: "DT";
    readonly BYTE: "BYTE";
    readonly WORD: "WORD";
    readonly DWORD: "DWORD";
};
export declare const ISSUE_TYPES: {
    readonly SYNTAX_ERROR: "SYNTAX_ERROR";
    readonly RUNTIME_ERROR: "RUNTIME_ERROR";
    readonly LOGIC_ERROR: "LOGIC_ERROR";
    readonly PERFORMANCE_ISSUE: "PERFORMANCE_ISSUE";
    readonly STYLE_VIOLATION: "STYLE_VIOLATION";
    readonly SAFETY_CONCERN: "SAFETY_CONCERN";
    readonly POTENTIAL_IMPROVEMENT: "POTENTIAL_IMPROVEMENT";
    readonly CIRCULAR_DEPENDENCY: "CIRCULAR_DEPENDENCY";
    readonly UNUSED_VARIABLE: "UNUSED_VARIABLE";
};
export declare const ISSUE_SEVERITY: {
    readonly CRITICAL: "CRITICAL";
    readonly ERROR: "ERROR";
    readonly WARNING: "WARNING";
    readonly INFO: "INFO";
};
export declare const ERROR_SEVERITY: {
    readonly FATAL: "FATAL";
    readonly ERROR: "ERROR";
    readonly WARNING: "WARNING";
    readonly INFO: "INFO";
};
export declare const DATA_QUALITY: {
    readonly GOOD: "GOOD";
    readonly BAD: "BAD";
    readonly UNCERTAIN: "UNCERTAIN";
};
export declare const ACTIVITY_TYPES: {
    readonly PROJECT_CREATED: "PROJECT_CREATED";
    readonly FILE_UPLOADED: "FILE_UPLOADED";
    readonly CODE_ANALYZED: "CODE_ANALYZED";
    readonly ISSUES_FIXED: "ISSUES_FIXED";
    readonly VERSION_CREATED: "VERSION_CREATED";
    readonly EXPORT_COMPLETED: "EXPORT_COMPLETED";
    readonly AI_ANALYSIS_RUN: "AI_ANALYSIS_RUN";
    readonly CODE_MODIFIED: "CODE_MODIFIED";
};
export declare const AI_PROMPTS: {
    readonly CODE_ANALYSIS: "Analyze the following Structured Text (ST) code for potential issues:\n\nPlease analyze for:\n1. Potential runtime errors (null pointer, division by zero, array bounds)\n2. Logic errors in IF/LOOP constructs\n3. Variable initialization issues\n4. Memory leaks or resource management problems\n5. Performance bottlenecks\n6. Safety concerns (e.g., missing safety interlocks)\n7. Coding standard violations\n\nProvide specific line numbers and suggest fixes.";
    readonly FIX_SUGGESTION: "Generate specific fix suggestions to resolve this issue:\n\nInclude:\n1. Exact code changes needed\n2. Explanation of why the fix works\n3. Potential side effects\n4. Alternative approaches if any\n\nFormat as JSON with suggestions array.";
    readonly CODE_OPTIMIZATION: "Optimize the following Structured Text code while maintaining exact functionality:\n\nOptimization Goals:\n1. Performance improvement\n2. Code readability\n3. Memory efficiency\n4. Maintainability\n5. Error handling\n\nRequirements:\n- Do not change the external behavior\n- Maintain all input/output functionality\n- Keep variable declarations unchanged\n- Optimize only the implementation logic\n- Add safety improvements where appropriate\n\nReturn only the optimized code without explanations.";
    readonly TEST_GENERATION: "Generate comprehensive test cases for the following ST POU:\n\nPlease generate test cases that cover:\n1. Normal operation scenarios\n2. Edge cases and boundary conditions\n3. Error conditions\n4. Performance scenarios\n5. Safety critical paths\n\nFor each test case, provide:\n- Test description\n- Input values\n- Expected outputs\n- Preconditions\n- Test steps\n- Expected behavior\n\nFormat as JSON test cases that can be executed in a test environment.";
};
export declare const ST_PATTERNS: {
    readonly VARIABLE_DECLARATION: RegExp;
    readonly POU_DECLARATION: RegExp;
    readonly ASSIGNMENT: RegExp;
    readonly IF_STATEMENT: RegExp;
    readonly FOR_LOOP: RegExp;
    readonly WHILE_LOOP: RegExp;
    readonly FUNCTION_CALL: RegExp;
    readonly COMMENT_LINE: RegExp;
    readonly COMMENT_BLOCK: RegExp;
    readonly DEVICE_ADDRESS: RegExp;
};
export declare const ST_KEYWORDS: readonly ["IF", "THEN", "ELSIF", "ELSE", "END_IF", "FOR", "TO", "BY", "DO", "END_FOR", "WHILE", "DO", "END_WHILE", "REPEAT", "UNTIL", "END_REPEAT", "CASE", "OF", "ELSE", "END_CASE", "VAR", "VAR_INPUT", "VAR_OUTPUT", "VAR_TEMP", "VAR_GLOBAL", "END_VAR", "PROGRAM", "FUNCTION_BLOCK", "FUNCTION", "END_PROGRAM", "END_FUNCTION_BLOCK", "END_FUNCTION", "RETURN", "EXIT", "CONTINUE", "TRUE", "FALSE", "NOT", "AND", "OR", "XOR", "MOD", "DIV", "SEL", "MUX", "MAX", "MIN", "LIMIT", "MOVE", "ADR", "ADRINST", "BITADR", "INDEX", "SIZEOF", "SHL", "SHR", "ROL", "ROR", "ROUND", "TRUNC", "SIN", "COS", "TAN", "ASIN", "ACOS", "ATAN", "EXP", "LN", "LOG", "SQRT"];
export declare const SAFETY_PATTERNS: {
    readonly EMERGENCY_STOP: RegExp;
    readonly TEMPERATURE_CHECK: RegExp;
    readonly PRESSURE_CHECK: RegExp;
    readonly SPEED_LIMIT: RegExp;
    readonly POSITION_LIMIT: RegExp;
    readonly VIBRATION_CHECK: RegExp;
    readonly OVERLOAD_CHECK: RegExp;
    readonly INTERLOCK_CHECK: RegExp;
};
export declare const CSV_HEADERS: {
    readonly VARIABLE_SNAPSHOT: readonly ["Timestamp", "VariableName", "Value", "DataType", "Address", "Quality"];
    readonly TRACE_LOG: readonly ["Timestamp", "BlockName", "LineNumber", "ExecutionTime", "TriggerEvent", "VariableChanges"];
    readonly ERROR_LOG: readonly ["Timestamp", "ErrorNumber", "Message", "Severity", "BlockName", "LineNumber", "Details"];
};
export declare const FILE_CATEGORIES: {
    readonly SOURCE: readonly ["st", "txt", "prg", "fnc", "fb"];
    readonly DATA: readonly ["csv", "txt"];
    readonly DOCUMENTATION: readonly ["md", "pdf", "doc", "docx"];
};
export declare const EXPORT_FORMATS: {
    readonly ZIP: "zip";
    readonly DIFF: "diff";
    readonly PROJECT: "project";
};
export declare const LOG_LEVELS: {
    readonly ERROR: "error";
    readonly WARN: "warn";
    readonly INFO: "info";
    readonly DEBUG: "debug";
};
export declare const DB_TABLES: {
    readonly PROJECTS: "projects";
    readonly FILES: "files";
    readonly DEPENDENCIES: "dependencies";
    readonly VARIABLES: "variables";
    readonly RUNTIME_DATA: "runtime_data";
    readonly ANALYSIS_RESULTS: "analysis_results";
    readonly VERSIONS: "versions";
    readonly HISTORY: "history";
};
export declare const API_PATHS: {
    readonly PROJECTS: "/api/projects";
    readonly FILES: "/api/files";
    readonly ANALYSIS: "/api/analysis";
    readonly AI: "/api/ai";
    readonly IMPORT: "/api/import";
    readonly EXPORT: "/api/export";
    readonly VERSIONS: "/api/versions";
    readonly HISTORY: "/api/history";
};
export declare const UI_COLORS: {
    readonly PRIMARY: "#2563eb";
    readonly SUCCESS: "#16a34a";
    readonly WARNING: "#d97706";
    readonly ERROR: "#dc2626";
    readonly INFO: "#0891b2";
};
export declare const SEVERITY_COLORS: {
    readonly CRITICAL: "#dc2626";
    readonly ERROR: "#ea580c";
    readonly WARNING: "#facc15";
    readonly INFO: "#3b82f6";
};
//# sourceMappingURL=index.d.ts.map