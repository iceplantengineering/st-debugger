import { Express } from 'express';
import projectRoutes from './projects';
import fileRoutes from './files';
import analysisRoutes from './analysis';
import aiRoutes from './ai';
import importRoutes from './import';
import exportRoutes from './export';
import versionRoutes from './versions';
import historyRoutes from './history';

export const setupRoutes = (app: Express): void => {
  // API version prefix
  const apiPrefix = '/api';

  // Register routes
  app.use(`${apiPrefix}/projects`, projectRoutes);
  app.use(`${apiPrefix}/files`, fileRoutes);
  app.use(`${apiPrefix}/analysis`, analysisRoutes);
  app.use(`${apiPrefix}/ai`, aiRoutes);
  app.use(`${apiPrefix}/import`, importRoutes);
  app.use(`${apiPrefix}/export`, exportRoutes);
  app.use(`${apiPrefix}/versions`, versionRoutes);
  app.use(`${apiPrefix}/history`, historyRoutes);

  // Demo routes (for development/testing)
  if (process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true') {
    app.use(`${apiPrefix}/demo`, import('./demo').then(m => m.default));
  }
};