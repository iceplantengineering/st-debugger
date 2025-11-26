import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Save, Settings, Search, AlertTriangle } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface CodeEditorProps {
  file: any;
  project: any;
  onFileUpdate: (file: any) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ file, onFileUpdate }) => {
  const editorRef = useRef<any>(null);
  const [code, setCode] = useState(file?.content || '');
  const [isDirty, setIsDirty] = useState(false);
  const [showIssues, setShowIssues] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Get file AST for analysis
  useQuery({
    queryKey: ['file-ast', file?.id],
    queryFn: () => file?.id ? api.getFileAST(file.id) : null,
    enabled: !!file?.id,
  });

  // Analyze file mutation
  const analyzeMutation = useMutation({
    mutationFn: (options: any) => api.analyzeFile(file?.id, options),
  });

  // Save file mutation
  const saveMutation = useMutation({
    mutationFn: (updates: any) => api.updateFile(file?.id, updates),
  });

  useEffect(() => {
    if (file?.content) {
      setCode(file.content);
      setIsDirty(false);
    }
  }, [file]);

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    setIsDirty(newCode !== (file?.content || ''));
  };

  const handleSave = async () => {
    if (!file || !isDirty) return;

    try {
      await saveMutation.mutateAsync({
        content: code,
        lastModified: new Date(),
      });

      onFileUpdate({
        ...file,
        content: code,
        lastModified: new Date(),
      });
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    try {
      await analyzeMutation.mutateAsync({
        includeRuntimeData: true,
        severityLevel: ['CRITICAL', 'ERROR', 'WARNING', 'INFO'],
        issueTypes: [
          'SYNTAX_ERROR', 'RUNTIME_ERROR', 'LOGIC_ERROR',
          'PERFORMANCE_ISSUE', 'SAFETY_CONCERN'
        ],
      });
    } catch (error) {
      console.error('Failed to analyze file:', error);
    }
  };

  const handleSearch = () => {
    if (!editorRef.current || !searchQuery) {
      setSearchResults([]);
      return;
    }

    const editor = editorRef.current.getEditor();
    const model = editor.getModel();

    if (!model) return;

    const matches = [];
    const regex = new RegExp(searchQuery, 'gi');
    let match;

    while ((match = regex.exec(model.getValue())) !== null) {
      const position = model.getPositionAt(match.index);
      matches.push({
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column + match[0].length,
        match: match[0],
      });
    }

    setSearchResults(matches);
  };

  const goToSearchResult = (result: any) => {
    if (!editorRef.current) return;

    const editor = editorRef.current.getEditor();
    editor.setPosition({
      lineNumber: result.startLineNumber,
      column: result.startColumn,
    });
    editor.focus();
    editor.revealLineInCenter(result.startLineNumber);
  };

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📄</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No file selected</h3>
          <p className="text-gray-600">Select a file from the file explorer to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{file.name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {file.type}
                </span>
                {isDirty && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    Modified
                  </span>
                )}
                {analyzeMutation.data?.issues?.length > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{analyzeMutation.data.issues.length} issues</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Search */}
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search in file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="bg-transparent border-none outline-none text-sm w-40"
                />
                {searchResults.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {searchResults.length} results
                  </span>
                )}
              </div>

              {/* Actions */}
              <button
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>Analyze</span>
              </button>

              <button
                onClick={handleSave}
                disabled={!isDirty || saveMutation.isPending}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>

              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Issues */}
        {analyzeMutation.data?.issues?.length > 0 && showIssues && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-red-800">Analysis Results</h3>
              <button
                onClick={() => setShowIssues(false)}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {analyzeMutation.data.issues.map((issue: any, index: number) => (
                <div
                  key={index}
                  className="text-xs p-2 bg-white rounded border border-red-200 cursor-pointer hover:border-red-300"
                  onClick={() => {
                    // Navigate to issue line in editor
                    if (editorRef.current) {
                      const editor = editorRef.current.getEditor();
                      editor.setPosition({
                        lineNumber: issue.lineNumber || 1,
                        column: 1,
                      });
                      editor.focus();
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-3 h-3 text-yellow-500" />
                    <span className="font-medium text-gray-900">{issue.title}</span>
                    <span className="text-gray-500">Line {issue.lineNumber}</span>
                  </div>
                  <p className="text-gray-600 mt-1">{issue.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-blue-800">Search Results</h3>
              <button
                onClick={() => {
                  setSearchResults([]);
                  setSearchQuery('');
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </div>
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="text-xs p-2 bg-white rounded border border-blue-200 cursor-pointer hover:border-blue-300"
                  onClick={() => goToSearchResult(result)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Line {result.startLineNumber}</span>
                    <span className="text-gray-500">Col {result.startColumn}</span>
                  </div>
                  <p className="text-gray-600 truncate">{result.match}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 flex">
        <div className="flex-1">
          <Editor
            height="100%"
            defaultLanguage="plaintext" // We'll set up ST language later
            value={code}
            onChange={handleEditorChange}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              folding: true,
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
            }}
            onMount={(editor) => {
              editorRef.current = editor;

              // Configure ST language (basic highlighting)
              // Language setting not available in this version
            }}
          />
        </div>

        {/* Optional: Split view for issues/AST */}
        <div className="w-80 bg-white border-l border-gray-200">
          {/* File Info */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">File Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Variables:</span>
                <span className="font-medium">{file.variables?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dependencies:</span>
                <span className="font-medium">{file.dependencies?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lines:</span>
                <span className="font-medium">{code.split('\n').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium">{code.length} chars</span>
              </div>
            </div>
          </div>

          {/* Variables */}
          {file.variables && file.variables.length > 0 && (
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Variables</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {file.variables.map((variable: any, index: number) => (
                  <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">{variable.name}</span>
                      <span className="text-gray-500">{variable.dataType}</span>
                    </div>
                    <div className="text-gray-500">
                      {variable.scope} • {variable.isConstant ? 'Constant' : 'Variable'}
                    </div>
                    {variable.initialValue && (
                      <div className="text-gray-600">
                        Initial: {variable.initialValue}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {file.dependencies && file.dependencies.length > 0 && (
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Dependencies</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {file.dependencies.map((dep: string, index: number) => (
                  <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                    <span className="font-medium">{dep}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;