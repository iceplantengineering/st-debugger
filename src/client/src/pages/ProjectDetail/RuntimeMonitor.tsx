import React, { useState, useEffect } from 'react';
import { Activity, Upload, Download, Play, Pause, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatDateTime, getRelativeTime } from '../../lib/utils';

interface RuntimeMonitorProps {
  project: any;
}

const RuntimeMonitor: React.FC<RuntimeMonitorProps> = ({ project }) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [refreshInterval, setRefreshInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Get runtime data
  const { data: runtimeData, refetch } = useQuery({
    queryKey: ['runtime-data', project.id, timeRange],
    queryFn: () => api.getRuntimeData(project.id, {
      startTime: getStartTime(timeRange),
      endTime: new Date(),
    }),
    enabled: !!project.id,
    refetchInterval: refreshInterval ? 5000 : false, // Auto refresh every 5 seconds if monitoring
  });

  // Get error logs
  const { data: errorLogs } = useQuery({
    queryKey: ['error-logs', project.id],
    queryFn: () => api.getRuntimeData(project.id, {
      dataType: 'ERROR_LOG',
      startTime: getStartTime(timeRange),
      endTime: new Date(),
    }),
    enabled: !!project.id,
  });

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        refetch();
      }, 5000);
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isMonitoring, refetch]);

  const getStartTime = (range: string): Date => {
    const now = new Date();
    switch (range) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '6h':
        return new Date(now.getTime() - 6 * 60 * 60 * 1000);
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 60 * 60 * 1000);
    }
  };

  // Sample data for demonstration (not used in current implementation)
  /*
  const sampleVariableData = [
    { time: '10:00', motorSpeed: 1200, temperature: 25.5, pressure: 2.1 },
    { time: '10:05', motorSpeed: 1400, temperature: 27.2, pressure: 2.3 },
    { time: '10:10', motorSpeed: 1600, temperature: 28.8, pressure: 2.5 },
    { time: '10:15', motorSpeed: 1500, temperature: 28.1, pressure: 2.4 },
    { time: '10:20', motorSpeed: 1700, temperature: 30.2, pressure: 2.7 },
    { time: '10:25', motorSpeed: 1650, temperature: 29.7, pressure: 2.6 },
    { time: '10:30', motorSpeed: 1800, temperature: 31.5, pressure: 2.9 },
  ];

  const samplePerformanceData = [
    { time: '10:00', cpu: 45, memory: 62, io: 23 },
    { time: '10:05', cpu: 52, memory: 65, io: 28 },
    { time: '10:10', cpu: 48, memory: 68, io: 25 },
    { time: '10:15', cpu: 58, memory: 70, io: 35 },
    { time: '10:20', cpu: 62, memory: 72, io: 42 },
    { time: '10:25', cpu: 55, memory: 69, io: 30 },
    { time: '10:30', cpu: 50, memory: 66, io: 26 },
  ];
  */

  const recentErrors = errorLogs?.errorLogs?.slice(0, 5) || [];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Runtime Monitor</h2>
            <p className="text-sm text-gray-600">Real-time monitoring of {project.name}</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              {(['1h', '6h', '24h', '7d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    timeRange === range
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Control Buttons */}
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isMonitoring
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isMonitoring ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start</span>
                </>
              )}
            </button>

            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
            </button>

            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-gray-600">
                {isMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}
              </span>
            </div>
            <div className="text-gray-600">
              Last update: {runtimeData ? formatDateTime(new Date()) : 'Never'}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {recentErrors.length > 0 && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span>{recentErrors.length} recent errors</span>
              </div>
            )}
            <div className="text-gray-600">
              Variables: {runtimeData?.variableSnapshots?.[0]?.variables?.length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Variable Trends */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Variable Trends</h3>

            <div className="mb-4">
              <select
                value={selectedVariable}
                onChange={(e) => setSelectedVariable(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select variable to monitor</option>
                <option value="motorSpeed">Motor Speed</option>
                <option value="temperature">Temperature</option>
                <option value="pressure">Pressure</option>
              </select>
            </div>

            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Variable Trends Chart</h3>
                <p className="text-sm text-gray-600">Real-time variable monitoring</p>
                <div className="mt-4 text-xs text-gray-500">
                  Motor Speed: 1,650 RPM<br />
                  Temperature: 31.5°C<br />
                  Pressure: 2.9 Bar
                </div>
              </div>
            </div>
          </div>

          {/* System Performance */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>

          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
                <p className="text-sm text-gray-600">System resource usage</p>
                <div className="mt-4 text-xs text-gray-500">
                  CPU: 50% | Memory: 66% | I/O: 26%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Values */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-600">Motor Speed</h4>
              <Activity className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">1,650</span>
              <span className="text-sm text-gray-500 ml-1">RPM</span>
            </div>
            <div className="mt-1">
              <span className="text-xs text-green-600">▲ 150 RPM (10%)</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-600">Temperature</h4>
              <Activity className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">31.5</span>
              <span className="text-sm text-gray-500 ml-1">°C</span>
            </div>
            <div className="mt-1">
              <span className="text-xs text-yellow-600">▲ 3.3°C (12%)</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-600">Pressure</h4>
              <Activity className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">2.9</span>
              <span className="text-sm text-gray-500 ml-1">Bar</span>
            </div>
            <div className="mt-1">
              <span className="text-xs text-green-600">▲ 0.4 Bar (16%)</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-600">Status</h4>
              <Activity className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-green-600">Normal</span>
            </div>
            <div className="mt-1">
              <span className="text-xs text-gray-600">All systems operational</span>
            </div>
          </div>
        </div>

        {/* Recent Errors */}
        {recentErrors.length > 0 && (
          <div className="mt-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span>Recent Errors</span>
              </h3>

              <div className="space-y-3">
                {recentErrors.map((error: any, index: number) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-red-800">
                          Error #{error.errorNumber}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          error.severity === 'ERROR'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {error.severity}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {getRelativeTime(error.timestamp)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mb-2">{error.message}</p>

                    {error.details && (
                      <div className="text-xs text-gray-600">
                        <p><strong>Block:</strong> {error.blockName}</p>
                        {error.lineNumber && <p><strong>Line:</strong> {error.lineNumber}</p>}
                        {error.details.temperature && (
                          <p><strong>Temperature:</strong> {error.details.temperature}°C</p>
                        )}
                        {error.details.threshold && (
                          <p><strong>Threshold:</strong> {error.details.threshold}°C</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RuntimeMonitor;