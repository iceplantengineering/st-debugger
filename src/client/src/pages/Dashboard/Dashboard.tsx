import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Clock, AlertTriangle, CheckCircle, FolderOpen, Brain, Upload, Trash2 } from 'lucide-react';
import ExportButton from '../../components/ExportButton/ExportButton';

interface Project {
  id: string;
  name: string;
  description: string;
  version: string;
  files?: number;
  updatedAt: string;
  score: number;
}

const Dashboard: React.FC = () => {
  // State for projects
  const [projects, setProjects] = useState<Project[]>([]);

  // Load projects from API on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/projects');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setProjects(result.data);
          }
        }
      } catch (error) {
        console.error('Error loading projects:', error);
        // For demo purposes, set default projects if API fails
        setProjects([
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
        ]);
      }
    };

    loadProjects();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleCreateProject = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `New Project ${new Date().toLocaleString()}`,
          description: 'Created from frontend',
          version: 'v1.0.0'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProjects([...projects, result.data]);
          alert('Project created successfully!');
        } else {
          alert('Failed to create project: ' + result.error);
        }
      } else {
        alert('Failed to create project: Server error');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project: Network error');
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    // 確認ダイアログ
    const confirmed = window.confirm(
      `Are you sure you want to delete "${projectName}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProjects(projects.filter(p => p.id !== projectId));
          alert(`Project "${projectName}" deleted successfully!`);
        } else {
          alert('Failed to delete project: ' + result.error);
        }
      } else {
        alert('Failed to delete project: Server error');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project: Network error');
    }
  };

  // Quick Actions handlers
  const handleImportProject = () => {
    // Create a simple file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.st,.prg,.fnc,.fb,.txt';
    input.multiple = true;

    input.onchange = (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        alert(`Import functionality ready for ${files.length} file(s):\n${Array.from(files).map(f => f.name).join('\n')}\n\nFull import will be implemented with backend endpoints.`);
      }
    };

    input.click();
  };

  const handleRunAIAnalysis = () => {
    alert('🤖 AI Analysis Features:\n\n• Code quality analysis\n• Bug detection\n• Performance optimization\n• Security vulnerability scanning\n\nFull AI analysis will be implemented with OpenAI integration.');
  };

  const handleUploadRuntimeData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        alert(`Runtime data upload ready for ${files.length} CSV file(s):\n${Array.from(files).map(f => f.name).join('\n')}\n\nSupports:\n• Variable snapshots\n• Trace logs\n• Error logs`);
      }
    };

    input.click();
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ height: '100vh', backgroundColor: '#f9fafb', display: 'flex' }}>
      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0
              }}>
                Dashboard
              </h1>
              <p style={{
                color: '#4b5563',
                marginTop: '0.25rem',
                margin: 0
              }}>
                Welcome to AI-ST Debugger Pro
              </p>
            </div>
            <button
              onClick={handleCreateProject}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <Plus size={16} />
              <span>New Project</span>
            </button>
          </div>

          {/* Search and Filter */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              position: 'relative',
              flex: 1,
              maxWidth: '28rem'
            }}>
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }}
              />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  paddingRight: '1rem',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}>
              <Filter size={16} />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '1.5rem'
          }}>
            {/* Main Content - Projects List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Stats Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem'
              }}>
                <div style={{
                  backgroundColor: 'white',
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      Total Projects
                    </h3>
                    <FolderOpen size={20} style={{ color: '#9ca3af' }} />
                  </div>
                  <p style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: 0
                  }}>
                    {projects.length}
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#059669',
                    marginTop: '0.25rem',
                    margin: 0
                  }}>
                    +2 this week
                  </p>
                </div>

                <div style={{
                  backgroundColor: 'white',
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      Active Issues
                    </h3>
                    <AlertTriangle size={20} style={{ color: '#9ca3af' }} />
                  </div>
                  <p style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: 0
                  }}>
                    12
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#d97706',
                    marginTop: '0.25rem',
                    margin: 0
                  }}>
                    3 critical
                  </p>
                </div>

                <div style={{
                  backgroundColor: 'white',
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      Analysis Score
                    </h3>
                    <CheckCircle size={20} style={{ color: '#9ca3af' }} />
                  </div>
                  <p style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: 0
                  }}>
                    87%
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#059669',
                    marginTop: '0.25rem',
                    margin: 0
                  }}>
                    +5% improvement
                  </p>
                </div>
              </div>

              {/* Projects List */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  padding: '1rem',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <h2 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: 0
                  }}>
                    Recent Projects
                  </h2>
                </div>

                {filteredProjects.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <FolderOpen
                      size={48}
                      style={{
                        color: '#9ca3af',
                        margin: '0 auto 1rem auto'
                      }}
                    />
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '500',
                      color: '#1f2937',
                      marginBottom: '0.5rem',
                      margin: 0
                    }}>
                      No projects found
                    </h3>
                    <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                      Try adjusting your search terms
                    </p>
                    <button style={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}>
                      Create Project
                    </button>
                  </div>
                ) : (
                  <div>
                    {filteredProjects.map((project) => (
                      <div
                        key={project.id}
                        style={{
                          padding: '1rem',
                          borderBottom: '1px solid #f3f4f6',
                          transition: 'backgroundColor 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem'
                            }}>
                              <span style={{
                                fontSize: '1.125rem',
                                fontWeight: '500',
                                color: '#1f2937',
                                cursor: 'pointer',
                                textDecoration: 'none'
                              }}>
                                {project.name}
                              </span>
                              <span style={{
                                padding: '0.125rem 0.5rem',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                borderRadius: '9999px',
                                backgroundColor: '#dbeafe',
                                color: '#1e40af'
                              }}>
                                {project.version}
                              </span>
                            </div>
                            <p style={{
                              fontSize: '0.875rem',
                              color: '#4b5563',
                              marginTop: '0.25rem',
                              margin: 0
                            }}>
                              {project.description}
                            </p>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1rem',
                              marginTop: '0.5rem',
                              fontSize: '0.75rem',
                              color: '#6b7280'
                            }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Clock size={12} />
                                {formatDateTime(project.updatedAt)}
                              </span>
                              <span>•</span>
                              <span>{project.files} files</span>
                              <span>•</span>
                              <span>{project.score}% score</span>
                            </div>
                          </div>
<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>                            <ExportButton projectId={project.id} projectName={project.name} />                            <button                              onClick={() => handleDeleteProject(project.id, project.name)}                              style={{                                padding: '0.25rem 0.5rem',                                color: '#dc2626',                                backgroundColor: 'transparent',                                border: '1px solid #dc2626',                                borderRadius: '0.25rem',                                cursor: 'pointer',                                display: 'flex',                                alignItems: 'center',                                gap: '0.25rem',                                fontSize: '0.75rem'                              }}                              title="Delete project"                              onMouseEnter={(e) => {                                e.currentTarget.style.backgroundColor = '#dc2626';                                e.currentTarget.style.color = 'white';                              }}                              onMouseLeave={(e) => {                                e.currentTarget.style.backgroundColor = 'transparent';                                e.currentTarget.style.color = '#dc2626';                              }}                            >                              <Trash2 size={14} />                              <span>Delete</span>                            </button>                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Quick Actions */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                padding: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '1rem',
                  margin: 0
                }}>
                  Quick Actions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    onClick={handleImportProject}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#eff6ff',
                      color: '#1e40af',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      justifyContent: 'flex-start',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dbeafe';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                    }}
                  >
                    <Plus size={20} />
                    <span style={{ fontWeight: '500' }}>Import Project</span>
                  </button>
                  <button
                    onClick={handleRunAIAnalysis}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#f0fdf4',
                      color: '#14532d',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      justifyContent: 'flex-start',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dcfce7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0fdf4';
                    }}
                  >
                    <Brain size={20} />
                    <span style={{ fontWeight: '500' }}>Run AI Analysis</span>
                  </button>
                  <button
                    onClick={handleUploadRuntimeData}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#eff6ff',
                      color: '#1e40af',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      justifyContent: 'flex-start',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dbeafe';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                    }}
                  >
                    <Upload size={20} />
                    <span style={{ fontWeight: '500' }}>Upload Runtime Data</span>
                  </button>
                </div>
              </div>

              {/* System Status */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                padding: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '1rem',
                  margin: 0
                }}>
                  System Status
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Frontend</span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#22c55e',
                        borderRadius: '50%'
                      }}></div>
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>Active</span>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Backend</span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#ef4444',
                        borderRadius: '50%'
                      }}></div>
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>Offline</span>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>AI Service</span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#ef4444',
                        borderRadius: '50%'
                      }}></div>
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>Unavailable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;