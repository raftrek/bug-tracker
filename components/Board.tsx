import React from 'react';
import { Column } from './Column';
import type { ColumnData, Status, Issue, Tag, TeamMember, User } from '../types';

interface BoardProps {
  boardData: ColumnData[];
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

export const Board: React.FC<BoardProps> = ({ boardData, onMoveIssue, onAddComment, onEditComment, onDeleteComment, onUpdateIssue, allIssues, allTags, teamMembers, currentUser }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {boardData.map(column => (
        <Column
          key={column.id}
          column={column}
          onMoveIssue={onMoveIssue}
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
    </div>
  );
};