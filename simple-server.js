const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept ST-related files
    const allowedExtensions = ['.st', '.prg', '.fnc', '.fb', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .st, .prg, .fnc, .fb, .txt files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    score: 87,
    uploadedFiles: []
  },
  {
    id: '2',
    name: 'Safety Monitoring',
    description: 'Emergency stop and safety monitoring logic',
    version: 'v2.0.1',
    files: 8,
    updatedAt: '2024-11-24T15:45:00Z',
    score: 92,
    uploadedFiles: []
  },
  {
    id: '3',
    name: 'Temperature Control',
    description: 'Temperature regulation and alarm system',
    version: 'v1.0.5',
    files: 15,
    updatedAt: '2024-11-23T09:20:00Z',
    score: 78,
    uploadedFiles: []
  }
];

let nextId = 4;
let uploadedFiles = [];

// ===== ST LANGUAGE PARSER =====

class STParser {
  constructor(code) {
    this.code = code;
    this.lines = code.split('\n');
    this.variables = [];
    this.functions = [];
    this.functionBlocks = [];
    this.programs = [];
    this.errors = [];
  }

  parse() {
    try {
      this.extractVariables();
      this.extractFunctions();
      this.extractFunctionBlocks();
      this.extractPrograms();

      return {
        success: true,
        ast: {
          variables: this.variables,
          functions: this.functions,
          functionBlocks: this.functionBlocks,
          programs: this.programs
        },
        errors: this.errors
      };
    } catch (error) {
      this.errors.push({
        line: 0,
        message: `Parse error: ${error.message}`,
        type: 'syntax'
      });

      return {
        success: false,
        ast: null,
        errors: this.errors
      };
    }
  }

  extractVariables() {
    const varRegex = /VAR\s+(?:INPUT|OUTPUT|IN_OUT|GLOBAL)?\s*([^:]+):\s*([^;]+);/gi;
    let match;

    while ((match = varRegex.exec(this.code)) !== null) {
      const varNames = match[1].trim().split(',').map(v => v.trim());
      const varType = match[2].trim();

      varNames.forEach(name => {
        this.variables.push({
          name: name,
          type: varType,
          line: this.getLineNumber(match.index)
        });
      });
    }
  }

  extractFunctions() {
    const funcRegex = /FUNCTION\s+(\w+)\s*:\s*([^:]+)(?:\s*VAR\s+INPUT\s+([^:]+):?\s*([^;]+);)?\s*(?:.*?)END_FUNCTION/gis;
    let match;

    while ((match = funcRegex.exec(this.code)) !== null) {
      this.functions.push({
        name: match[1],
        returnType: match[2],
        parameters: this.extractParameters(match[3] || '', match[4] || ''),
        line: this.getLineNumber(match.index)
      });
    }
  }

  extractFunctionBlocks() {
    const fbRegex = /FUNCTION_BLOCK\s+(\w+)(?:\s*VAR\s+INPUT\s+([^:]+):?\s*([^;]+);)?\s*(?:.*?)END_FUNCTION_BLOCK/gis;
    let match;

    while ((match = fbRegex.exec(this.code)) !== null) {
      this.functionBlocks.push({
        name: match[1],
        parameters: this.extractParameters(match[2] || '', match[3] || ''),
        line: this.getLineNumber(match.index)
      });
    }
  }

  extractPrograms() {
    const progRegex = /PROGRAM\s+(\w+)(?:\s*VAR\s+([^:]+):?\s*([^;]+);)?\s*(?:.*?)END_PROGRAM/gis;
    let match;

    while ((match = progRegex.exec(this.code)) !== null) {
      this.programs.push({
        name: match[1],
        parameters: this.extractParameters(match[2] || '', match[3] || ''),
        line: this.getLineNumber(match.index)
      });
    }
  }

  extractParameters(paramStr, typeStr) {
    if (!paramStr) return [];

    return paramStr.split(',').map(p => ({
      name: p.trim(),
      type: typeStr.trim() || 'ANY'
    }));
  }

  getLineNumber(index) {
    const beforeIndex = this.code.substring(0, index);
    return beforeIndex.split('\n').length;
  }
}

