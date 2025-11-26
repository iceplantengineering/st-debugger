import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function for combining Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date/time
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format duration in milliseconds
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else if (ms < 3600000) {
    return `${(ms / 60000).toFixed(1)}m`;
  } else {
    return `${(ms / 3600000).toFixed(1)}h`;
  }
}

// Get severity color
export function getSeverityColor(severity: string): string {
  const colors = {
    CRITICAL: 'text-red-600 bg-red-50 border-red-200',
    ERROR: 'text-orange-600 bg-orange-50 border-orange-200',
    WARNING: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    INFO: 'text-blue-600 bg-blue-50 border-blue-200',
  };

  return colors[severity as keyof typeof colors] || colors.INFO;
}

// Get severity icon
export function getSeverityIcon(severity: string): string {
  const icons = {
    CRITICAL: '🚨',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
  };

  return icons[severity as keyof typeof icons] || icons.INFO;
}

// Get POU type icon
export function getPOUTypeIcon(type: string): string {
  const icons = {
    PROGRAM: '📄',
    FUNCTION_BLOCK: '🧱',
    FUNCTION: '⚡',
  };

  return icons[type as keyof typeof icons] || '📄';
}

// Get POU type color
export function getPOUTypeColor(type: string): string {
  const colors = {
    PROGRAM: 'bg-blue-100 text-blue-800',
    FUNCTION_BLOCK: 'bg-green-100 text-green-800',
    FUNCTION: 'bg-purple-100 text-purple-800',
  };

  return colors[type as keyof typeof colors] || colors.PROGRAM;
}

// Download blob as file
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}

// Validate file extension
export function isValidFileExtension(filename: string, allowedExtensions: string[]): boolean {
  const extension = '.' + filename.split('.').pop()?.toLowerCase();
  return allowedExtensions.includes(extension);
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Format number with commas
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Get file extension icon
export function getFileIcon(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();

  const icons: Record<string, string> = {
    st: '📝',
    prg: '📄',
    fnc: '⚡',
    fb: '🧱',
    txt: '📄',
    csv: '📊',
    pdf: '📕',
    doc: '📘',
    docx: '📘',
    md: '📝',
    json: '📋',
    xml: '📋',
  };

  return icons[extension || ''] || '📄';
}

// Parse CSV content
export function parseCSV(content: string): string[][] {
  const lines = content.split('\n');
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }).filter(line => line.some(cell => cell.length > 0));
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Get relative time
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDateTime(target);
  }
}

// Generate random color
export function generateRandomColor(): string {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
    '#06b6d4', '#84cc16', '#a855f7', '#f43f5e',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Check if string is empty or only whitespace
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}

// Get file type from MIME type
export function getFileTypeFromMime(mimeType: string): string {
  const mimeTypes: Record<string, string> = {
    'text/plain': 'text',
    'text/csv': 'csv',
    'application/json': 'json',
    'application/xml': 'xml',
    'application/pdf': 'pdf',
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/gif': 'image',
  };

  return mimeTypes[mimeType] || 'unknown';
}

// Calculate percentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Safe JSON parse
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// Check if object is empty
export function isEmptyObject(obj: any): boolean {
  return Object.keys(obj).length === 0;
}

// Deep clone object
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Sort array by property
export function sortByProperty<T>(array: T[], property: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aValue = a[property];
    const bValue = b[property];

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// Group array by property
export function groupByProperty<T>(array: T[], property: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = String(item[property]);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}