import React, { useState } from 'react';
import { Play, MessageSquare, Lightbulb, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { getSeverityColor, getSeverityIcon, formatDateTime } from '../../lib/utils';

interface AIAnalysisPanelProps {
  project: any;
  selectedFile: any;
}

interface FixSuggestionProps {
  suggestion: any;
  onApply: (suggestion: any) => void;
}

const FixSuggestion: React.FC<FixSuggestionProps> = ({ suggestion, onApply }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">{suggestion.explanation}</p>

          {suggestion.codeChanges && (
            <div className="mb-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-primary-600 hover:text-primary-800 flex items-center space-x-1"
              >
                <span>{isExpanded ? 'Hide' : 'Show'} Code Changes</span>
                <Zap className="w-3 h-3" />
              </button>

              {isExpanded && (
                <div className="mt-2 space-y-2">
                  <div className="bg-red-50 border-l-4 border-red-500 p-3">
                    <p className="text-xs font-medium text-red-800 mb-1">Original:</p>
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {suggestion.codeChanges.original}
                    </pre>
                  </div>
                  <div className="bg-green-50 border-l-4 border-green-500 p-3">
                    <p className="text-xs font-medium text-green-800 mb-1">Replacement:</p>
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {suggestion.codeChanges.replacement}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Line {suggestion.codeChanges?.lineNumber}</span>
              <span>Confidence: {Math.round((suggestion.confidence || 0) * 100)}%</span>
              <span>Effort: {suggestion.estimatedEffort}</span>
            </div>

            <button
              onClick={() => onApply(suggestion)}
              className="text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 transition-colors"
            >
              Apply Fix
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ project, selectedFile }) => {
  const [activeTab, setActiveTab] = useState<'issues' | 'chat' | 'suggestions'>('issues');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  // Analyze project mutation
  const analyzeMutation = useMutation({
    mutationFn: (request: any) => api.analyzeIssues(request),
  });

  // Get analysis results
  const { data: analysisResults, isLoading } = useQuery({
    queryKey: ['analysis', project.id],
    queryFn: () => api.analyzeIssues({
      projectId: project.id,
      options: {
        includeRuntimeData: true,
        severityLevel: ['CRITICAL', 'ERROR', 'WARNING', 'INFO'],
        issueTypes: [
          'SYNTAX_ERROR', 'RUNTIME_ERROR', 'LOGIC_ERROR',
          'PERFORMANCE_ISSUE', 'SAFETY_CONCERN', 'POTENTIAL_IMPROVEMENT'
        ],
        includeSuggestions: true,
      },
    }),
    enabled: !!project.id,
  });

  const handleRunAnalysis = () => {
    analyzeMutation.mutate({
      projectId: project.id,
      options: {
        includeRuntimeData: true,
        severityLevel: ['CRITICAL', 'ERROR', 'WARNING', 'INFO'],
        issueTypes: [
          'SYNTAX_ERROR', 'RUNTIME_ERROR', 'LOGIC_ERROR',
          'PERFORMANCE_ISSUE', 'SAFETY_CONCERN', 'POTENTIAL_IMPROVEMENT'
        ],
        includeSuggestions: true,
      },
    });
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: chatMessage,
      timestamp: new Date(),
    };

    setChatHistory(prev => [...prev, userMessage]);
    setChatMessage('');

    try {
      const response = await api.chatWithAI(chatMessage, {
        projectId: project.id,
        selectedFile: selectedFile?.id,
        analysisResults: analysisResults,
      });

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.message,
        timestamp: new Date(),
      };

      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send chat message:', error);

      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };

      setChatHistory(prev => [...prev, errorMessage]);
    }
  };

  const handleApplyFix = (suggestion: any) => {
    // This would apply the fix to the code
    console.log('Applying fix:', suggestion);
    // Implementation would integrate with the code editor
  };

  const issues = analysisResults?.issues || [];
  const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
  const warnings = issues.filter(i => i.severity === 'WARNING');

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">AI</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AI Analysis</h2>
              <p className="text-sm text-gray-600">
                {project.name} • {selectedFile ? selectedFile.name : 'All Files'}
              </p>
            </div>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={analyzeMutation.isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>
              {analyzeMutation.isLoading ? 'Analyzing...' : 'Run Analysis'}
            </span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('issues')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'issues'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Issues ({issues.length})
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'suggestions'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Suggestions
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeTab === 'chat'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>AI Chat</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing code...</p>
            </div>
          </div>
        ) : activeTab === 'issues' && (
          <div className="p-4">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-2xl font-bold text-red-900">{criticalIssues.length}</span>
                </div>
                <p className="text-sm text-red-700 mt-1">Critical Issues</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-2xl font-bold text-yellow-900">{warnings.length}</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">Warnings</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-900">
                    {issues.length - criticalIssues.length - warnings.length}
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-1">Info Items</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-900">87%</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">Code Quality</p>
              </div>
            </div>

            {/* Issues List */}
            {issues.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Issues Found</h3>
                <p className="text-gray-600">Great! Your code looks clean and well-structured.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {issues.map((issue, index) => (
                  <div
                    key={index}
                    className={cn(
                      "border rounded-lg p-4",
                      getSeverityColor(issue.severity)
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{getSeverityIcon(issue.severity)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{issue.title}</h3>
                          <div className="flex items-center space-x-2 text-xs">
                            <span>Line {issue.lineNumber}</span>
                            <span>•</span>
                            <span>{Math.round(issue.confidence * 100)}% confidence</span>
                          </div>
                        </div>
                        <p className="text-sm mb-3">{issue.description}</p>
                        <div className="mb-3">
                          <p className="text-sm font-medium mb-1">Suggestion:</p>
                          <p className="text-sm text-gray-600">{issue.suggestion}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-xs bg-white px-3 py-1 rounded hover:bg-gray-50 transition-colors">
                            View Fix
                          </button>
                          <button className="text-xs bg-white px-3 py-1 rounded hover:bg-gray-50 transition-colors">
                            Ignore
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Code Improvement Suggestions</h3>
            <div className="space-y-4">
              <FixSuggestion
                suggestion={{
                  title: "Add Input Validation",
                  explanation: "Add validation for user inputs to prevent runtime errors",
                  codeChanges: {
                    original: "variable := userInput;",
                    replacement: "IF userInput > 0 AND userInput < 1000 THEN\n  variable := userInput;\nELSE\n  variable := 0; // Default value\nEND_IF;",
                    lineNumber: 15,
                  },
                  confidence: 0.9,
                  estimatedEffort: 'LOW',
                }}
                onApply={handleApplyFix}
              />
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            {/* Chat Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Start a Conversation</h3>
                  <p className="text-gray-600">Ask me about your code, request optimizations, or get help with debugging.</p>
                </div>
              ) : (
                chatHistory.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {formatDateTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask about your code..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisPanel;