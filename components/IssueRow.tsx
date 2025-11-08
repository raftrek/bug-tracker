import React, { useState, useMemo } from 'react';
import type { Issue, Tag } from '../types';
import { Priority, Status } from '../types';
import { PencilIcon } from './icons';
import { TagInput } from './TagInput';

interface IssueRowProps {
  issue: Issue;
  onUpdateIssue: (issueId: string, updatedValues: Partial<Omit<Issue, 'id'>>) => void;
  allIssues: Issue[];
  allTags: Tag[];
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
        [Status.TODO]: { text: 'To Do', color: 'bg-gray-200 text-gray-800' },
        [Status.IN_PROGRESS]: { text: 'In Progress', color: 'bg-blue-200 text-blue-800' },
        [Status.READY_FOR_TEST]: { text: 'Ready for Test', color: 'bg-purple-200 text-purple-800' },
        [Status.DONE]: { text: 'Done', color: 'bg-green-200 text-green-800' },
    };
    const style = statusStyles[status];
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${style.color}`}>{style.text}</span>;
}

export const IssueRow: React.FC<IssueRowProps> = ({ issue, onUpdateIssue, allIssues, allTags }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(issue);

  const availableDependencies = useMemo(() => {
    return allIssues.filter(i => i.status !== Status.DONE && i.id !== issue.id);
  }, [allIssues, issue.id]);

  const handleEditChange = (field: keyof Omit<Issue, 'tags' | 'assignee' | 'dependencies'>, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAssigneeChange = (value: string) => {
    setEditFormData(prev => ({ ...prev, assignee: { ...prev.assignee, name: value } }));
  };

  const handleTagsChange = (tags: Tag[]) => {
    setEditFormData(prev => ({ ...prev, tags }));
  };
  
  const handleSaveEdit = () => {
    const { id, createdAt, updatedAt, comments, ...updatedValues } = editFormData;
    const finalValues = {
        ...updatedValues,
        assignee: {
            name: updatedValues.assignee.name,
            avatarUrl: `https://i.pravatar.cc/150?u=${updatedValues.assignee.name.replace(/\s/g, '')}`
        }
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
      <tr className="bg-blue-50">
        <td className="px-4 py-3 text-sm font-mono text-gray-500 whitespace-nowrap">{issue.id}</td>
        <td className="px-4 py-3 whitespace-nowrap" style={{ minWidth: '200px' }}>
          <input 
            type="text"
            value={editFormData.title}
            onChange={(e) => handleEditChange('title', e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-md shadow-sm p-1.5 text-sm"
          />
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
            <select
                value={editFormData.status}
                onChange={(e) => handleEditChange('status', e.target.value as Status)}
                className="w-full bg-white border border-gray-300 rounded-md shadow-sm p-1.5 text-sm"
            >
                {Object.values(Status).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
            <select
                value={editFormData.priority}
                onChange={(e) => handleEditChange('priority', e.target.value as Priority)}
                className="w-full bg-white border border-gray-300 rounded-md shadow-sm p-1.5 text-sm"
            >
                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
            <input 
                type="text"
                value={editFormData.assignee.name}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md shadow-sm p-1.5 text-sm"
            />
        </td>
        <td className="px-4 py-3" style={{ minWidth: '250px' }}>
            <TagInput
                allTags={allTags}
                selectedTags={editFormData.tags || []}
                onChange={handleTagsChange}
            />
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(issue.updatedAt)}</td>
        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex items-center gap-2">
                <button onClick={handleSaveEdit} className="px-2 py-1 text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md">Save</button>
                <button onClick={handleCancelEdit} className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">Cancel</button>
            </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm font-mono text-gray-500 whitespace-nowrap">{issue.id}</td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{issue.title}</td>
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
        <StatusPill status={issue.status} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
        <PriorityIndicator priority={issue.priority} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
        <div className="flex items-center gap-2">
            <img src={issue.assignee.avatarUrl} alt={issue.assignee.name} className="w-6 h-6 rounded-full" />
            <span>{issue.assignee.name}</span>
        </div>
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
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(issue.updatedAt)}</td>
      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
        <button onClick={handleStartEditing} className="text-primary-600 hover:text-primary-800 p-1">
          <PencilIcon className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
};