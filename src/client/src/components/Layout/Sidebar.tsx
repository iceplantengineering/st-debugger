import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  FolderOpen,
  Upload,
  FileText,
  Settings,
  History,
  Download,
  Brain,
  Activity,
  Database,
  GitBranch,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, href, isActive }) => {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
        "hover:bg-gray-100 group",
        isActive
          ? "bg-primary-100 text-primary-900 border-r-2 border-primary-600"
          : "text-gray-700 hover:text-gray-900"
      )}
    >
      <div className={cn(
        "w-5 h-5 transition-colors",
        isActive ? "text-primary-600" : "text-gray-500 group-hover:text-gray-700"
      )}>
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);

  const menuItems = [
    {
      icon: <Home />,
      label: 'Dashboard',
      href: '/',
    },
    {
      icon: <FolderOpen />,
      label: 'Projects',
      href: '/projects',
    },
    {
      icon: <Upload />,
      label: 'Import',
      href: '/import',
    },
    {
      icon: <FileText />,
      label: 'Code Editor',
      href: '/editor',
    },
    {
      icon: <Brain />,
      label: 'AI Analysis',
      href: '/analysis',
    },
    {
      icon: <Activity />,
      label: 'Runtime Monitor',
      href: '/monitor',
    },
    {
      icon: <Database />,
      label: 'Data Logs',
      href: '/logs',
    },
    {
      icon: <GitBranch />,
      label: 'Versions',
      href: '/versions',
    },
    {
      icon: <History />,
      label: 'History',
      href: '/history',
    },
    {
      icon: <Download />,
      label: 'Export',
      href: '/export',
    },
  ];

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      isExpanded ? "w-64" : "w-16"
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">ST</span>
          </div>
          {isExpanded && (
            <div>
              <h2 className="font-semibold text-gray-900">Debugger</h2>
              <p className="text-xs text-gray-500">AI-Powered</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            isActive={location.pathname === item.href}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full flex items-center justify-center p-2 rounded-lg transition-colors",
            "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          )}
        >
          <Settings className="w-5 h-5" />
          {isExpanded && (
            <span className="ml-3 text-sm">Toggle Sidebar</span>
          )}
        </button>
      </div>

      {/* Status Indicators */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Server</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">Online</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">AI Service</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;