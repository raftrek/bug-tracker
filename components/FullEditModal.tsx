import React, { useState, useMemo } from 'react';
import { TagInput } from './TagInput';
import { DatePicker } from './DatePicker';
import { CloseIcon, UploadIcon, FileTextIcon, ImageIcon, MinimizeIcon } from './icons';
import type { Issue, Tag, Priority, User, TeamMember, Attachment } from '../types';
import { Status, Priority as PriorityEnum } from '../types';

interface FullEditModalProps {
  issue: Issue;
  allIssues: Issue[];
  allTags: Tag[];
  teamMembers?: TeamMember[];
  currentUser?: User | null;
  onUpdateIssue: (issueId: string, updatedValues: Partial<Omit<Issue, 'id'>>) => void;
  onClose: () => void;
}

export const FullEditModal: React.FC<FullEditModalProps> = ({
  issue,
  allIssues,
  allTags,
  teamMembers = [],
  currentUser = null,
  onUpdateIssue,
  onClose
}) => {
  const [editFormData, setEditFormData] = useState<Issue>(issue);

  const availableDependencies = useMemo(() => {
    return allIssues.filter(i => i.status !== Status.DONE && i.id !== issue.id);
  }, [allIssues, issue.id]);

  const handleEditChange = (field: keyof Omit<Issue, 'tags' | 'assignee'>, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAssigneeChange = (value: string) => {
    let assignee = null;
    if (value) {
      if (currentUser && currentUser.id === value) {
        assignee = currentUser;
      } else {
        const member = teamMembers.find(m => m.user.id === value);
        if (member) {
          assignee = member.user;
        }
      }
    }
    setEditFormData(prev => ({
      ...prev,
      assigneeId: value || null,
      assignee: assignee ? {
        id: assignee.id,
        name: assignee.name,
        avatarUrl: assignee.avatarUrl || `https://i.pravatar.cc/150?u=${assignee.name.replace(/\s/g, '')}`
      } : null
    }));
  };

  const handleTagsChange = (tags: Tag[]) => {
    setEditFormData(prev => ({ ...prev, tags }));
  };

  const handleDependencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
    setEditFormData(prev => ({ ...prev, dependencies: selectedOptions }));
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const processEditAttachments = async (files: FileList) => {
    const selectedFiles = Array.from(files);
    const encodedFiles = await Promise.all(
      selectedFiles.map(async (file) => ({
        file,
        dataUrl: await readFileAsDataUrl(file),
      }))
    );
    const attachments: Attachment[] = encodedFiles.map(({ file, dataUrl }) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      url: dataUrl,
    }));
    setEditFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...attachments],
    }));
  };

  const handleEditAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processEditAttachments(e.target.files);
      e.target.value = '';
    }
  };

  const removeEditAttachment = (attachmentName: string) => {
    setEditFormData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter((attachment) => attachment.name !== attachmentName),
    }));
  };

  const isImageAttachment = (attachment: Attachment) => {
    const mimeType = attachment.type || '';
    const fileName = attachment.name || '';
    return mimeType.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName);
  };

  const getAttachmentUrl = (attachment: Attachment) => {
    const rawUrl = attachment.url || '';
    if (!rawUrl) return '';
    if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:') || /^https?:\/\//i.test(rawUrl)) {
      return rawUrl;
    }
    const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
    const apiBaseUrl = viteEnv?.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:3001/api`;
    const apiOrigin = new URL(apiBaseUrl, window.location.origin).origin;
    if (rawUrl.startsWith('/uploads/')) {
      return `${apiOrigin}${rawUrl}`;
    }
    if (rawUrl.startsWith('uploads/')) {
      return `${apiOrigin}/${rawUrl}`;
    }
    return rawUrl;
  };

  const handleSaveEdit = () => {
    const { id, status, updatedAt, comments, ...updatedValues } = editFormData;
    const finalValues = {
      ...updatedValues,
      assigneeId: updatedValues.assigneeId,
      assignee: updatedValues.assignee ? {
        id: updatedValues.assignee.id,
        name: updatedValues.assignee.name,
        avatarUrl: updatedValues.assignee.avatarUrl
      } : null
    };
    onUpdateIssue(id, finalValues);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-neutral-200 dark:border-neutral-700" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Edit Issue</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" title="Minimize">
            <MinimizeIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-gray-600">Title</label>
            <input
              type="text"
              value={editFormData.title}
              onChange={(e) => handleEditChange('title', e.target.value)}
              className="mt-1 block w-full px-2 py-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">Description</label>
            <textarea
              value={editFormData.description}
              onChange={(e) => handleEditChange('description', e.target.value)}
              rows={3}
              className="mt-1 block w-full px-2 py-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600">Priority</label>
              <select
                value={editFormData.priority}
                onChange={(e) => handleEditChange('priority', e.target.value as PriorityEnum)}
                className="mt-1 block w-full pl-2 pr-8 py-1 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100"
              >
                {Object.values(PriorityEnum).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">Assignee</label>
              <select
                value={editFormData.assigneeId || ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="mt-1 block w-full px-2 py-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm text-neutral-900 dark:text-neutral-100"
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
              <label className="text-xs font-bold text-gray-600">Start Date</label>
              <DatePicker
                value={editFormData.startDate}
                onChange={(date) => handleEditChange('startDate', date)}
                className="mt-1 block w-full px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm text-neutral-800 pr-10"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">End Date</label>
              <DatePicker
                value={editFormData.endDate}
                onChange={(date) => handleEditChange('endDate', date)}
                className="mt-1 block w-full px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm text-neutral-800 pr-10"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">Tags</label>
            <TagInput
              allTags={allTags}
              selectedTags={editFormData.tags || []}
              onChange={handleTagsChange}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-600">Dependencies</label>
              <button
                type="button"
                onClick={() => setEditFormData(prev => ({ ...prev, dependencies: [] }))}
                className="text-xs font-medium text-primary-600 hover:underline focus:outline-none"
                aria-label="Clear all dependencies"
              >
                Clear
              </button>
            </div>
            <select
              multiple
              value={editFormData.dependencies || []}
              onChange={handleDependencyChange}
              className="block w-full h-24 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100"
            >
              {availableDependencies.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">Attachments</label>
            <div className="mt-1 flex items-center gap-2">
              <label
                htmlFor={`full-edit-attachment-upload-${issue.id}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-md cursor-pointer hover:bg-primary-100"
              >
                <UploadIcon className="w-4 h-4" />
                <span>Add files</span>
                <input
                  id={`full-edit-attachment-upload-${issue.id}`}
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={handleEditAttachmentChange}
                />
              </label>
            </div>
            {editFormData.attachments && editFormData.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {editFormData.attachments.map((attachment) => (
                  <div key={`${attachment.name}-${(attachment.url || '').slice(0, 24)}`} className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded-md border border-neutral-100 dark:border-neutral-700">
                    <div className="flex items-center gap-3 min-w-0">
                      {isImageAttachment(attachment) ? (
                        <img src={getAttachmentUrl(attachment)} alt={attachment.name} className="w-10 h-10 rounded object-cover border border-neutral-200 dark:border-neutral-700" />
                      ) : (
                        <FileTextIcon className="w-5 h-5 text-gray-500 shrink-0" />
                      )}
                      <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate">{attachment.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEditAttachment(attachment.name)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <footer className="flex justify-end space-x-2 p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 mt-auto rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">Cancel</button>
          <button onClick={handleSaveEdit} className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md">Save</button>
        </footer>
      </div>
    </div>
  );
};