// ===== ANALYSIS FUNCTIONS =====

function analyzeSTCode(code) {
  try {
    const parser = new STParser(code);
    const result = parser.parse();

    // Additional analysis
    const analysis = {
      complexity: calculateComplexity(code),
      issues: detectIssues(code, result.ast),
      suggestions: generateSuggestions(code, result.ast)
    };

    return {
      ...result,
      analysis
    };
  } catch (error) {
    return {
      success: false,
      ast: null,
      errors: [{ message: error.message, line: 0, type: 'fatal' }],
      analysis: null
    };
  }
}

function calculateComplexity(code) {
  const lines = code.split('\n').filter(line => line.trim() && !line.trim().startsWith('//'));
  const loops = (code.match(/\b(FOR|WHILE|REPEAT)\b/gi) || []).length;
  const conditions = (code.match(/\b(IF|CASE|ELSIF)\b/gi) || []).length;
  const assignments = (code.match(/:=/g) || []).length;

  return {
    totalLines: lines.length,
    controlStructures: loops + conditions,
    assignments: assignments.length,
    score: Math.min(100, Math.max(0, 100 - (loops * 5 + conditions * 3 + assignments * 0.5)))
  };
}

function detectIssues(code, ast) {
  const issues = [];

  // Check for common issues
  if (!code.includes('IF') && !code.includes('CASE')) {
    issues.push({
      type: 'warning',
      message: 'No conditional logic found - program may be too simple',
      suggestion: 'Consider adding error handling or conditional logic'
    });
  }

  if ((code.match(/GOTO/gi) || []).length > 0) {
    issues.push({
      type: 'error',
      message: 'GOTO statements detected - considered poor practice',
      suggestion: 'Replace with structured programming constructs'
    });
  }

  if (ast && ast.variables.length === 0) {
    issues.push({
      type: 'warning',
      message: 'No variables declared',
      suggestion: 'Declare variables for better code organization'
    });
  }

  return issues;
}

function generateSuggestions(code, ast) {
  const suggestions = [];

  if (ast && ast.variables.length > 10) {
    suggestions.push({
      type: 'optimization',
      message: 'Consider organizing variables into structures',
      priority: 'medium'
    });
  }

  if ((code.match(/\b(FOR|WHILE)\b/gi) || []).length > 5) {
    suggestions.push({
      type: 'performance',
      message: 'Multiple loops detected - consider optimizing execution time',
      priority: 'high'
    });
  }

  return suggestions;
}

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

// ===== FILE MANAGEMENT API ENDPOINTS =====

// Upload file to project
app.post('/api/projects/:id/files', upload.single('file'), (req, res) => {
  const projectId = req.params.id;
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
      message: `Project with ID ${projectId} not found`
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded',
      message: 'Please select a file to upload'
    });
  }

  const fileData = {
    id: Date.now().toString(),
    projectId: projectId,
    originalName: req.file.originalname,
    filename: req.file.filename,
    path: req.file.path,
    size: req.file.size,
    type: path.extname(req.file.originalname).toLowerCase(),
    uploadedAt: new Date().toISOString()
  };

  uploadedFiles.push(fileData);

  // Update project file count
  project.files = (project.files || 0) + 1;
  project.updatedAt = new Date().toISOString();

  console.log('File uploaded:', fileData);

  res.status(201).json({
    success: true,
    data: fileData,
    message: 'File uploaded successfully'
  });
});

// Get all files for a project
app.get('/api/projects/:id/files', (req, res) => {
  const projectId = req.params.id;
  const projectFiles = uploadedFiles.filter(f => f.projectId === projectId);

  res.json({
    success: true,
    data: projectFiles,
    count: projectFiles.length
  });
});

// Analyze ST code
app.post('/api/analysis', (req, res) => {
  const { code, projectId } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Code required',
      message: 'ST code is required for analysis'
    });
  }

  try {
    const analysisResult = analyzeSTCode(code);

    // Store analysis if project is specified
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        project.lastAnalysis = {
          timestamp: new Date().toISOString(),
          result: analysisResult
        };
        project.updatedAt = new Date().toISOString();
      }
    }

    console.log('Code analysis completed');

    res.json({
      success: true,
      data: analysisResult,
      message: 'Code analysis completed successfully'
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Analysis failed',
      message: error.message
    });
  }
});

