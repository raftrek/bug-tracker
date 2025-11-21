import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Board } from '../components/Board';
import { CreateIssueModal } from '../components/CreateIssueModal';
import { TeamModal } from '../components/TeamModal';
import { AddIcon, KanbanIcon, ListIcon } from '../components/icons';
import { ThemeToggle } from '../components/ThemeToggle';
import { ALL_TAGS, ISSUE_TEMPLATES } from '../constants';
import { Status, Priority, type Issue, type ColumnData, type Tag, type Project } from '../types';
import { useAuth } from '../context/AuthContext';
import { ListView } from '../components/ListView';
import {
  getProjectById,
  getProjectIssues,
  createIssue,
  updateIssue,
  createComment,
  updateComment,
  deleteComment
} from '../services/projectService';

const ProjectBoardPage: React.FC = () => {
  const { projectId } = useParams();
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>(ALL_TAGS);
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');
  const [tagFilter, setTagFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const loadProjectData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const proj = await getProjectById(projectId);
      if (!proj) {
        setLoadError('Project not found or inaccessible.');
        return;
      }
      setProject(proj);

      // Issues are included in project details from API
      setIssues(proj.issues || []);

      const defaultView = proj.config && typeof proj.config.defaultView === 'string' ? proj.config.defaultView : 'kanban';
      setViewMode(defaultView === 'list' ? 'list' : 'kanban');
    } catch (err) {
      setLoadError('Failed to load project.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  const handleMoveIssue = useCallback(async (issueId: string, sourceColumnId: Status, targetColumnId: Status) => {
    if (sourceColumnId === targetColumnId) return;

    // Optimistic update
    setIssues(prevIssues => prevIssues.map(issue =>
      issue.id === issueId ? { ...issue, status: targetColumnId, updatedAt: new Date().toISOString() } : issue
    ));

    try {
      if (projectId) {
        await updateIssue(projectId, issueId, { status: targetColumnId });
      }
    } catch (error) {
      console.error('Failed to move issue', error);
      // Revert would go here
      loadProjectData();
    }
  }, [projectId, loadProjectData]);

  const handleUpdateIssue = useCallback(async (issueId: string, updatedValues: Partial<Omit<Issue, 'id'>>) => {
    // Optimistic update
    setIssues(prevIssues => prevIssues.map(issue => {
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
    }));

    try {
      if (projectId) {
        await updateIssue(projectId, issueId, updatedValues);
      }
    } catch (error) {
      console.error('Failed to update issue', error);
      loadProjectData();
    }
  }, [projectId, availableTags, loadProjectData]);

  const handleAddComment = useCallback(async (issueId: string, commentText: string) => {
    if (!projectId) return;
    try {
      const newComment = await createComment(projectId, issueId, commentText);
      setIssues(prevIssues => prevIssues.map(issue =>
        issue.id === issueId
          ? { ...issue, comments: [...(issue.comments || []), newComment], updatedAt: new Date().toISOString() }
          : issue
      ));
    } catch (error) {
      console.error('Failed to add comment', error);
    }
  }, [projectId]);

  const handleEditComment = useCallback(async (issueId: string, commentId: string, newText: string) => {
    if (!projectId) return;

    // Optimistic
    setIssues(prevIssues => prevIssues.map(issue => {
      if (issue.id === issueId) {
        const updatedComments = issue.comments?.map(comment =>
          comment.id === commentId ? { ...comment, text: newText } : comment
        );
        return { ...issue, comments: updatedComments };
      }
      return issue;
    }));

    try {
      await updateComment(projectId, issueId, commentId, newText);
    } catch (error) {
      console.error('Failed to edit comment', error);
      loadProjectData();
    }
  }, [projectId, loadProjectData]);

  const handleDeleteComment = useCallback(async (issueId: string, commentId: string) => {
    if (!projectId) return;

    // Optimistic
    setIssues(prevIssues => prevIssues.map(issue => {
      if (issue.id === issueId) {
        const updatedComments = issue.comments?.filter(comment => comment.id !== commentId);
        return { ...issue, comments: updatedComments };
      }
      return issue;
    }));

    try {
      await deleteComment(projectId, issueId, commentId);
    } catch (error) {
      console.error('Failed to delete comment', error);
      loadProjectData();
    }
  }, [projectId, loadProjectData]);

  const handleCreateIssue = useCallback(async (newIssueData: Omit<Issue, 'id' | 'status' | 'updatedAt'>) => {
    if (!projectId) return;

    try {
      const createdIssue = await createIssue(projectId, {
        ...newIssueData,
        status: Status.TODO
      });

      if (newIssueData.tags) {
        const newTags = newIssueData.tags.filter(
          (tag) => !availableTags.some((existingTag) => existingTag.name === tag.name)
        );
        if (newTags.length > 0) {
          setAvailableTags(prevTags => [...prevTags, ...newTags]);
        }
      }

      setIssues(prevIssues => [createdIssue, ...prevIssues]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create issue', error);
    }
  }, [projectId, availableTags]);

  const handleTeamUpdate = useCallback(() => {
    loadProjectData();
  }, [loadProjectData]);

  const uniqueAssignees = useMemo(() => {
    const assignees = issues.map(issue => issue.assignee?.name || 'Unassigned');
    return ['All', ...Array.from(new Set(assignees))];
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const priorityMatch = priorityFilter === 'All' || issue.priority === priorityFilter;
      const assigneeMatch = assigneeFilter === 'All' || (issue.assignee?.name || 'Unassigned') === assigneeFilter;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 text-neutral-800">
        <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
          <div className="container mx-auto"><h1 className="text-2xl font-bold text-primary-600">Loading project...</h1></div>
        </header>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-neutral-100 text-neutral-800">
        <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-600">Project Board</h1>
            <Link to="/projects" className="px-4 py-2 rounded bg-neutral-200 text-neutral-800 hover:bg-neutral-300">Back to Projects</Link>
          </div>
        </header>
        <main className="container mx-auto p-4 sm:p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded">{loadError}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-200">
      <header className="bg-white dark:bg-neutral-800 shadow-sm p-4 sticky top-0 z-20 border-b border-neutral-200 dark:border-neutral-700">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">{project?.name || 'Project Board'}</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors text-sm font-medium"
            >
              Team
            </button>
            <Link to="/projects" className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors text-sm font-medium">Back to Projects</Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm text-sm"
            >
              <AddIcon />
              Create Issue
            </button>
          </div>
        </div>
      </header>
      <main className="p-4 sm:p-6 container mx-auto">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Filter by:</span>
            <div className="flex items-center gap-2">
              <label htmlFor="priority-filter" className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Priority</label>
              <select
                id="priority-filter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent p-2 text-neutral-900 dark:text-neutral-100"
              >
                <option value="All">All</option>
                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="assignee-filter" className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Assignee</label>
              <select
                id="assignee-filter"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent p-2 text-neutral-900 dark:text-neutral-100"
              >
                {uniqueAssignees.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="tag-filter" className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Tag</label>
              <select
                id="tag-filter"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent p-2 text-neutral-900 dark:text-neutral-100"
              >
                <option value="All">All</option>
                {availableTags.map(tag => <option key={tag.name} value={tag.name}>{tag.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">View:</span>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-primary-600 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600'}`}
              title="Kanban View"
            >
              <KanbanIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600'}`}
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
        teamMembers={project?.members || []}
        currentUser={currentUser}
      />
      {project && (
        <TeamModal
          project={project}
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          onUpdate={handleTeamUpdate}
        />
      )}
    </div>
  );
};

export default ProjectBoardPage;