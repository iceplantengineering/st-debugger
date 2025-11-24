import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Upload, Download, Brain, Activity, GitBranch } from 'lucide-react';
import { api } from '../../lib/api';
import FileExplorer from './FileExplorer';
import CodeEditor from './CodeEditor';
import AIAnalysisPanel from './AIAnalysisPanel';
import RuntimeMonitor from './RuntimeMonitor';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'analysis' | 'monitor'>('editor');

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.getProject(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600">The requested project could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* File Explorer */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <FileExplorer
          project={project.data}
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Project Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{project.data.name}</h1>
                <p className="text-sm text-gray-600">{project.data.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {project.data.version}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Active
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Play className="w-4 h-4" />
                <span>Run Analysis</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Upload className="w-4 h-4" />
                <span>Import Data</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <GitBranch className="w-4 h-4" />
                <span>Versions</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center space-x-1 mt-4">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'editor'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Code Editor
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                activeTab === 'analysis'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>AI Analysis</span>
            </button>
            <button
              onClick={() => setActiveTab('monitor')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                activeTab === 'monitor'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Runtime Monitor</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 flex">
          {activeTab === 'editor' && (
            <CodeEditor
              file={selectedFile}
              project={project.data}
              onFileUpdate={(updatedFile) => setSelectedFile(updatedFile)}
            />
          )}
          {activeTab === 'analysis' && (
            <AIAnalysisPanel
              project={project.data}
              selectedFile={selectedFile}
            />
          )}
          {activeTab === 'monitor' && (
            <RuntimeMonitor
              project={project.data}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;