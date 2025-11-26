import React, { useState } from 'react';
import { Download, FileArchive, FileText, Table } from 'lucide-react';

interface ExportButtonProps {
  projectId: string;
  projectName: string;
  className?: string;
}

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  endpoint: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  projectId,
  projectName,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const exportFormats: ExportFormat[] = [
    {
      id: 'zip',
      name: 'ZIP Archive',
      description: 'Complete project with all files and analysis',
      icon: <FileArchive className="w-4 h-4" />,
      endpoint: `/api/export/projects/${projectId}`
    },
    {
      id: 'txt',
      name: 'Text Report',
      description: 'Analysis report in text format',
      icon: <FileText className="w-4 h-4" />,
      endpoint: `/api/export/analysis-report/${projectId}`
    },
    {
      id: 'json',
      name: 'JSON Report',
      description: 'Analysis data in JSON format',
      icon: <FileText className="w-4 h-4" />,
      endpoint: `/api/export/analysis-report/${projectId}`
    },
    {
      id: 'csv',
      name: 'CSV Data',
      description: 'Analysis data in CSV format',
      icon: <Table className="w-4 h-4" />,
      endpoint: `/api/export/analysis-report/${projectId}`
    }
  ];

  const handleExport = async (format: ExportFormat) => {
    setIsLoading(format.id);

    try {
      const baseUrl = 'http://localhost:3001';
      let url = `${baseUrl}${format.endpoint}`;

      // For analysis reports, we need to POST with format
      if (format.id === 'txt' || format.id === 'json' || format.id === 'csv') {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ format: format.id })
        });

        if (!response.ok) {
          throw new Error(`Export failed: ${response.statusText}`);
        }

        // Get filename from Content-Disposition header or create one
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_report.${format.id}`;

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        // Create blob and download
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        // For ZIP export, use direct download
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(null);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        disabled={isLoading !== null}
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
        {isLoading && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        )}
      </button>

      {/* Export Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Export Project</h3>
              <p className="text-sm text-gray-600 mt-1">
                Choose format for "{projectName}"
              </p>
            </div>

            <div className="p-2 max-h-64 overflow-y-auto">
              {exportFormats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => handleExport(format)}
                  disabled={isLoading === format.id}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="mt-0.5 text-gray-600">
                    {format.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">
                      {format.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-0.5">
                      {format.description}
                    </div>
                  </div>
                  {isLoading === format.id && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <p className="text-xs text-gray-500">
                ZIP files contain all source files and analysis reports.
                Analysis reports are generated based on the latest code analysis.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;