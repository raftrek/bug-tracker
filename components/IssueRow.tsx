import React, { useState, useMemo } from 'react';
import type { Issue, Tag, TeamMember, User } from '../types';
import { Priority, Status } from '../types';
import { PencilIcon, MaximizeIcon } from './icons';
import { TagInput } from './TagInput';
import { FullEditModal } from './FullEditModal';

interface IssueRowProps {
  issue: Issue;
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

const StatusPill: React.FC<{ status: Status }> = ({ status }) => {
  const statusStyles: { [key in Status]: { text: string; color: string } } = {
    [Status.TODO]: { text: 'To Do', color: 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300' },
    [Status.IN_PROGRESS]: { text: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    [Status.READY_FOR_TEST]: { text: 'Ready for Test', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
    [Status.DONE]: { text: 'Done', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  };
  const style = statusStyles[status];
  return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${style.color}`}>{style.text}</span>;
}

export const IssueRow: React.FC<IssueRowProps> = ({ issue, onUpdateIssue, allIssues, allTags, teamMembers, currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isFullEditing, setIsFullEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(issue);

  const availableDependencies = useMemo(() => {
    return allIssues.filter(i => i.status !== Status.DONE && i.id !== issue.id);
  }, [allIssues, issue.id]);

  const handleEditChange = (field: keyof Omit<Issue, 'tags' | 'assignee' | 'dependencies'>, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAssigneeChange = (value: string) => {
    setEditFormData(prev => ({ 
      ...prev, 
      assignee: prev.assignee ? { ...prev.assignee, name: value } : { id: '', name: value }
    }));
  };

  const handleTagsChange = (tags: Tag[]) => {
    setEditFormData(prev => ({ ...prev, tags }));
  };

  const handleSaveEdit = () => {
    const { id, createdAt, updatedAt, comments, ...updatedValues } = editFormData;
    const finalValues = {
      ...updatedValues,
      assignee: updatedValues.assignee ? {
        id: updatedValues.assignee.id,
        name: updatedValues.assignee.name,
        avatarUrl: updatedValues.assignee.avatarUrl || `https://i.pravatar.cc/150?u=${updatedValues.assignee.name.replace(/\s/g, '')}`
      } : null
    };
    onUpdateIssue(id, finalValues);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditFormData(issue);
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setEditFormData(issue);
    setIsEditing(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    // FIX: Corrected typo `toLocaleDate sapiens` to `toLocaleDateString`.
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50 dark:bg-blue-900/20">
        <td className="px-4 py-3 whitespace-nowrap" style={{ minWidth: '200px' }}>
          <input
            type="text"
            value={editFormData.title}
            onChange={(e) => handleEditChange('title', e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm p-1.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <select
            value={editFormData.status}
            onChange={(e) => handleEditChange('status', e.target.value as Status)}
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm p-1.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {Object.values(Status).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <select
            value={editFormData.priority}
            onChange={(e) => handleEditChange('priority', e.target.value as Priority)}
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm p-1.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <input
            type="text"
            value={editFormData.assignee?.name || ''}
            onChange={(e) => handleAssigneeChange(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm p-1.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </td>
        <td className="px-4 py-3" style={{ minWidth: '250px' }}>
          <TagInput
            allTags={allTags}
            selectedTags={editFormData.tags || []}
            onChange={handleTagsChange}
          />
        </td>
        <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{formatDate(issue.updatedAt)}</td>
        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center gap-2">
            <button onClick={handleSaveEdit} className="px-2 py-1 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md">Save</button>
            <button onClick={handleCancelEdit} className="px-2 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-md">Cancel</button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap">{issue.title}</td>
      <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
        <StatusPill status={issue.status} />
      </td>
      <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
        <PriorityIndicator priority={issue.priority} />
      </td>
      <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
        {issue.assignee ? (
          <div className="flex items-center gap-2">
            <img src={issue.assignee.avatarUrl || `https://i.pravatar.cc/150?u=${issue.assignee.name.replace(/\s/g, '')}`} alt={issue.assignee.name} className="w-6 h-6 rounded-full" />
            <span>{issue.assignee.name}</span>
          </div>
        ) : (
          <span className="text-gray-400 italic">Unassigned</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex flex-wrap gap-1">
          {issue.tags?.map(tag => (
            <span key={tag.name} className={`px-2 py-0.5 rounded-full text-xs font-medium ${tag.color}`}>
              {tag.name}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{formatDate(issue.updatedAt)}</td>
      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
        <button onClick={handleStartEditing} className="text-primary-600 hover:text-primary-800 p-1" title="Quick Edit">
          <PencilIcon className="w-5 h-5" />
        </button>
        <button onClick={() => setIsFullEditing(true)} className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 p-1 ml-1" title="Full Edit">
          <MaximizeIcon className="w-5 h-5" />
        </button>
      </td>
      {isFullEditing && (
        <FullEditModal
          issue={issue}
          allIssues={allIssues}
          allTags={allTags}
          teamMembers={teamMembers}
          currentUser={currentUser}
          onUpdateIssue={onUpdateIssue}
          onClose={() => setIsFullEditing(false)}
        />
      )}
    </tr>
  );
};