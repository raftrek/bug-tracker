import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProjectById, updateProject } from '../services/projectService';
import { ProjectStatus } from '../types';
import { AddIcon } from '../components/icons';

type UploadItem = { name: string; type: string; size: number; url: string };

export const EditProject: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [attachments, setAttachments] = useState<UploadItem[]>([]);
  const [config, setConfig] = useState<Record<string, unknown>>({ enableAI: true, defaultView: 'kanban' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      try {
        const proj = await getProjectById(projectId);
        if (proj) {
          setName(proj.name);
          setDescription(proj.description || '');
          setStatus(proj.status as ProjectStatus);
          setRequiresAuth(proj.requiresAuth || false);
          if (proj.config) {
            setConfig(proj.config as Record<string, unknown>);
          }
        } else {
          setError('Project not found');
        }
      } catch (err) {
        setError('Failed to load project details.');
      } finally {
        setIsLoading(false);
      }
    };
    loadProject();
  }, [projectId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files as FileList).map((file: File) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file) // temporary local URL for preview
      }));
      setAttachments(prev => [...prev, ...filesArray]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    if (!projectId) return;
    
    setIsSubmitting(true);
    try {
      await updateProject(projectId, { name, description, status, requiresAuth, config });
      navigate(`/board/${projectId}`);
    } catch (err) {
      setError('Failed to update project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-800">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">Edit Project</h1>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg bg-neutral-200 text-neutral-800 hover:bg-neutral-300 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>
            )}
            <div>
              <label htmlFor="name" className="text-sm font-bold text-gray-600 mb-1 block">Project Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-800 p-2"
                placeholder="e.g., Website Revamp"
                required
              />
            </div>
            <div>
              <label htmlFor="desc" className="text-sm font-bold text-gray-600 mb-1 block">Description</label>
              <textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="block w-full text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-800 p-2"
                placeholder="Describe the project scope"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-600 mb-1 block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as unknown as ProjectStatus)}
                  className="block w-full text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-800 p-2"
                >
                  {Object.values(ProjectStatus).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-600 mb-1 block">Configuration</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!config.enableAI}
                      onChange={(e) => setConfig(prev => ({ ...prev, enableAI: e.target.checked }))}
                    />
                    <span className="text-sm text-neutral-700">Enable AI helpers</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={requiresAuth}
                      onChange={(e) => setRequiresAuth(e.target.checked)}
                    />
                    <span className="text-sm text-neutral-700">Require authorization to open</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-600 mb-1 block">Default View</label>
                <select
                  value={String(config.defaultView)}
                  onChange={(e) => setConfig(prev => ({ ...prev, defaultView: e.target.value }))}
                  className="block w-full text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-800 p-2"
                >
                  <option value="kanban">Kanban</option>
                  <option value="list">List</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-600 mb-1 block">Attachments</label>
              <input type="file" multiple onChange={handleFileChange} className="text-sm" />
              {attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {attachments.map(att => (
                    <span key={att.name} className="px-2 py-1 bg-gray-100 border rounded text-xs text-neutral-700">
                      {att.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center gap-2 bg-primary-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-600'}`}
              >
                <AddIcon />
                Update Project
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-lg bg-neutral-200 text-neutral-800 hover:bg-neutral-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditProject;