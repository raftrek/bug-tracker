import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProjects, updateProject, deleteProject } from '../services/projectService';
import { Project, ProjectStatus } from '../types';
import { AddIcon, KanbanIcon, SettingsIcon, ArchiveIcon, TrashIcon } from '../components/icons';
import { ThemeToggle } from '../components/ThemeToggle';

const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const color = status === ProjectStatus.ACTIVE
    ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
    : status === ProjectStatus.PAUSED
      ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
      : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
  return (
    <span className={`px-2 py-1 text-xs font-semibold border rounded ${color}`}>{status}</span>
  );
};

export const ProjectsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getProjects()
      .then(data => {
        setProjects(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError('Failed to load projects');
        setIsLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const matchesQuery = !query || p.name.toLowerCase().includes(query.toLowerCase()) || (p.description || '').toLowerCase().includes(query.toLowerCase());
      const matchesStatus = !statusFilter || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter, projects]);

  const openProject = (project: Project) => {
    navigate(`/board/${project.id}`);
  };

  const handleArchive = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to ${project.status === ProjectStatus.ARCHIVED ? 'restore' : 'archive'} this project?`)) return;
    
    try {
      const newStatus = project.status === ProjectStatus.ARCHIVED ? ProjectStatus.ACTIVE : ProjectStatus.ARCHIVED;
      const updated = await updateProject(project.id, { status: newStatus });
      setProjects(projects.map(p => p.id === project.id ? updated : p));
    } catch (err) {
      console.error('Failed to archive project:', err);
      alert('Failed to archive project. You might not have permission.');
    }
  };

  const handleDelete = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete project "${project.name}"? This action cannot be undone.`)) return;
    
    try {
      await deleteProject(project.id);
      setProjects(projects.filter(p => p.id !== project.id));
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project. You might not have permission.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      <header className="bg-white dark:bg-neutral-800 shadow-sm p-4 sticky top-0 z-20 border-b border-neutral-200 dark:border-neutral-700">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Projects</h1>
          <div className="flex items-center gap-4">
            <Link
              to="/settings"
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors text-neutral-600 dark:text-neutral-400"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </Link>
            <ThemeToggle />
            <Link
              to="/projects/new"
              className="flex items-center gap-2 bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              <AddIcon />
              New Project
            </Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects..."
              className="flex-1 min-w-[240px] text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900 dark:text-neutral-100 p-2.5 placeholder-neutral-400"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
              className="text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900 dark:text-neutral-100 p-2.5"
            >
              <option value="">All statuses</option>
              {Object.values(ProjectStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded mb-4">{error}</div>
        )}

        {isLoading ? (
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-8 text-center text-neutral-500 dark:text-neutral-400">Loading projects...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <div key={p.id} className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">{p.name}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">{p.description || 'No description provided.'}</p>
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-neutral-100 dark:border-neutral-700 gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openProject(p)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors text-sm font-medium"
                      title="Open Project Board"
                    >
                      <KanbanIcon className="w-4 h-4" />
                      Open Board
                    </button>
                    <button
                      onClick={(e) => handleArchive(e, p)}
                      className={`flex items-center justify-center p-1.5 rounded-lg transition-colors ${
                        p.status === ProjectStatus.ARCHIVED 
                          ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400' 
                          : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                      }`}
                      title={p.status === ProjectStatus.ARCHIVED ? "Restore Project" : "Archive Project"}
                    >
                      <ArchiveIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, p)}
                      className="flex items-center justify-center p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      title="Delete Project"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">Created {new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-12 text-center text-neutral-500 dark:text-neutral-400 col-span-full">
                No projects found.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectsDashboard;