import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  ConnectionLineType,
  Panel,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FileText, Package, ArrowRight, AlertTriangle } from 'lucide-react';

interface DependencyNode {
  id: string;
  type: 'program' | 'function' | 'functionBlock' | 'global';
  name: string;
  file: string;
  issues: number;
  variables: number;
  dependencies: string[];
}

interface DependencyGraphProps {
  project: any;
  files: any[];
  className?: string;
}

// Custom Node Component
const CustomNode: React.FC<any> = ({ data, selected }) => {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'program':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'function':
        return <Package className="w-4 h-4 text-green-600" />;
      case 'functionBlock':
        return <Package className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'program':
        return 'border-blue-200 bg-blue-50';
      case 'function':
        return 'border-green-200 bg-green-50';
      case 'functionBlock':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div
      className={`
        px-4 py-3 shadow-lg rounded-lg border-2 min-w-[200px] transition-all
        ${getNodeColor(data.type)}
        ${selected ? 'ring-2 ring-primary-500' : ''}
      `}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-center space-x-2 mb-2">
        {getNodeIcon(data.type)}
        <span className="font-medium text-sm text-gray-900">{data.name}</span>
        {data.issues > 0 && (
          <div className="flex items-center space-x-1 ml-auto">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span className="text-xs text-red-600 font-medium">
              {data.issues}
            </span>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-600 space-y-1">
        <div>File: {data.file}</div>
        <div>Variables: {data.variables}</div>
        {data.dependencies.length > 0 && (
          <div className="flex items-center space-x-1">
            <span>Deps:</span>
            <span className="text-xs bg-gray-200 px-1 rounded">
              {data.dependencies.length}
            </span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

// Node types
const nodeTypes = {
  custom: CustomNode,
};

const DependencyGraph: React.FC<DependencyGraphProps> = ({ project, files, className = '' }) => {
  // Generate nodes and edges from files data
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeMap = new Map<string, DependencyNode>();

    // Create nodes from POU files
    files.forEach((file, index) => {
      if (file.ast && file.ast.pous) {
        file.ast.pous.forEach((pou: any, pouIndex: number) => {
          const nodeId = `${file.id}-${pou.name}`;
          const node: DependencyNode = {
            id: nodeId,
            type: pou.type.toLowerCase(),
            name: pou.name,
            file: file.name,
            issues: pou.issues?.length || 0,
            variables: pou.variables?.length || 0,
            dependencies: [],
          };

          // Extract dependencies from AST
          if (pou.statements) {
            const extractDependencies = (stmt: any): string[] => {
              const deps: string[] = [];
              if (stmt.type === 'function_call' && stmt.function) {
                deps.push(stmt.function);
              }
              if (stmt.statements) {
                stmt.statements.forEach((s: any) => deps.push(...extractDependencies(s)));
              }
              if (stmt.ifBody) deps.push(...extractDependencies(stmt.ifBody));
              if (stmt.elseBody) deps.push(...extractDependencies(stmt.elseBody));
              return deps;
            };

            node.dependencies = extractDependencies(pou.statements);
          }

          nodeMap.set(nodeId, node);

          // Calculate node position
          const row = Math.floor(pouIndex / 3);
          const col = pouIndex % 3;

          nodes.push({
            id: nodeId,
            type: 'custom',
            position: {
              x: col * 280 + 50,
              y: row * 200 + 50,
            },
            data: node,
          });
        });
      }
    });

    // Create edges from dependencies
    nodeMap.forEach((node) => {
      node.dependencies.forEach((dep) => {
        // Find the target node
        const targetNode = Array.from(nodeMap.values()).find(n => n.name === dep);
        if (targetNode && targetNode.id !== node.id) {
          edges.push({
            id: `${node.id}-${targetNode.id}`,
            source: node.id,
            target: targetNode.id,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#6b7280', strokeWidth: 2 },
            markerEnd: {
              type: 'arrow',
              color: '#6b7280',
            },
          });
        }
      });
    });

    return { nodes, edges };
  }, [files]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Generate sample data if no real data available
  const sampleNodes = useMemo(() => {
    if (nodes.length === 0) {
      return [
        {
          id: 'main',
          type: 'custom',
          position: { x: 250, y: 50 },
          data: {
            type: 'program',
            name: 'MainProgram',
            file: 'main.prg',
            issues: 2,
            variables: 15,
            dependencies: ['MotorControl', 'SafetySystem'],
          },
        },
        {
          id: 'motor',
          type: 'custom',
          position: { x: 100, y: 250 },
          data: {
            type: 'functionBlock',
            name: 'MotorControl',
            file: 'motor.fb',
            issues: 0,
            variables: 8,
            dependencies: ['PID'],
          },
        },
        {
          id: 'safety',
          type: 'custom',
          position: { x: 400, y: 250 },
          data: {
            type: 'function',
            name: 'SafetySystem',
            file: 'safety.fnc',
            issues: 1,
            variables: 5,
            dependencies: [],
          },
        },
        {
          id: 'pid',
          type: 'custom',
          position: { x: 250, y: 450 },
          data: {
            type: 'functionBlock',
            name: 'PID',
            file: 'pid.fb',
            issues: 0,
            variables: 6,
            dependencies: [],
          },
        },
      ];
    }
    return nodes;
  }, [nodes]);

  const sampleEdges = useMemo(() => {
    if (edges.length === 0 && sampleNodes.length > 0) {
      return [
        {
          id: 'main-motor',
          source: 'main',
          target: 'motor',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6b7280', strokeWidth: 2 },
        },
        {
          id: 'main-safety',
          source: 'main',
          target: 'safety',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6b7280', strokeWidth: 2 },
        },
        {
          id: 'motor-pid',
          source: 'motor',
          target: 'pid',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6b7280', strokeWidth: 2 },
        },
      ];
    }
    return edges;
  }, [edges, sampleNodes]);

  const displayNodes = nodes.length > 0 ? nodes : sampleNodes;
  const displayEdges = edges.length > 0 ? edges : sampleEdges;

  return (
    <div className={`h-full bg-gray-50 ${className}`}>
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.data?.type) {
              case 'program':
                return '#dbeafe';
              case 'function':
                return '#d1fae5';
              case 'functionBlock':
                return '#f3e8ff';
              default:
                return '#f3f4f6';
            }
          }}
          className="bg-white border border-gray-200"
        />
        <Panel position="top-left" className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Dependency Graph</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-200 bg-blue-50 rounded"></div>
              <span>Programs</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-green-200 bg-green-50 rounded"></div>
              <span>Functions</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-purple-200 bg-purple-50 rounded"></div>
              <span>Function Blocks</span>
            </div>
            <div className="flex items-center space-x-2">
              <ArrowRight className="w-4 h-4 text-gray-600" />
              <span>Dependencies</span>
            </div>
          </div>
        </Panel>
        <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <div className="space-y-2 text-sm">
            <div className="text-gray-600">
              Total Nodes: <span className="font-medium">{displayNodes.length}</span>
            </div>
            <div className="text-gray-600">
              Total Edges: <span className="font-medium">{displayEdges.length}</span>
            </div>
            <div className="text-gray-600">
              Issues: <span className="font-medium text-red-600">
                {displayNodes.reduce((sum, node) => sum + (node.data?.issues || 0), 0)}
              </span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default DependencyGraph;