// Get analysis for a project
app.get('/api/projects/:id/analysis', (req, res) => {
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
    data: project.lastAnalysis || null,
    message: project.lastAnalysis ? 'Analysis found' : 'No analysis available'
  });
});

// Parse uploaded file
app.post('/api/files/:id/parse', (req, res) => {
  const fileId = req.params.id;
  const file = uploadedFiles.find(f => f.id === fileId);

  if (!file) {
    return res.status(404).json({
      success: false,
      error: 'File not found',
      message: `File with ID ${fileId} not found`
    });
  }

  try {
    const fileContent = fs.readFileSync(file.path, 'utf8');
    const parseResult = analyzeSTCode(fileContent);

    // Store parse result
    file.parseResult = {
      timestamp: new Date().toISOString(),
      result: parseResult
    };

    console.log('File parsed:', file.originalName);

    res.json({
      success: true,
      data: {
        file: file,
        parseResult: parseResult
      },
      message: 'File parsed successfully'
    });

  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({
      success: false,
      error: 'Parse failed',
      message: error.message
    });
  }
});

// Get dependency graph data
app.get('/api/projects/:id/dependencies', (req, res) => {
  const projectId = req.params.id;
  const projectFiles = uploadedFiles.filter(f => f.projectId === projectId);

  const dependencies = {
    nodes: [],
    edges: []
  };

  // Add project as main node
  dependencies.nodes.push({
    id: projectId,
    label: projects.find(p => p.id === projectId)?.name || 'Unknown Project',
    type: 'project',
    position: { x: 400, y: 100 }
  });

  // Add file nodes
  projectFiles.forEach((file, index) => {
    const x = 200 + (index % 3) * 300;
    const y = 250 + Math.floor(index / 3) * 200;

    dependencies.nodes.push({
      id: file.id,
      label: file.originalName,
      type: 'file',
      position: { x, y }
    });

    // Add edge from project to file
    dependencies.edges.push({
      id: `${projectId}-${file.id}`,
      source: projectId,
      target: file.id,
      type: 'contains'
    });

    // Add dependency edges if file has parse results
    if (file.parseResult && file.parseResult.result.ast) {
      const { functions, functionBlocks, programs } = file.parseResult.result.ast;

      // Add function nodes
      [...functions, ...functionBlocks, ...programs].forEach((func, funcIndex) => {
        const funcId = `${file.id}-${func.name}`;
        const funcX = x + (funcIndex % 2) * 150;
        const funcY = y + 150;

        dependencies.nodes.push({
          id: funcId,
          label: func.name,
          type: func.type.toLowerCase().replace('_', ''),
          position: { x: funcX, y: funcY }
        });

        dependencies.edges.push({
          id: `${file.id}-${funcId}`,
          source: file.id,
          target: funcId,
          type: 'defines'
        });
      });
    }
  });

  res.json({
    success: true,
    data: dependencies,
    message: 'Dependency graph data generated'
  });
});

// ===== AI ANALYSIS ENDPOINTS =====

// AI Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, code, context, projectId } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message required',
      message: 'Chat message is required'
    });
  }

  try {
    let aiResponse;

    // Check if OpenAI API key is available
    if (process.env.OPENAI_API_KEY) {
      // Use actual OpenAI API (if you want to implement)
      aiResponse = await generateAIResponse(message, code, context);
    } else {
      // Demo mode - provide intelligent responses based on ST code patterns
      aiResponse = generateDemoAIResponse(message, code, context);
    }

    // Store conversation if project is specified
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        if (!project.chatHistory) {
          project.chatHistory = [];
        }
        project.chatHistory.push({
          timestamp: new Date().toISOString(),
          user: message,
          ai: aiResponse,
          context: context
        });
        project.updatedAt = new Date().toISOString();
      }
    }

    console.log('AI chat interaction completed');

    res.json({
      success: true,
      data: {
        userMessage: message,
        aiResponse: aiResponse,
        timestamp: new Date().toISOString()
      },
      message: 'Chat response generated successfully'
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      error: 'AI chat failed',
      message: error.message
    });
  }
});

