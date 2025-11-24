import React from 'react';
import { Settings, HelpCircle, Bell } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'AI-ST Debugger Pro', subtitle }) => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full status-online"></div>
            <span className="text-sm text-gray-600">Connected</span>
          </div>

          {/* Notifications */}
          <button
            className={cn(
              "p-2 rounded-lg hover:bg-gray-100 transition-colors relative",
              "group"
            )}
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Help */}
          <button
            className={cn(
              "p-2 rounded-lg hover:bg-gray-100 transition-colors",
              "group"
            )}
            title="Help"
          >
            <HelpCircle className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
          </button>

          {/* Settings */}
          <button
            className={cn(
              "p-2 rounded-lg hover:bg-gray-100 transition-colors",
              "group"
            )}
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
          </button>
        </div>
      </div>

      {/* Quick Status Bar */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Projects:</span>
              <span className="font-medium text-gray-900">3 Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Issues:</span>
              <span className="font-medium text-yellow-600">2 Warnings</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">AI Status:</span>
              <span className="font-medium text-green-600">Ready</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-500">
              Last analysis: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;