import React, { useState } from 'react';
import { IssueCard } from './IssueCard';
// FIX: Import Status as a value to use its enum members in the switch statement.
import { Status, type ColumnData, type Issue, type Tag, type TeamMember, type User } from '../types';

interface ColumnProps {
  column: ColumnData;
  onMoveIssue: (issueId: string, sourceColumnId: Status, targetColumnId: Status) => void;
  onAddComment: (issueId: string, commentText: string) => void;
  onEditComment: (issueId: string, commentId: string, newText: string) => void;
  onDeleteComment: (issueId: string, commentId: string) => void;
  onUpdateIssue: (issueId: string, updatedValues: Partial<Omit<Issue, 'id'>>) => void;
  allIssues: Issue[];
  allTags: Tag[];
  teamMembers?: TeamMember[];
  currentUser?: User | null;
}

export const Column: React.FC<ColumnProps> = ({ column, onMoveIssue, onAddComment, onEditComment, onDeleteComment, onUpdateIssue, allIssues, allTags, teamMembers, currentUser }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const issueId = e.dataTransfer.getData('issueId');
    const sourceColumnId = e.dataTransfer.getData('sourceColumnId') as Status;
    onMoveIssue(issueId, sourceColumnId, column.id);
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.TODO:
        return 'bg-gray-400';
      case Status.IN_PROGRESS:
        return 'bg-blue-500';
      case Status.READY_FOR_TEST:
        return 'bg-purple-500';
      case Status.DONE:
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-neutral-200 dark:bg-neutral-800/50 rounded-xl p-3 transition-colors duration-300 ${isDragOver ? 'bg-neutral-300 dark:bg-neutral-700' : ''}`}
    >
      <div className="flex items-center mb-4 px-1">
        <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(column.id)}`}></div>
        <h2 className="text-lg font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
          {column.title}
        </h2>
        <span className="ml-2 bg-neutral-300 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-sm font-bold px-2 py-0.5 rounded-full">
          {column.issues.length}
        </span>
      </div>
      <div className="space-y-4 h-full">
        {column.issues.map(issue => (
          <IssueCard
            key={issue.id}
            issue={issue}
            onAddComment={onAddComment}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
            onUpdateIssue={onUpdateIssue}
            allIssues={allIssues}
            allTags={allTags}
            teamMembers={teamMembers}
            currentUser={currentUser}
          />
        ))}
        {column.issues.length === 0 && <div className="h-16"></div>}
      </div>
    </div>
  );
};