// Get chat history for project
app.get('/api/projects/:id/chat', (req, res) => {
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
    data: project.chatHistory || [],
    message: project.chatHistory ? 'Chat history found' : 'No chat history available'
  });
});

// Enhanced code analysis with AI insights
app.post('/api/analysis/enhanced', async (req, res) => {
  const { code, projectId, useAI } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Code required',
      message: 'ST code is required for analysis'
    });
  }

  try {
    // Basic analysis
    const basicAnalysis = analyzeSTCode(code);

    let enhancedAnalysis = basicAnalysis;

    if (useAI && process.env.OPENAI_API_KEY) {
      // If OpenAI is available, enhance with AI insights
      const aiInsights = await generateAIInsights(code, basicAnalysis);
      enhancedAnalysis = {
        ...basicAnalysis,
        aiInsights: aiInsights
      };
    } else {
      // Demo mode with enhanced suggestions
      enhancedAnalysis = {
        ...basicAnalysis,
        aiInsights: generateDemoAIInsights(code, basicAnalysis)
      };
    }

    // Store enhanced analysis if project is specified
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        project.lastEnhancedAnalysis = {
          timestamp: new Date().toISOString(),
          result: enhancedAnalysis
        };
        project.updatedAt = new Date().toISOString();
      }
    }

    console.log('Enhanced code analysis completed');

    res.json({
      success: true,
      data: enhancedAnalysis,
      message: 'Enhanced analysis completed successfully'
    });

  } catch (error) {
    console.error('Enhanced analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Enhanced analysis failed',
      message: error.message
    });
  }
});

// ===== AI HELPER FUNCTIONS =====

async function generateAIResponse(message, code, context) {
  // This would integrate with OpenAI API in production
  // For now, return demo response
  return generateDemoAIResponse(message, code, context);
}

function generateDemoAIResponse(message, code, context) {
  const messageLower = message.toLowerCase();

  // Common ST code patterns and responses
  if (messageLower.includes('variable') || messageLower.includes('変数')) {
    return '変数の宣言にはVARキーワードを使用します。型にはBOOL、INT、REAL、STRINGなどがあります。例：VAR myVar : INT; END_VAR';
  }

  if (messageLower.includes('function') || messageLower.includes('関数')) {
    return 'FUNCTIONは値を返すプログラム単位です。FUNCTION_BLOCKは状態を保持できます。PROGRAMはメインプログラム用です。';
  }

  if (messageLower.includes('error') || messageLower.includes('エラー')) {
    return '一般的なエラーには：1) 変数宣言の忘れ 2) セミコロンの欠落 3) 型の不一致 4) END_XXXの忘れ などがあります。';
  }

  if (messageLower.includes('safety') || messageLower.includes('安全')) {
    return 'PLCプログラミングの安全原則：1) 常に緊急停止を実装 2) インターロックを設定 3) 異常状態を検出 4) フェールセーフ設計';
  }

  if (messageLower.includes('optimization') || messageLower.includes('最適化')) {
    return 'コード最適化のヒント：1) 不要な変数を削除 2) ループを最適化 3) 適切なデータ型を選択 4) コメントを追加';
  }

  return 'STコードについて質問ありがとうございます。変数宣言、関数定義、制御構造などについて詳しくお答えできます。具体的なコードを教えていただければ、より詳細な分析も可能です。';
}

async function generateAIInsights(code, basicAnalysis) {
  // In production, this would call OpenAI API
  return generateDemoAIInsights(code, basicAnalysis);
}

