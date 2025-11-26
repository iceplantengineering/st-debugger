import React, { useState } from 'react';
import { ArrowLeft, Upload, FileText, Database, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import FileUpload from '../../components/FileUpload/FileUpload';
import { isValidFileExtension } from '../../lib/utils';

const ImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'files' | 'data'>('files');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [dataType, setDataType] = useState<'variables' | 'traces' | 'errors'>('variables');

  // Get existing projects for project selection
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
  });

  // Import project mutation
  const importProjectMutation = useMutation({
    mutationFn: (data: any) => api.importProject(data.files, data.options),
  });

  // Import data mutation
  const importDataMutation = useMutation({
    mutationFn: (data: any) => {
      switch (data.type) {
        case 'variables':
          return api.importVariableSnapshots(data.projectId, data.csvContent, data.options);
        case 'traces':
          return api.importTraceLogs(data.projectId, data.csvContent, data.options);
        case 'errors':
          return api.importErrorLogs(data.projectId, data.csvContent, data.options);
        default:
          throw new Error('Invalid data type');
      }
    },
  });

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(prev => {
      if (prev.length === 0) {
        return files;
      }
      // If files already selected, replace them (single file mode logic could be added here)
      return [...prev, ...files];
    });
  };

  const handleProjectImport = async () => {
    if (!selectedFiles.length) return;

    try {
      const result = await importProjectMutation.mutateAsync({
        files: selectedFiles,
        options: {
          projectName: projectName || `Project ${Date.now()}`,
          description: projectDescription,
          overwrite: false,
          createProject: true,
          analyzeOnImport: true,
        },
      });

      if (result.project?.id) {
        // Navigate to the imported project
        navigate(`/project/${result.project.id}`);
      }
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleDataImport = async () => {
    if (!csvContent || !projects?.projects[0]?.id) return;

    try {
      await importDataMutation.mutateAsync({
        type: dataType,
        projectId: projects.projects[0].id, // Use first project for demo
        csvContent,
        options: {
          validateData: true,
          skipDuplicates: false,
        },
      });

      // Clear form after successful import
      setCsvContent('');
    } catch (error) {
      console.error('Data import failed:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && isValidFileExtension(file.name, ['.csv', '.txt'])) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCsvContent(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Import Data</h1>
            <p className="text-gray-600">Import ST code files and runtime data from GX Works</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('files')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === 'files'
                    ? 'border-primary-600 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>ST Code Files</span>
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === 'data'
                    ? 'border-primary-600 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Database className="w-5 h-5" />
                <span>Runtime Data</span>
              </button>
            </div>

            <div className="p-6">
              {/* Files Tab */}
              {activeTab === 'files' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Upload ST Code Files</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Upload your Structured Text files (.st, .prg, .fnc, .fb) to create a new project or add to an existing one.
                    </p>

                    <FileUpload
                      accept={['.st', '.prg', '.fnc', '.fb', '.txt']}
                      onFilesSelected={handleFilesSelected}
                      multiple={true}
                    />

                    {selectedFiles.length > 0 && (
                      <div className="mt-6 space-y-4">
                        {/* Project Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-3">Project Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Project Name (optional)
                              </label>
                              <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="Auto-generated if empty"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description (optional)
                              </label>
                              <textarea
                                value={projectDescription}
                                onChange={(e) => setProjectDescription(e.target.value)}
                                placeholder="Brief description of your project"
                                rows={1}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Import Button */}
                        <button
                          onClick={handleProjectImport}
                          disabled={importProjectMutation.isPending}
                          className="flex items-center space-x-2 w-full justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                        >
                          {importProjectMutation.isPending ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                          <span>
                            {importProjectMutation.isPending
                              ? 'Importing...'
                              : `Import ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Import Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Import Instructions</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Supported file formats: .st, .prg, .fnc, .fb, .txt</li>
                      <li>• Maximum file size: 50MB per file</li>
                      <li>• Files will be automatically parsed for POU declarations and variables</li>
                      <li>• Dependencies between files will be automatically detected</li>
                      <li>• AI analysis will run automatically after import</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Data Tab */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Import Runtime Data</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Upload CSV files with variable snapshots, trace logs, or error logs from GX Works.
                    </p>

                    {/* Data Type Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Type
                      </label>
                      <select
                        value={dataType}
                        onChange={(e) => setDataType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="variables">Variable Snapshots</option>
                        <option value="traces">Trace Logs</option>
                        <option value="errors">Error Logs</option>
                      </select>
                    </div>

                    {/* CSV Upload */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload CSV File
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleFileSelect}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Supported formats: .csv, .txt
                      </p>
                    </div>

                    {/* CSV Content Preview */}
                    {csvContent && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CSV Preview
                        </label>
                        <div className="border border-gray-300 rounded-lg p-4">
                          <pre className="text-xs text-gray-600 overflow-x-auto max-h-32">
                            {csvContent.substring(0, 1000)}
                            {csvContent.length > 1000 && '\n...'}
                          </pre>
                          <p className="text-xs text-gray-500 mt-2">
                            Total characters: {csvContent.length}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Import Button */}
                    <button
                      onClick={handleDataImport}
                      disabled={!csvContent || !projects?.projects?.length || importDataMutation.isPending}
                      className="flex items-center space-x-2 w-full justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {importDataMutation.isPending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                      <span>
                        {importDataMutation.isPending ? 'Importing...' : 'Import Data'}
                      </span>
                    </button>

                    {/* No Projects Warning */}
                    {!projects?.projects?.length && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                          <p className="text-sm text-yellow-800">
                            No projects found. Create a project first before importing runtime data.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Data Format Instructions */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">CSV Format Requirements</h4>
                    <div className="space-y-3 text-sm text-gray-700">
                      <div>
                        <strong>Variable Snapshots:</strong>
                        <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
                          Timestamp,VariableName,Value,DataType,Address,Quality
                        </code>
                      </div>
                      <div>
                        <strong>Trace Logs:</strong>
                        <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
                          Timestamp,BlockName,LineNumber,ExecutionTime,TriggerEvent,VariableChanges
                        </code>
                      </div>
                      <div>
                        <strong>Error Logs:</strong>
                        <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
                          Timestamp,ErrorNumber,Message,Severity,BlockName,LineNumber,Details
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPage;