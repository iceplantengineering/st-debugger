import sqlite3 from 'sqlite3';
import path from 'path';
import { logger } from '../utils/logger';

let db: sqlite3.Database | null = null;

export const initializeDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const dbPath = process.env.DB_PATH || './data/st-debugger.db';

    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    const fs = require('fs');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error('Failed to connect to database:', err);
        reject(err);
        return;
      }

      logger.info(`Connected to SQLite database at ${dbPath}`);
      createTables().then(resolve).catch(reject);
    });
  });
};

const createTables = async (): Promise<void> => {
  const tables = [
    // Projects table
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      version TEXT DEFAULT '1.0.0',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT
    )`,

    // Files table
    `CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT,
      file_path TEXT,
      version TEXT DEFAULT '1.0.0',
      last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
      ast TEXT,
      description TEXT,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )`,

    // Variables table
    `CREATE TABLE IF NOT EXISTS variables (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      name TEXT NOT NULL,
      data_type TEXT NOT NULL,
      address TEXT,
      initial_value TEXT,
      scope TEXT NOT NULL,
      is_constant BOOLEAN DEFAULT 0,
      description TEXT,
      FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
    )`,

    // Dependencies table
    `CREATE TABLE IF NOT EXISTS dependencies (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      source_file_id TEXT NOT NULL,
      target_file_id TEXT,
      dependency_name TEXT NOT NULL,
      dependency_type TEXT NOT NULL,
      strength REAL DEFAULT 1.0,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      FOREIGN KEY (source_file_id) REFERENCES files (id) ON DELETE CASCADE,
      FOREIGN KEY (target_file_id) REFERENCES files (id) ON DELETE CASCADE
    )`,

    // Runtime data table
    `CREATE TABLE IF NOT EXISTS runtime_data (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      data_type TEXT NOT NULL,
      timestamp DATETIME NOT NULL,
      data TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )`,

    // Analysis results table
    `CREATE TABLE IF NOT EXISTS analysis_results (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      analysis_type TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      results TEXT NOT NULL,
      confidence REAL,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )`,

    // Versions table
    `CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      version TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      parent_version_id TEXT,
      changes TEXT NOT NULL,
      tags TEXT,
      metadata TEXT,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      FOREIGN KEY (parent_version_id) REFERENCES versions (id)
    )`,

    // Project history table
    `CREATE TABLE IF NOT EXISTS project_history (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      activity_type TEXT NOT NULL,
      activity_data TEXT NOT NULL,
      user_id TEXT,
      session_id TEXT,
      context TEXT,
      metadata TEXT,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )`
  ];

  // Create indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_files_project_id ON files (project_id)',
    'CREATE INDEX IF NOT EXISTS idx_variables_file_id ON variables (file_id)',
    'CREATE INDEX IF NOT EXISTS idx_dependencies_project_id ON dependencies (project_id)',
    'CREATE INDEX IF NOT EXISTS idx_runtime_data_project_id ON runtime_data (project_id)',
    'CREATE INDEX IF NOT EXISTS idx_analysis_results_project_id ON analysis_results (project_id)',
    'CREATE INDEX IF NOT EXISTS idx_versions_project_id ON versions (project_id)',
    'CREATE INDEX IF NOT EXISTS idx_project_history_project_id ON project_history (project_id)',
    'CREATE INDEX IF NOT EXISTS idx_project_history_timestamp ON project_history (timestamp)'
  ];

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.serialize(() => {
      let completedOperations = 0;
      const totalOperations = tables.length + indexes.length;

      const checkComplete = () => {
        completedOperations++;
        if (completedOperations === totalOperations) {
          logger.info('Database tables and indexes created successfully');
          resolve();
        }
      };

      // Create tables
      tables.forEach((tableSql) => {
        db!.run(tableSql, (err) => {
          if (err) {
            logger.error('Error creating table:', err);
            reject(err);
            return;
          }
          checkComplete();
        });
      });

      // Create indexes
      indexes.forEach((indexSql) => {
        db!.run(indexSql, (err) => {
          if (err) {
            logger.error('Error creating index:', err);
            reject(err);
            return;
          }
          checkComplete();
        });
      });
    });
  });
};

export const getDatabase = (): sqlite3.Database => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }

    db.close((err) => {
      if (err) {
        logger.error('Error closing database:', err);
        reject(err);
        return;
      }
      logger.info('Database connection closed');
      db = null;
      resolve();
    });
  });
};

// Database query helper functions
export const runQuery = (sql: string, params: any[] = []): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    getDatabase().run(sql, params, function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });
};

export const getQuery = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    getDatabase().get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
};

export const allQuery = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    getDatabase().all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
};

export const batchRun = (operations: Array<{ sql: string; params?: any[] }>): Promise<void> => {
  return new Promise((resolve, reject) => {
    getDatabase().serialize(() => {
      getDatabase().run('BEGIN TRANSACTION');

      let completed = 0;
      const total = operations.length;

      operations.forEach(({ sql, params = [] }, index) => {
        getDatabase().run(sql, params, (err) => {
          if (err) {
            getDatabase().run('ROLLBACK');
            reject(err);
            return;
          }

          completed++;
          if (completed === total) {
            getDatabase().run('COMMIT', (commitErr) => {
              if (commitErr) {
                reject(commitErr);
                return;
              }
              resolve();
            });
          }
        });
      });
    });
  });
};