function generateDemoAIInsights(code, basicAnalysis) {
  const insights = {
    codeQuality: 'Good',
    recommendations: [],
    securityIssues: [],
    performanceTips: []
  };

  // Analyze based on basic analysis results
  if (basicAnalysis.analysis && basicAnalysis.analysis.complexity) {
    const complexity = basicAnalysis.analysis.complexity;

    if (complexity.score < 60) {
      insights.codeQuality = 'Needs Improvement';
      insights.recommendations.push('コードの複雑度が高いです。関数に分割することを検討してください。');
    }

    if (complexity.controlStructures > 10) {
      insights.performanceTips.push('制御構造が多すぎます。ロジックを簡素化できないか検討してください。');
    }
  }

  // Check for common ST patterns
  if (code.includes('IF') && code.includes('THEN')) {
    insights.recommendations.push('条件分岐が適切に使用されています。');
  }

  if (!code.includes('CASE')) {
    insights.performanceTips.push('複数条件がある場合、CASE文の方が効率的な場合があります。');
  }

  // Security checks
  if (code.includes('GOTO')) {
    insights.securityIssues.push('GOTO文の使用は推奨されません。構造化プログラミングを検討してください。');
  }

  return insights;
}

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


// ===== EXPORT API ENDPOINTS =====

const archiver = require('archiver');

