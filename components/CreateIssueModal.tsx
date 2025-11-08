import React, { useState, useMemo, useEffect } from 'react';
import { TagInput } from './TagInput';
import { CloseIcon, UploadIcon } from './icons';
import { DatePicker } from './DatePicker';
import type { Issue, IssueTemplate, Priority, Tag, Attachment, IssueType } from '../types';
import { Status, Priority as PriorityEnum, IssueType as IssueTypeEnum } from '../types';
import { getAllTemplates, saveCustomTemplate } from '../services/templateService';

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateIssue: (newIssue: Omit<Issue, 'id' | 'status' | 'updatedAt'>) => void;
  allIssues: Issue[];
  allTags: Tag[];
  issueTemplates: IssueTemplate[];
}

const DEFAULT_ISSUE_STATE: Omit<Issue, 'id' | 'status' | 'updatedAt'> = {
    title: '',
    type: IssueTypeEnum.TASK,
    description: '',
    priority: PriorityEnum.MEDIUM,
    assignee: { name: '', avatarUrl: '' },
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
}) => {
  const [issueData, setIssueData] = useState(DEFAULT_ISSUE_STATE);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [templates, setTemplates] = useState<IssueTemplate[]>(issueTemplates || []);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [templateMsg, setTemplateMsg] = useState<string>('');

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
    setIssueData(prev => ({ ...prev, assignee: { ...prev.assignee, name: value } }));
  };
  
  const handleTagsChange = (tags: Tag[]) => {
    setIssueData(prev => ({ ...prev, tags }));
  };
  
  const handleDependencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
    setIssueData(prev => ({ ...prev, dependencies: selectedOptions }));
  };

  const processFiles = (files: FileList) => {
    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
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
    const finalData = {
        ...issueData,
        assignee: {
            name: issueData.assignee.name,
            avatarUrl: `https://i.pravatar.cc/150?u=${issueData.assignee.name.replace(/\s/g, '')}`
        }
    };
    onCreateIssue(finalData);
  };
  
  const availableDependencies = useMemo(() => {
    return allIssues.filter(i => i.status !== Status.DONE);
  }, [allIssues]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-neutral-800">Create New Issue</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <form onSubmit={handleSubmit} id="create-issue-form" className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-sm font-bold text-gray-600 mb-1 block">Template</label>
            <select
                value={selectedTemplate}
                onChange={handleTemplateChange}
                className="block w-full text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-800 p-2"
            >
                <option value="">Select a template...</option>
                {templates.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="New template name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="flex-1 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-800 p-2"
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
              className="block w-full text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-800 p-2"
            />
          </div>
          <div>
            <label htmlFor="type" className="text-sm font-bold text-gray-600 mb-1 block">Type</label>
            <select
                id="type"
                value={issueData.type}
                onChange={(e) => handleChange('type', e.target.value as IssueType)}
                className="block w-full text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-800 p-2"
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
              className="block w-full text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-800 p-2"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="priority" className="text-sm font-bold text-gray-600 mb-1 block">Priority</label>
                <select
                    id="priority"
                    value={issueData.priority}
                    onChange={(e) => handleChange('priority', e.target.value as Priority)}
                    className="block w-full text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-800 p-2"
                >
                    {Object.values(PriorityEnum).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="assignee" className="text-sm font-bold text-gray-600 mb-1 block">Assignee</label>
                <input 
                    id="assignee"
                    type="text"
                    value={issueData.assignee.name}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    placeholder="Enter assignee name"
                    className="block w-full text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-800 p-2"
                />
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
              className="block w-full h-24 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-800 p-2"
            >
              {availableDependencies.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.id}: {dep.title}</option>
              ))}
            </select>
          </div>
          <div>
             <label className="text-sm font-bold text-gray-600 mb-1 block">Attachments</label>
             <div
                 onDragOver={handleDragOver}
                 onDragLeave={handleDragLeave}
                 onDrop={handleDrop}
                 className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                    isDraggingOver ? 'border-primary-500 bg-blue-50' : 'border-gray-300'
                 }`}
              >
                 <div className="space-y-1 text-center">
                     <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                     <div className="flex text-sm text-gray-600">
                         <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
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
                        <div key={file.name} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                            <span className="text-sm text-gray-700 truncate">{file.name}</span>
                            <button type="button" onClick={() => removeAttachment(file.name)} className="text-red-500 hover:text-red-700">
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
             )}
          </div>
        </form>
        <footer className="flex justify-end space-x-3 p-4 border-t bg-gray-50 mt-auto">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">Cancel</button>
          <button type="submit" form="create-issue-form" className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md disabled:opacity-50" disabled={!issueData.title}>Create Issue</button>
        </footer>
      </div>
    </div>
  );
};