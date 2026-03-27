import React, { useState, useMemo } from 'react';
import type { Issue, Comment, Tag, TeamMember, User, Attachment } from '../types';
import { Priority, Status } from '../types';
import { generateIssueSummary } from '../services/geminiService';
import { uploadFiles } from '../services/projectService';
import { BrainCircuitIcon, SendIcon, CloseIcon, LockIcon, LinkIcon, PencilIcon, FileTextIcon, ImageIcon, TrashIcon, MaximizeIcon, MinimizeIcon, UploadIcon } from './icons';
import { TagInput } from './TagInput';
import { DependencyInput } from './DependencyInput';
import { DatePicker } from './DatePicker';

interface IssueCardProps {
  issue: Issue;
  onAddComment: (issueId: string, commentText: string) => void;
  onEditComment: (issueId: string, commentId: string, newText: string) => void;
  onDeleteComment: (issueId: string, commentId: string) => void;
  onUpdateIssue: (issueId: string, updatedValues: Partial<Omit<Issue, 'id'>>) => void;
  allIssues: Issue[];
  allTags: Tag[];
  teamMembers?: TeamMember[];
  currentUser?: User | null;
}

const PriorityIndicator: React.FC<{ priority: Priority }> = ({ priority }) => {
  const priorityStyles: { [key in Priority]: { icon: string; color: string } } = {
    [Priority.HIGHEST]: { icon: '▲▲', color: 'text-red-600' },
    [Priority.HIGH]: { icon: '▲', color: 'text-orange-500' },
    [Priority.MEDIUM]: { icon: '▬', color: 'text-yellow-500' },
    [Priority.LOW]: { icon: '▼', color: 'text-green-500' },
  };

  const style = priorityStyles[priority];
  return (
    <span className={`flex items-center text-sm font-semibold ${style.color}`}>
      <span className="mr-1">{style.icon}</span> {priority}
    </span>
  );
};

