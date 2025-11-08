import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../services/projectService';
import { ProjectStatus } from '../types';
import { AddIcon } from '../components/icons';

type UploadItem = { name: string; type: string; size: number; url: string };

export const NewProject: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [attachments, setAttachments] = useState<UploadItem[]>([]);
  const [config, setConfig] = useState<Record<string, unknown>>({ enableAI: true, defaultView: 'kanban' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFiles = (files: FileList) => {
    const newItems: UploadItem[] = Array.from(files).map((f) => ({
      name: f.name,
      type: f.type,
      size: f.size,
      url: URL.createObjectURL(f),
    }));
    setAttachments((prev) => [...prev, ...newItems]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const proj = createProject({ name, description, status, requiresAuth, attachments, config });
      setCreatedProjectId(proj.id);
    } catch (err) {
      setError('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openBoard = () => {
    if (createdProjectId) navigate(`/board/${createdProjectId}`);
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-800">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">New Project</h1>
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
                Create Project
              </button>
              {createdProjectId && (
                <button
                  type="button"
                  onClick={openBoard}
                  className="px-4 py-2 rounded-lg bg-neutral-200 text-neutral-800 hover:bg-neutral-300"
                  title="Redirect to Project Board"
                >
                  Open in Project Board
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default NewProject;