// Create exports directory if it doesn't exist
const exportsDir = path.join(__dirname, 'exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

// Export project as ZIP
app.get('/api/export/projects/:id', async (req, res) => {
  const projectId = req.params.id;
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
      message: `Project with ID ${projectId} not found`
    });
  }

  try {
    const projectFiles = uploadedFiles.filter(f => f.projectId === projectId);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFileName = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.zip`;
    const zipPath = path.join(exportsDir, zipFileName);

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    const output = fs.createWriteStream(zipPath);

    archive.pipe(output);

    // Add project metadata file
    const metadata = {
      project: project,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0.0',
      fileCount: projectFiles.length,
      analysis: project.lastAnalysis || null
    };

    archive.append(JSON.stringify(metadata, null, 2), { name: 'project.json' });

    // Add uploaded files
    projectFiles.forEach(file => {
      if (fs.existsSync(file.path)) {
        archive.file(file.path, { name: `src/${file.originalName}` });
      }
    });

    // Add analysis report if available
    if (project.lastAnalysis) {
      const analysisReport = generateAnalysisReport(project, project.lastAnalysis);
      archive.append(analysisReport, { name: 'analysis_report.txt' });
    }

    // Add README file
    const readme = generateProjectReadme(project, projectFiles);
    archive.append(readme, { name: 'README.txt' });

    await archive.finalize();

    // Wait for archive to complete
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
    });

    // Send the ZIP file
    res.download(zipPath, zipFileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Download failed',
            message: 'Failed to download export file'
          });
        }
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Export failed',
      message: 'Failed to create export file'
    });
  }
});

// Get export formats and capabilities
app.get('/api/export/formats', (req, res) => {
  res.json({
    success: true,
    data: {
      supportedFormats: [
        {
          id: 'zip',
          name: 'ZIP Archive',
          description: 'Complete project with all files and analysis',
          extension: '.zip',
          features: ['source_files', 'analysis', 'metadata', 'readme']
        },
        {
          id: 'pdf_report',
          name: 'PDF Report',
          description: 'Analysis report in PDF format',
          extension: '.pdf',
          features: ['analysis', 'summary', 'charts']
        },
        {
          id: 'csv_data',
          name: 'CSV Data Export',
          description: 'Runtime data and variables in CSV format',
          extension: '.csv',
          features: ['runtime_data', 'variables', 'traces']
        }
      ]
    }
  });
});

// Generate analysis report
app.post('/api/export/analysis-report/:id', (req, res) => {
  const projectId = req.params.id;
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
      message: `Project with ID ${projectId} not found`
    });
  }

  try {
    const reportType = req.body.format || 'txt';
    let reportContent;
    let fileName;
    let mimeType;

    switch (reportType) {
      case 'txt':
        reportContent = generateAnalysisReport(project, project.lastAnalysis);
        fileName = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_analysis_report.txt`;
        mimeType = 'text/plain';
        break;
      case 'json':
        reportContent = JSON.stringify({
          project: project,
          analysis: project.lastAnalysis,
          exportedAt: new Date().toISOString()
        }, null, 2);
        fileName = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_analysis_report.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        reportContent = generateAnalysisCSV(project, project.lastAnalysis);
        fileName = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_analysis_report.csv`;
        mimeType = 'text/csv';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid format',
          message: 'Supported formats: txt, json, csv'
        });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeType);
    res.send(reportContent);

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Report generation failed',
      message: 'Failed to generate analysis report'
    });
  }
});

// Helper functions for export functionality
function generateAnalysisReport(project, analysis) {
  const timestamp = new Date().toLocaleString('ja-JP');

  let report = `AI-ST Debugger Analysis Report\n`;
  report += `===============================\n\n`;
  report += `Project Name: ${project.name}\n`;
  report += `Version: ${project.version}\n`;
  report += `Description: ${project.description}\n`;
  report += `Generated: ${timestamp}\n`;
  report += `Files: ${project.files}\n\n`;

  if (analysis && analysis.result) {
    const result = analysis.result;
    report += `Analysis Results:\n`;
    report += `----------------\n`;
    report += `Issues Found: ${result.issues ? result.issues.length : 0}\n`;
    report += `Suggestions: ${result.suggestions ? result.suggestions.length : 0}\n\n`;

    if (result.issues && result.issues.length > 0) {
      report += `Issues:\n`;
      report += `-------\n`;
      result.issues.forEach((issue, index) => {
        report += `${index + 1}. ${issue.type}: ${issue.message}\n`;
        report += `   Line: ${issue.line || 'N/A'}\n`;
        report += `   Severity: ${issue.severity || 'Medium'}\n\n`;
      });
    }

    if (result.suggestions && result.suggestions.length > 0) {
      report += `Suggestions:\n`;
      report += `-----------\n`;
      result.suggestions.forEach((suggestion, index) => {
        report += `${index + 1}. ${suggestion.type}\n`;
        report += `   ${suggestion.message}\n\n`;
      });
    }
  } else {
    report += `No analysis data available.\n`;
  }

  report += `\nReport generated by AI-ST Debugger\n`;
  return report;
}

function generateAnalysisCSV(project, analysis) {
  let csv = 'Category,Type,Message,Line,Severity,Suggestion\n';

  if (analysis && analysis.result && analysis.result.issues) {
    analysis.result.issues.forEach(issue => {
      csv += `Issue,${issue.type},"${issue.message}",${issue.line || 'N/A'},${issue.severity || 'Medium'},""\n`;
    });
  }

  if (analysis && analysis.result && analysis.result.suggestions) {
    analysis.result.suggestions.forEach(suggestion => {
      csv += `Suggestion,${suggestion.type},"${suggestion.message}","","","${suggestion.code || ''}"\n`;
    });
  }

  if (csv === 'Category,Type,Message,Line,Severity,Suggestion\n') {
    csv += 'No issues or suggestions found\n';
  }

  return csv;
}

function generateProjectReadme(project, files) {
  let readme = `Project Export: ${project.name}\n`;
  readme += `=============================\n\n`;
  readme += `This archive contains the complete export of the ST project "${project.name}".\n\n`;
  readme += `Project Information:\n`;
  readme += `- Name: ${project.name}\n`;
  readme += `- Version: ${project.version}\n`;
  readme += `- Description: ${project.description}\n`;
  readme += `- Files: ${files.length}\n`;
  readme += `- Export Date: ${new Date().toLocaleString('ja-JP')}\n\n`;

  if (files.length > 0) {
    readme += `Source Files:\n`;
    readme += `------------\n`;
    files.forEach(file => {
      readme += `- ${file.originalName} (${file.size} bytes)\n`;
    });
    readme += `\n`;
  }

  readme += `Archive Contents:\n`;
  readme += `- project.json: Project metadata and settings\n`;
  readme += `- src/: Source code files\n`;
  if (project.lastAnalysis) {
    readme += `- analysis_report.txt: Analysis results and recommendations\n`;
  }
  readme += `- README.txt: This file\n\n`;

  readme += `About AI-ST Debugger:\n`;
  readme += `AI-ST Debugger is an advanced debugging tool for PLC Structured Text programming.\n`;
  readme += `For more information: https://github.com/iceplantengineering/st-debugger\n`;

  return readme;
}


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