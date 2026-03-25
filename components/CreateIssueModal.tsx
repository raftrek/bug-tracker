import React, { useState, useMemo, useEffect } from 'react';
import { TagInput } from './TagInput';
import { CloseIcon, UploadIcon, TrashIcon } from './icons';
import { DatePicker } from './DatePicker';
import type { Issue, IssueTemplate, Priority, Tag, Attachment, IssueType, User, TeamMember } from '../types';
import { Status, Priority as PriorityEnum, IssueType as IssueTypeEnum } from '../types';
import { getAllTemplates, saveCustomTemplate, deleteCustomTemplate } from '../services/templateService';

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateIssue: (newIssue: Omit<Issue, 'id' | 'status' | 'updatedAt'>) => void;
  allIssues: Issue[];
  allTags: Tag[];
  issueTemplates: IssueTemplate[];
  teamMembers?: TeamMember[];
  currentUser?: User | null;
}

const DEFAULT_ISSUE_STATE: Omit<Issue, 'id' | 'status' | 'updatedAt'> = {
  title: '',
  type: IssueTypeEnum.TASK,
  description: '',
  priority: PriorityEnum.MEDIUM,
  assignee: null,
  assigneeId: null,
  startDate: '',
  endDate: '',
  comments: [],
  dependencies: [],
  tags: [],
  attachments: [],
};

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  isOpen,
  onClose,
  onCreateIssue,
  allIssues,
  allTags,
  issueTemplates,
  teamMembers = [],
  currentUser = null,
}) => {
  const [issueData, setIssueData] = useState(DEFAULT_ISSUE_STATE);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [templates, setTemplates] = useState<IssueTemplate[]>(issueTemplates || []);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [templateMsg, setTemplateMsg] = useState<string>('');

  const baseTemplateNames = useMemo(() => new Set((issueTemplates || []).map(t => t.name)), [issueTemplates]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setIssueData(DEFAULT_ISSUE_STATE);
        setSelectedTemplate('');
        setNewTemplateName('');
        setTemplateMsg('');
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    setTemplates(getAllTemplates(issueTemplates || []));
  }, [issueTemplates, isOpen]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateName = e.target.value;
    setSelectedTemplate(templateName);
    const template = templates.find(t => t.name === templateName);
    if (template) {
      setIssueData(prev => ({
        ...prev,
        title: template.title || '',
        type: template.type || IssueTypeEnum.TASK,
        description: template.description || '',
        priority: template.priority || PriorityEnum.MEDIUM,
        tags: template.tags || [],
      }));
    } else {
      setIssueData(DEFAULT_ISSUE_STATE);
    }
  };

  const handleSaveTemplate = () => {
    const name = newTemplateName.trim();
    if (!name) {
      setTemplateMsg('Template name is required.');
      return;
    }
    // Prevent duplicate names
    if (templates.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      setTemplateMsg('A template with this name already exists.');
      return;
    }
    const template: IssueTemplate = {
      name,
      title: issueData.title || '',
      type: issueData.type || IssueTypeEnum.TASK,
      description: issueData.description || '',
      priority: issueData.priority || PriorityEnum.MEDIUM,
      tags: issueData.tags || [],
    };
    try {
      saveCustomTemplate(template);
      const merged = getAllTemplates(issueTemplates || []);
      setTemplates(merged);
      setTemplateMsg('Template saved.');
      setSelectedTemplate(name);
      // Apply the newly saved template immediately
      setIssueData(prev => ({
        ...prev,
        title: template.title || '',
        type: template.type || IssueTypeEnum.TASK,
        description: template.description || '',
        priority: template.priority || PriorityEnum.MEDIUM,
        tags: template.tags || [],
      }));
      setTimeout(() => setTemplateMsg(''), 2000);
    } catch (err) {
      setTemplateMsg('Failed to save template.');
    }
  };

  const handleChange = (field: keyof typeof issueData, value: any) => {
    setIssueData(prev => ({ ...prev, [field]: value }));
  };

  const handleAssigneeChange = (value: string) => {
    // Find the selected user/member
    const allUsers = [currentUser, ...teamMembers.map(m => m.user)].filter(Boolean) as User[];
    const selectedUser = allUsers.find(u => u.id === value);

    if (selectedUser) {
      setIssueData(prev => ({
        ...prev,
        assigneeId: selectedUser.id,
        assignee: {
          id: selectedUser.id,
          name: selectedUser.name,
          avatarUrl: selectedUser.avatarUrl || `https://i.pravatar.cc/150?u=${selectedUser.name.replace(/\s/g, '')}`
        }
      }));
    } else {
      // If no user is selected (empty value), clear assignee
      setIssueData(prev => ({
        ...prev,
        assigneeId: null,
        assignee: null
      }));
    }
  };

  const handleTagsChange = (tags: Tag[]) => {
    setIssueData(prev => ({ ...prev, tags }));
  };

  const handleDeleteTemplate = () => {
    if (!selectedTemplate) return;
    if (baseTemplateNames.has(selectedTemplate)) {
      setTemplateMsg('Cannot delete base template.');
      setTimeout(() => setTemplateMsg(''), 2000);
      return;
    }
    const ok = window.confirm(`Delete template "${selectedTemplate}"?`);
    if (!ok) return;
    try {
      deleteCustomTemplate(selectedTemplate);
      const merged = getAllTemplates(issueTemplates || []);
      setTemplates(merged);
      setSelectedTemplate('');
      setTemplateMsg('Template deleted.');
      setIssueData(DEFAULT_ISSUE_STATE);
      setTimeout(() => setTemplateMsg(''), 2000);
    } catch (err) {
      setTemplateMsg('Failed to delete template.');
      setTimeout(() => setTemplateMsg(''), 2000);
    }
  };

  const handleDependencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
    setIssueData(prev => ({ ...prev, dependencies: selectedOptions }));
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async (files: FileList) => {
    const selectedFiles = Array.from(files);
    const encodedFiles = await Promise.all(
      selectedFiles.map(async (file) => ({
        file,
        dataUrl: await readFileAsDataUrl(file),
      }))
    );
    const newAttachments: Attachment[] = encodedFiles.map(({ file, dataUrl }) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      url: dataUrl,
    }));
    setIssueData((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...newAttachments],
    }));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeAttachment = (fileName: string) => {
    setIssueData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter(att => att.name !== fileName)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueData.title) return;
    const assignee = issueData.assignee
      ? {
        id: issueData.assignee.id,
        name: issueData.assignee.name,
        avatarUrl: issueData.assignee.avatarUrl || `https://i.pravatar.cc/150?u=${issueData.assignee.name.replace(/\s/g, '')}`,
      }
      : null;
    const finalData = {
      ...issueData,
      assignee,
    };
    onCreateIssue(finalData);
  };

  const availableDependencies = useMemo(() => {
    return allIssues.filter(i => i.status !== Status.DONE);
  }, [allIssues]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-neutral-200 dark:border-neutral-700" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Create New Issue</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <form onSubmit={handleSubmit} id="create-issue-form" className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-sm font-bold text-gray-600 mb-1 block">Template</label>
            <div className="flex items-center gap-2">
              <select
                value={selectedTemplate}
                onChange={handleTemplateChange}
                className="flex-1 block w-full text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100 p-2"
              >
                <option value="">Select a template...</option>
                {templates.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
              {selectedTemplate && !baseTemplateNames.has(selectedTemplate) && (
                <button
                  type="button"
                  onClick={handleDeleteTemplate}
                  className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50"
                  title="Delete selected template"
                  aria-label="Delete selected template"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="New template name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="flex-1 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100 p-2"
              />
              <button
                type="button"
                onClick={handleSaveTemplate}
                className="px-3 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md"
                title="Save current form as a template"
              >
                Save as template
              </button>
            </div>
            {templateMsg && (
              <p className="mt-1 text-xs text-gray-600">{templateMsg}</p>
            )}
          </div>
          <div>
            <label htmlFor="title" className="text-sm font-bold text-gray-600 mb-1 block">Title</label>
            <input
              id="title"
              type="text"
              value={issueData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              className="block w-full text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100 p-2"
            />
          </div>
          <div>
            <label htmlFor="type" className="text-sm font-bold text-gray-600 mb-1 block">Type</label>
            <select
              id="type"
              value={issueData.type}
              onChange={(e) => handleChange('type', e.target.value as IssueType)}
              className="block w-full text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100 p-2"
            >
              {Object.values(IssueTypeEnum).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="description" className="text-sm font-bold text-gray-600 mb-1 block">Description</label>
            <textarea
              id="description"
              value={issueData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={5}
              className="block w-full text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100 p-2"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="text-sm font-bold text-gray-600 mb-1 block">Priority</label>
              <select
                id="priority"
                value={issueData.priority}
                onChange={(e) => handleChange('priority', e.target.value as Priority)}
                className="block w-full text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100 p-2"
              >
                {Object.values(PriorityEnum).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="assignee" className="text-sm font-bold text-gray-600 mb-1 block">Assignee</label>
              <select
                id="assignee"
                value={(() => {
                  // Find the user ID based on the current assignee ID
                  return issueData.assigneeId || '';
                })()}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="block w-full text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100 p-2"
              >
                <option value="">Unassigned</option>
                {currentUser && (
                  <option key={currentUser.id} value={currentUser.id}>
                    {currentUser.name} (You)
                  </option>
                )}
                {teamMembers.map(member => (
                  <option key={member.user.id} value={member.user.id}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="text-sm font-bold text-gray-600 mb-1 block">Start Date</label>
              <DatePicker
                id="startDate"
                value={issueData.startDate}
                onChange={(date) => handleChange('startDate', date)}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="text-sm font-bold text-gray-600 mb-1 block">End Date</label>
              <DatePicker
                id="endDate"
                value={issueData.endDate}
                onChange={(date) => handleChange('endDate', date)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 mb-1 block">Tags</label>
            <TagInput
              allTags={allTags}
              selectedTags={issueData.tags || []}
              onChange={handleTagsChange}
            />
          </div>
          <div>
            <label htmlFor="dependencies" className="text-sm font-bold text-gray-600 mb-1 block">Dependencies</label>
            <select
              id="dependencies"
              multiple
              value={issueData.dependencies || []}
              onChange={handleDependencyChange}
              className="block w-full h-24 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100 p-2"
            >
              {availableDependencies.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 mb-1 block">Attachments</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${isDraggingOver ? 'border-primary-500 bg-blue-50 dark:bg-blue-900/20' : 'border-neutral-300 dark:border-neutral-600'
                }`}
            >
              <div className="space-y-1 text-center">
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-neutral-600 dark:text-neutral-400">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                    <span>Upload files</span>
                    <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={handleFileChange} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
            {issueData.attachments && issueData.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {issueData.attachments.map(file => (
                  <div key={file.name} className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded-md border border-neutral-100 dark:border-neutral-700">
                    <div className="flex items-center gap-3 min-w-0">
                      {file.type.startsWith('image/') && (
                        <img src={file.url} alt={file.name} className="w-10 h-10 rounded object-cover border border-neutral-200 dark:border-neutral-700" />
                      )}
                      <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{file.name}</span>
                    </div>
                    <button type="button" onClick={() => removeAttachment(file.name)} className="text-red-500 hover:text-red-700">
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
        <footer className="flex justify-end space-x-3 p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 mt-auto rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-md transition-colors">Cancel</button>
          <button type="submit" form="create-issue-form" className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md disabled:opacity-50" disabled={!issueData.title}>Create Issue</button>
        </footer>
      </div>
    </div >
  );
};
