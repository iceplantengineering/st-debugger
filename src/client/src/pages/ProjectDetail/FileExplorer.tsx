import React, { useState } from 'react';
import { ChevronRight, File, Folder, Plus, Upload, MoreVertical } from 'lucide-react';
import { getPOUTypeIcon, getPOUTypeColor, formatFileSize, cn } from '../../lib/utils';

interface FileExplorerProps {
  project: any;
  selectedFile: any;
  onFileSelect: (file: any) => void;
}

interface FileNodeProps {
  node: any;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  isSelected: boolean;
}

const FileNode: React.FC<FileNodeProps> = ({ node, level, isExpanded, onToggle, onSelect, isSelected }) => {
  const hasChildren = node.children && node.children.length > 0;
  const icon = node.type === 'folder' ? (
    <Folder className="w-4 h-4 text-blue-500" />
  ) : (
    getPOUTypeIcon(node.type)
  );

  return (
    <div>
      <div
        className={cn(
          "flex items-center space-x-2 px-3 py-2 cursor-pointer transition-colors rounded",
          isSelected ? "bg-primary-100 text-primary-900" : "hover:bg-gray-100"
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={hasChildren ? onToggle : onSelect}
      >
        {hasChildren && (
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform",
              isExpanded && "transform rotate-90"
            )}
          />
        )}
        {!hasChildren && <div className="w-4" />}

        <span className="w-4 h-4 flex items-center justify-center">
          {icon}
        </span>

        <span className="flex-1 text-sm font-medium truncate">{node.name}</span>

        {node.type !== 'folder' && (
          <span className={cn(
            "px-2 py-1 text-xs font-medium rounded-full",
            getPOUTypeColor(node.type)
          )}>
            {node.type}
          </span>
        )}

        <button
          className="p-1 hover:bg-gray-200 rounded transition-colors opacity-0 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child: any) => (
            <FileNode
              key={child.id}
              node={child}
              level={level + 1}
              isExpanded={false}
              onToggle={() => {}}
              onSelect={() => {}}
              isSelected={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileExplorer: React.FC<FileExplorerProps> = ({ project, selectedFile, onFileSelect }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  const buildFileTree = () => {
    if (!project?.files) return { id: 'root', name: project.name, type: 'folder', children: [] };

    // Group files by type
    const groupedFiles: Record<string, any[]> = {
      Programs: [],
      'Function Blocks': [],
      Functions: [],
      Other: [],
    };

    project.files.forEach((file: any) => {
      let category = 'Other';
      switch (file.type) {
        case 'PROGRAM':
          category = 'Programs';
          break;
        case 'FUNCTION_BLOCK':
          category = 'Function Blocks';
          break;
        case 'FUNCTION':
          category = 'Functions';
          break;
      }
      groupedFiles[category].push(file);
    });

    const tree = {
      id: 'root',
      name: project.name,
      type: 'folder',
      children: Object.entries(groupedFiles).map(([category, files]) => ({
        id: category.toLowerCase().replace(' ', '-'),
        name: category,
        type: 'folder',
        children: files.map((file) => ({
          ...file,
          name: file.name,
          size: file.content?.length || 0,
        })),
      })),
    };

    return tree;
  };

  const fileTree = buildFileTree();
  const treeState = fileTree;

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleNodeSelect = (node: any) => {
    if (node.type !== 'folder') {
      onFileSelect(node);
    }
  };

  const isNodeExpanded = (nodeId: string) => expandedNodes.has(nodeId);

  const renderNode = (node: any, level: number = 0): React.ReactNode => {
    const isExpanded = isNodeExpanded(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center space-x-2 px-3 py-2 cursor-pointer transition-colors rounded",
            selectedFile?.id === node.id ? "bg-primary-100 text-primary-900" : "hover:bg-gray-100"
          )}
          style={{ paddingLeft: `${level * 12 + 12}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            } else {
              handleNodeSelect(node);
            }
          }}
        >
          {hasChildren && (
            <ChevronRight
              className={cn(
                "w-4 h-4 transition-transform",
                isExpanded && "transform rotate-90"
              )}
            />
          )}
          {!hasChildren && <div className="w-4" />}

          <span className="w-4 h-4 flex items-center justify-center">
            {node.type === 'folder' ? (
              <Folder className="w-4 h-4 text-blue-500" />
            ) : (
              getPOUTypeIcon(node.type)
            )}
          </span>

          <span className="flex-1 text-sm font-medium truncate">{node.name}</span>

          {node.type !== 'folder' && (
            <span className={cn(
              "px-2 py-1 text-xs font-medium rounded-full",
              getPOUTypeColor(node.type)
            )}>
              {node.type}
            </span>
          )}

          {node.size && (
            <span className="text-xs text-gray-500">
              {formatFileSize(node.size)}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child: any) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Files</h2>
          <div className="flex items-center space-x-1">
            <button
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="New File"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Upload File"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* File Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 px-3 py-2 rounded">
            <span className="text-gray-600">Files:</span>
            <span className="ml-2 font-medium">{project?.files?.length || 0}</span>
          </div>
          <div className="bg-gray-50 px-3 py-2 rounded">
            <span className="text-gray-600">Size:</span>
            <span className="ml-2 font-medium">
              {formatFileSize(
                project?.files?.reduce((total: number, file: any) =>
                  total + (file.content?.length || 0), 0
                ) || 0
              )}
            </span>
          </div>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto p-2">
        {project?.files?.length === 0 ? (
          <div className="text-center py-8">
            <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No files</h3>
            <p className="text-xs text-gray-500 mb-4">Import files to get started</p>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm">
              Import Files
            </button>
          </div>
        ) : (
          <div>
            {renderNode(treeState)}
          </div>
        )}
      </div>

      {/* File Details */}
      {selectedFile && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-2">File Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{selectedFile.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">{selectedFile.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Size:</span>
              <span className="font-medium">
                {formatFileSize(selectedFile.content?.length || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Modified:</span>
              <span className="font-medium">
                {new Date(selectedFile.lastModified).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Variables:</span>
              <span className="font-medium">{selectedFile.variables?.length || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;