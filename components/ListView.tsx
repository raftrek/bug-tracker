import React, { useState, useMemo } from 'react';
import { IssueRow } from './IssueRow';
import { ArrowUpIcon, ArrowDownIcon } from './icons';
import type { Issue, Tag, SortConfig } from '../types';

interface ListViewProps {
  issues: Issue[];
  onUpdateIssue: (issueId: string, updatedValues: Partial<Omit<Issue, 'id'>>) => void;
  allIssues: Issue[];
  allTags: Tag[];
}

export const ListView: React.FC<ListViewProps> = ({ issues, onUpdateIssue, allIssues, allTags }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const sortedIssues = useMemo(() => {
    let sortableIssues = [...issues];
    if (sortConfig !== null) {
      sortableIssues.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableIssues;
  }, [issues, sortConfig]);

  const requestSort = (key: keyof Issue) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader: React.FC<{ sortKey: keyof Issue; children: React.ReactNode }> = ({ sortKey, children }) => {
    const isSorted = sortConfig?.key === sortKey;
    const direction = sortConfig?.direction;
    return (
      <th
        className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer select-none hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
        onClick={() => requestSort(sortKey)}
      >
        <div className="flex items-center gap-2">
          {children}
          {isSorted && (
            direction === 'ascending' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
        <thead className="bg-neutral-50 dark:bg-neutral-900/50">
          <tr>
            <SortableHeader sortKey="title">Title</SortableHeader>
            <SortableHeader sortKey="status">Status</SortableHeader>
            <SortableHeader sortKey="priority">Priority</SortableHeader>
            <SortableHeader sortKey="assignee">Assignee</SortableHeader>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Tags</th>
            <SortableHeader sortKey="updatedAt">Last Updated</SortableHeader>
            <th className="relative px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
          {sortedIssues.map(issue => (
            <IssueRow
              key={issue.id}
              issue={issue}
              onUpdateIssue={onUpdateIssue}
              allIssues={allIssues}
              allTags={allTags}
            />
          ))}
          {sortedIssues.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-10 text-neutral-500 dark:text-neutral-400">
                No issues match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};