import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProjects, searchProjects, canAccessProject } from '../services/projectService';
import { Project, ProjectStatus } from '../types';
import { AddIcon, KanbanIcon } from '../components/icons';

const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const color = status === ProjectStatus.ACTIVE
    ? 'bg-green-100 text-green-700 border-green-200'
    : status === ProjectStatus.PAUSED
    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
    : 'bg-gray-100 text-gray-600 border-gray-200';
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
    // Simulate loading state for a smoother UX
    const timer = setTimeout(() => {
      try {
        setProjects(getProjects());
      } catch {
        setError('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const status = statusFilter || undefined;
    return searchProjects(query, status);
  }, [query, statusFilter, projects]);

  const openProject = (project: Project) => {
    if (!canAccessProject(project)) {
      setError('You are not authorized to access this project.');
      return;
    }
    navigate(`/board/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-800">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">Projects</h1>
          <Link
            to="/projects/new"
            className="flex items-center gap-2 bg-primary-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <AddIcon />
            New Project
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects..."
              className="flex-1 min-w-[240px] text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-800 p-2"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
              className="text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-800 p-2"
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
          <div className="bg-white rounded-lg shadow p-8 text-center text-neutral-600">Loading projects...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <div key={p.id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-neutral-800">{p.name}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-sm text-neutral-600">{p.description || 'No description provided.'}</p>
                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={() => openProject(p)}
                    className="flex items-center gap-2 px-3 py-2 rounded bg-neutral-200 text-neutral-800 hover:bg-neutral-300"
                    title="Open Project Board"
                  >
                    <KanbanIcon className="w-5 h-5" />
                    Open Board
                  </button>
                  <span className="text-xs text-neutral-500">Created {new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center text-neutral-600 col-span-full">
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