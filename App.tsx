import React, { useState, useMemo, useCallback } from 'react';
import { Board } from './components/Board';
import { CreateIssueModal } from './components/CreateIssueModal';
import { AddIcon, KanbanIcon, ListIcon } from './components/icons';
import { INITIAL_ISSUES, ISSUE_TEMPLATES, ALL_TAGS } from './constants';
import { Status, Priority, type Issue, type ColumnData, type Tag, type Comment } from './types';
import { ListView } from './components/ListView';

function App() {
  const [issues, setIssues] = useState<Issue[]>(INITIAL_ISSUES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>(ALL_TAGS);
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');
  const [tagFilter, setTagFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const handleMoveIssue = useCallback((issueId: string, sourceColumnId: Status, targetColumnId: Status) => {
    if (sourceColumnId === targetColumnId) return;

    setIssues(prevIssues =>
      prevIssues.map(issue =>
        issue.id === issueId ? { ...issue, status: targetColumnId, updatedAt: new Date().toISOString() } : issue
      )
    );
  }, []);

  const handleUpdateIssue = useCallback((issueId: string, updatedValues: Partial<Omit<Issue, 'id'>>) => {
    setIssues(prevIssues =>
      prevIssues.map(issue => {
        if (issue.id === issueId) {
          if (updatedValues.tags) {
            const newTags = updatedValues.tags.filter(
              (tag) => !availableTags.some((existingTag) => existingTag.name === tag.name)
            );
            if (newTags.length > 0) {
              setAvailableTags(prevTags => [...prevTags, ...newTags]);
            }
          }
          return { ...issue, ...updatedValues, updatedAt: new Date().toISOString() };
        }
        return issue;
      })
    );
  }, [availableTags]);
  
  const handleAddComment = useCallback((issueId: string, commentText: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      text: commentText,
      author: {
        name: 'Current User',
        avatarUrl: `https://i.pravatar.cc/150?u=CurrentUser`
      },
      timestamp: new Date().toISOString(),
    };

    setIssues(prevIssues =>
      prevIssues.map(issue =>
        issue.id === issueId
          ? {
              ...issue,
              comments: [...(issue.comments || []), newComment],
              updatedAt: new Date().toISOString(),
            }
          : issue
      )
    );
  }, []);

  const handleEditComment = useCallback((issueId: string, commentId: string, newText: string) => {
    setIssues(prevIssues =>
      prevIssues.map(issue => {
        if (issue.id === issueId) {
          const updatedComments = issue.comments?.map(comment =>
            comment.id === commentId ? { ...comment, text: newText } : comment
          );
          return {
            ...issue,
            comments: updatedComments,
            updatedAt: new Date().toISOString(),
          };
        }
        return issue;
      })
    );
  }, []);

  const handleDeleteComment = useCallback((issueId: string, commentId: string) => {
    setIssues(prevIssues =>
        prevIssues.map(issue => {
            if (issue.id === issueId) {
                const updatedComments = issue.comments?.filter(comment => comment.id !== commentId);
                return {
                    ...issue,
                    comments: updatedComments,
                    updatedAt: new Date().toISOString(),
                };
            }
            return issue;
        })
    );
  }, []);

  const handleCreateIssue = useCallback((newIssueData: Omit<Issue, 'id' | 'status' | 'updatedAt'>) => {
    const newIssue: Issue = {
      ...newIssueData,
      id: `TASK-${issues.length + 1}`,
      status: Status.TODO,
      updatedAt: new Date().toISOString(),
    };

    if (newIssue.tags) {
        const newTags = newIssue.tags.filter(
          (tag) => !availableTags.some((existingTag) => existingTag.name === tag.name)
        );
        if (newTags.length > 0) {
          setAvailableTags(prevTags => [...prevTags, ...newTags]);
        }
      }

    setIssues(prevIssues => [newIssue, ...prevIssues]);
    setIsModalOpen(false);
  }, [issues.length, availableTags]);

  const uniqueAssignees = useMemo(() => {
    const assignees = issues.map(issue => issue.assignee.name);
    return ['All', ...Array.from(new Set(assignees))];
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const priorityMatch = priorityFilter === 'All' || issue.priority === priorityFilter;
      const assigneeMatch = assigneeFilter === 'All' || issue.assignee.name === assigneeFilter;
      const tagMatch = tagFilter === 'All' || issue.tags?.some(tag => tag.name === tagFilter);
      return priorityMatch && assigneeMatch && tagMatch;
    });
  }, [issues, priorityFilter, assigneeFilter, tagFilter]);

  const boardData = useMemo<ColumnData[]>(() => {
    const todoIssues = filteredIssues.filter(issue => issue.status === Status.TODO);
    const inProgressIssues = filteredIssues.filter(issue => issue.status === Status.IN_PROGRESS);
    const readyForTestIssues = filteredIssues.filter(issue => issue.status === Status.READY_FOR_TEST);
    const doneIssues = filteredIssues.filter(issue => issue.status === Status.DONE);

    return [
      { id: Status.TODO, title: 'To Do', issues: todoIssues },
      { id: Status.IN_PROGRESS, title: 'In Progress', issues: inProgressIssues },
      { id: Status.READY_FOR_TEST, title: 'Ready for Test', issues: readyForTestIssues },
      { id: Status.DONE, title: 'Done', issues: doneIssues },
    ];
  }, [filteredIssues]);

  return (
    <div className="bg-neutral-100 min-h-screen text-neutral-800 font-sans">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">Project Board</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <AddIcon />
            Create Issue
          </button>
        </div>
      </header>
      <main className="p-4 sm:p-6 container mx-auto">
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <span className="font-semibold text-gray-700">Filter by:</span>
            <div className="flex items-center gap-2">
              <label htmlFor="priority-filter" className="text-sm font-medium text-gray-500">Priority</label>
              <select
                id="priority-filter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 p-1.5"
              >
                <option value="All">All</option>
                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="assignee-filter" className="text-sm font-medium text-gray-500">Assignee</label>
              <select
                id="assignee-filter"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 p-1.5"
              >
                {uniqueAssignees.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="tag-filter" className="text-sm font-medium text-gray-500">Tag</label>
              <select
                id="tag-filter"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 p-1.5"
              >
                <option value="All">All</option>
                {availableTags.map(tag => <option key={tag.name} value={tag.name}>{tag.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">View:</span>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              title="Kanban View"
            >
              <KanbanIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              title="List View"
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {viewMode === 'kanban' ? (
          <Board 
            boardData={boardData}
            onMoveIssue={handleMoveIssue}
            onAddComment={handleAddComment}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            onUpdateIssue={handleUpdateIssue}
            allIssues={issues}
            allTags={availableTags}
          />
        ) : (
          <ListView
            issues={filteredIssues}
            onUpdateIssue={handleUpdateIssue}
            allIssues={issues}
            allTags={availableTags}
          />
        )}
      </main>
      <CreateIssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateIssue={handleCreateIssue}
        allIssues={issues}
        allTags={availableTags}
        issueTemplates={ISSUE_TEMPLATES}
      />
    </div>
  );
}

export default App;