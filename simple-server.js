const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// In-memory storage (for demo purposes)
let projects = [
  {
    id: '1',
    name: 'Motor Control System',
    description: 'Main motor control and safety interlocks',
    version: 'v1.2.0',
    files: 12,
    updatedAt: '2024-11-25T10:30:00Z',
    score: 87
  },
  {
    id: '2',
    name: 'Safety Monitoring',
    description: 'Emergency stop and safety monitoring logic',
    version: 'v2.0.1',
    files: 8,
    updatedAt: '2024-11-24T15:45:00Z',
    score: 92
  },
  {
    id: '3',
    name: 'Temperature Control',
    description: 'Temperature regulation and alarm system',
    version: 'v1.0.5',
    files: 15,
    updatedAt: '2024-11-23T09:20:00Z',
    score: 78
  }
];

let nextId = 4;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: PORT
  });
});

// ===== PROJECT API ENDPOINTS =====

// GET all projects
app.get('/api/projects', (req, res) => {
  console.log('Fetching all projects');
  res.json({
    success: true,
    data: projects,
    count: projects.length
  });
});

// GET single project
app.get('/api/projects/:id', (req, res) => {
  const projectId = req.params.id;
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
      message: `Project with ID ${projectId} not found`
    });
  }

  res.json({
    success: true,
    data: project
  });
});

// POST create new project
app.post('/api/projects', (req, res) => {
  const { name, description, version } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Name required',
      message: 'Project name is required'
    });
  }

  const newProject = {
    id: nextId.toString(),
    name: name,
    description: description || '',
    version: version || 'v1.0.0',
    files: 0,
    updatedAt: new Date().toISOString(),
    score: Math.floor(Math.random() * 30) + 70 // Random score 70-100
  };

  projects.push(newProject);
  nextId++;

  console.log('Created new project:', newProject);

  res.status(201).json({
    success: true,
    data: newProject,
    message: 'Project created successfully'
  });
});

// PUT update project
app.put('/api/projects/:id', (req, res) => {
  const projectId = req.params.id;
  const projectIndex = projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
      message: `Project with ID ${projectId} not found`
    });
  }

  const { name, description, version } = req.body;

  projects[projectIndex] = {
    ...projects[projectIndex],
    name: name || projects[projectIndex].name,
    description: description !== undefined ? description : projects[projectIndex].description,
    version: version || projects[projectIndex].version,
    updatedAt: new Date().toISOString()
  };

  console.log('Updated project:', projects[projectIndex]);

  res.json({
    success: true,
    data: projects[projectIndex],
    message: 'Project updated successfully'
  });
});

// DELETE project
app.delete('/api/projects/:id', (req, res) => {
  const projectId = req.params.id;
  const projectIndex = projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
      message: `Project with ID ${projectId} not found`
    });
  }

  const deletedProject = projects.splice(projectIndex, 1)[0];

  console.log('Deleted project:', deletedProject);

  res.json({
    success: true,
    data: deletedProject,
    message: 'Project deleted successfully'
  });
});

// System status endpoint (for frontend dashboard)
app.get('/api/system/status', (req, res) => {
  res.json({
    success: true,
    data: {
      frontend: {
        status: 'operational',
        url: 'http://localhost:5178'
      },
      backend: {
        status: 'operational',
        url: `http://localhost:${PORT}`,
        uptime: process.uptime()
      },
      ai_service: {
        status: process.env.OPENAI_API_KEY ? 'operational' : 'offline',
        configured: !!process.env.OPENAI_API_KEY
      },
      database: {
        status: 'in_memory',
        type: 'demo'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI-ST Debugger Server started on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API endpoint: http://localhost:${PORT}/api/projects`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});