export const IssueCard: React.FC<IssueCardProps> = ({ issue, onAddComment, onEditComment, onDeleteComment, onUpdateIssue, allIssues, allTags, teamMembers = [], currentUser = null }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReadModeOpen, setIsReadModeOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(issue);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const availableDependencies = useMemo(() => {
    return allIssues.filter(i => i.status !== Status.DONE && i.id !== issue.id);
  }, [allIssues, issue.id]);

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

  const handleAttachmentClick = async (e: React.MouseEvent<HTMLAnchorElement>, attachment: Attachment) => {
    const url = getAttachmentUrl(attachment);
    if (url.startsWith('data:')) {
      e.preventDefault();
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const newWindow = window.open(blobUrl, '_blank');
        if (newWindow) {
           setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } else {
           window.location.href = blobUrl;
        }
      } catch (error) {
        console.error('Failed to open attachment', error);
      }
    }
  };

  const { isBlocked, blockingIssues } = useMemo(() => {
    // FIX: Explicitly type the Map to aid TypeScript's type inference.
    const issuesMap = new Map<string, Issue>(allIssues.map(i => [i.id, i]));

    const isBlocked = issue.dependencies?.some(depId => {
      const dependency = issuesMap.get(depId);
      return dependency ? dependency.status !== Status.DONE : false;
    }) ?? false;

    const blockingIssues = allIssues.filter(i => i.dependencies?.includes(issue.id));

    return { isBlocked, blockingIssues };
  }, [issue.dependencies, allIssues]);


  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (isBlocked || isEditing) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('issueId', issue.id);
    e.dataTransfer.setData('sourceColumnId', issue.status);
  };

  const handleGetSummary = async () => {
    setIsSummarizing(true);
    setSummary('');
    try {
      const result = await generateIssueSummary(issue.title, issue.description);
      setSummary(result);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Failed to generate summary. Please check your API key and try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(issue.id, newComment);
      setNewComment('');
    }
  };

  const handleEditChange = (field: keyof Omit<Issue, 'tags' | 'assignee'>, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAssigneeChange = (value: string) => {
    // Find the selected user/member
    const allUsers = [currentUser, ...teamMembers.map(m => m.user)].filter(Boolean) as User[];
    const selectedUser = allUsers.find(u => u.id === value);

    if (selectedUser) {
      setEditFormData(prev => ({
        ...prev,
        assigneeId: selectedUser.id,
        assignee: {
          id: selectedUser.id,
          name: selectedUser.name,
          avatarUrl: selectedUser.avatarUrl || `https://i.pravatar.cc/150?u=${selectedUser.name.replace(/\s/g, '')}`
        }
      }));
    } else {
      // If no user is selected (empty value), clear assignee but keep the structure
      setEditFormData(prev => ({
        ...prev,
        assigneeId: null,
        assignee: null
      }));
    }
  };

  const handleTagsChange = (tags: Tag[]) => {
    setEditFormData(prev => ({ ...prev, tags }));
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
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setEditFormData(issue);
    setIsReadModeOpen(false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditFormData(issue);
    setIsEditing(false);
    setIsExpanded(false);
  };

  const handleOpenReadMode = () => {
    setIsReadModeOpen(true);
  };

  const handleStartEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  };

  const handleSaveCommentEdit = () => {
    if (editingCommentId && editingCommentText.trim()) {
      onEditComment(issue.id, editingCommentId, editingCommentText);
      setEditingCommentId(null);
      setEditingCommentText('');
    }
  };

  const handleCancelCommentEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };


  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  const dependencyTooltip = issue.dependencies?.map(depId => {
    const dep = allIssues.find(i => i.id === depId);
    return dep ? dep.title : depId;
  }).join(', ');
  const blockingTooltip = blockingIssues.map(i => i.title).join(', ');

  const dateDisplay = [
    issue.startDate && `Start: ${formatDate(issue.startDate)}`,
    issue.endDate && `End: ${formatDate(issue.endDate)}`
  ].filter(Boolean).join(' | ');

  if (isEditing) {
    const editForm = (
      <>
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
              onChange={(e) => handleEditChange('priority', e.target.value as Priority)}
              className="mt-1 block w-full pl-2 pr-8 py-1 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-900 dark:text-neutral-100"
            >
              {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">Assignee</label>
            <select
              value={(() => {
                // Find the user ID based on the current assignee ID
                return editFormData.assigneeId || '';
              })()}
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
          <DependencyInput
            allIssues={availableDependencies}
            selectedDependencyIds={editFormData.dependencies || []}
            onChange={(deps) => setEditFormData(prev => ({ ...prev, dependencies: deps }))}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600">Attachments</label>
          <div className="mt-1 flex items-center gap-2">
            <label
              htmlFor={`edit-attachment-upload-${issue.id}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-md cursor-pointer hover:bg-primary-100"
            >
              <UploadIcon className="w-4 h-4" />
              <span>Add files</span>
              <input
                id={`edit-attachment-upload-${issue.id}`}
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
      </>
    );

    if (isExpanded) {
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex justify-center items-center p-4" onClick={() => setIsExpanded(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-neutral-200 dark:border-neutral-700" onClick={e => e.stopPropagation()}>
            <header className="flex justify-between items-center p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Edit Issue</h2>
              <button onClick={() => setIsExpanded(false)} className="text-gray-500 hover:text-gray-800" title="Minimize">
                <MinimizeIcon className="w-6 h-6" />
              </button>
            </header>
            <div className="p-6 space-y-4 overflow-y-auto">
              {editForm}
            </div>
            <footer className="flex justify-end space-x-2 p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 mt-auto rounded-b-xl">
              <button onClick={handleCancelEdit} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">Cancel</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md">Save</button>
            </footer>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 shadow-md border-l-4 border-primary-600 space-y-3">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
            title="Expand"
          >
            <MaximizeIcon className="w-5 h-5" />
          </button>
        </div>
        {editForm}
        <div className="flex justify-end space-x-2 pt-2">
          <button onClick={handleCancelEdit} className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">Cancel</button>
          <button onClick={handleSaveEdit} className="px-3 py-1 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md">Save</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {isReadModeOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex justify-center items-center p-4" onClick={() => setIsReadModeOpen(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-neutral-200 dark:border-neutral-700" onClick={(e) => e.stopPropagation()}>
            <header className="flex justify-between items-center p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Issue Details</h2>
              <button onClick={() => setIsReadModeOpen(false)} className="text-gray-500 hover:text-gray-800">
                <CloseIcon className="w-6 h-6" />
              </button>
            </header>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{issue.title}</h3>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{issue.type} • {issue.priority}</p>
              </div>
              <div className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{issue.description || 'No description provided.'}</div>
              {issue.tags && issue.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {issue.tags.map(tag => (
                    <span key={tag.name} className={`px-2 py-1 rounded-full text-xs font-semibold ${tag.color}`}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
              {issue.attachments && issue.attachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Attachments</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {issue.attachments.map((attachment) => (
                      <a
                        key={`${attachment.name}-${(attachment.url || '').slice(0, 24)}`}
                        href={getAttachmentUrl(attachment)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => handleAttachmentClick(e, attachment)}
                        className="flex flex-col bg-neutral-50 dark:bg-neutral-900/50 rounded-md border border-neutral-200 dark:border-neutral-700 p-3 hover:border-primary-400 transition-colors"
                      >
                        {isImageAttachment(attachment) && (
                          <div className="flex-1 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-md mb-2 overflow-hidden border border-neutral-200 dark:border-neutral-700">
                            <img src={getAttachmentUrl(attachment)} alt={attachment.name} className="max-w-full max-h-64 object-contain" />
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 mt-auto">
                          {isImageAttachment(attachment) ? <ImageIcon className="w-4 h-4 shrink-0" /> : <FileTextIcon className="w-4 h-4 shrink-0" />}
                          <span className="truncate">{attachment.name}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <footer className="flex justify-end space-x-2 p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 mt-auto rounded-b-xl">
              <button onClick={() => setIsReadModeOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">Close</button>
              <button onClick={handleStartEditing} className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md">Edit</button>
            </footer>
          </div>
        </div>
      )}
      <div
      draggable={!isBlocked}
      onDragStart={handleDragStart}
      className={`bg-white dark:bg-neutral-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-primary-500 dark:border-primary-400 group ${isBlocked ? 'opacity-60 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-2 pr-2">{issue.title}</h3>
      </div>
      <p
        className="text-sm text-neutral-600 dark:text-neutral-400 mb-4"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        title={issue.description}
      >
        {issue.description}
      </p>

      {issue.tags && issue.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {issue.tags.map(tag => (
            <span key={tag.name} className={`px-2 py-1 rounded-full text-xs font-semibold ${tag.color}`}>
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {summary && (
        <div className="relative mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <button
            onClick={() => setSummary('')}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close summary"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
          <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 mb-1">AI Summary</h4>
          <p className="text-sm text-blue-700 dark:text-blue-200 whitespace-pre-wrap">{summary}</p>
        </div>
      )}

      {/* Card Footer: Metadata and Dates */}
      <div className="mt-4 flex flex-col space-y-3">
        {/* Top row: Priority, icons, actions, assignee */}
        <div className="flex justify-between items-center">
          {/* Left group */}
          <div className="flex items-center space-x-2">
            <PriorityIndicator priority={issue.priority} />
            {isBlocked && (
              <div className="relative group">
                <LockIcon className="text-gray-500" />
                <div className="absolute bottom-full mb-2 w-max hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2 z-10">
                  Blocked by: {dependencyTooltip}
                </div>
              </div>
            )}
            {blockingIssues.length > 0 && (
              <div className="relative group">
                <LinkIcon className="w-5 h-5 text-gray-500" />
                <div className="absolute bottom-full mb-2 w-max hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2 z-10 text-left">
                  <p>Blocking: {blockingTooltip}</p>
                  {isBlocked && <p className="mt-1">Blocked by: {dependencyTooltip}</p>}
                </div>
              </div>
            )}
          </div>
          {/* Right group */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenReadMode}
              className="p-1.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-full text-neutral-600 dark:text-neutral-400 transition-colors"
              title="Open Read Mode"
            >
              <FileTextIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleStartEditing}
              className="p-1.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-full text-neutral-600 dark:text-neutral-400 transition-colors"
              title="Edit Issue"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleGetSummary}
              disabled={isSummarizing}
              className="p-1.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-full text-neutral-600 dark:text-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Get AI Summary"
            >
              {isSummarizing ? (
                <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <BrainCircuitIcon className="w-5 h-5" />
              )}
            </button>
            {issue.assignee && (
              <img
                src={issue.assignee.avatarUrl || `https://i.pravatar.cc/150?u=${issue.assignee.name.replace(/\s/g, '')}`}
                alt={issue.assignee.name}
                title={issue.assignee.name}
                className="w-8 h-8 rounded-full border-2 border-white dark:border-neutral-700"
              />
            )}
          </div>
        </div>
        {/* Bottom row: Dates */}
        <div className="text-xs text-neutral-400 dark:text-neutral-500">
          {dateDisplay && <div>{dateDisplay}</div>}
          <div>Updated: {formatDate(issue.updatedAt)}</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        {issue.attachments && issue.attachments.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Attachments</h4>
            <ul className="space-y-2">
              {issue.attachments.map((attachment, index) => (
                <li key={index} className="bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded-md border border-neutral-100 dark:border-neutral-700">
                  <a href={getAttachmentUrl(attachment)} target="_blank" rel="noopener noreferrer" onClick={(e) => handleAttachmentClick(e, attachment)} className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    {isImageAttachment(attachment)
                      ? <ImageIcon className="w-5 h-5 text-gray-500 shrink-0" />
                      : <FileTextIcon className="w-5 h-5 text-gray-500 shrink-0" />
                    }
                    <span className="ml-2 truncate">{attachment.name}</span>
                    <span className="ml-auto text-xs text-gray-500 whitespace-nowrap">
                      {`(${(attachment.size / 1024).toFixed(1)} KB)`}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <h4 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-2">Comments</h4>
        <div className="space-y-3">
          {issue.comments?.map(comment => (
            <div key={comment.id} className="flex items-start space-x-2 group">
              <img src={comment.author.avatarUrl} alt={comment.author.name} className="w-6 h-6 rounded-full mt-1" />
              <div className="bg-neutral-100 dark:bg-neutral-700/50 rounded-lg px-3 py-2 text-sm w-full">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200">{comment.author.name}</p>
                  {comment.author.name === 'Current User' && editingCommentId !== comment.id && (
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEditComment(comment)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Edit comment"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteComment(issue.id, comment.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete comment"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {editingCommentId === comment.id ? (
                  <div className="mt-2">
                    <textarea
                      value={editingCommentText}
                      onChange={(e) => setEditingCommentText(e.target.value)}
                      rows={2}
                      className="w-full resize-none bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm p-2 text-neutral-900 dark:text-neutral-100"
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <button onClick={handleCancelCommentEdit} className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">Cancel</button>
                      <button onClick={handleSaveCommentEdit} className="px-2 py-1 text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md">Save</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-neutral-700 dark:text-neutral-300">{comment.text}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleCommentSubmit} className="mt-4 flex items-center space-x-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={1}
            className="flex-grow resize-none bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm p-2 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
          />
          <button type="submit" className="bg-primary-500 text-white p-2 rounded-full hover:bg-primary-600 disabled:opacity-50" disabled={!newComment.trim()}>
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
      </div>
    </>
  );
};
