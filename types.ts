export enum Status {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  READY_FOR_TEST = 'READY_FOR_TEST',
  DONE = 'DONE',
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  HIGHEST = 'Highest',
}

export enum IssueType {
  BUG = 'Bug',
  TASK = 'Task',
  FEATURE = 'Feature',
  IMPROVEMENT = 'Improvement',
  QUESTION = 'Question',
}

export enum Role {
  ADMIN = 'Admin',
  MEMBER = 'Member',
  VIEWER = 'Viewer',
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface TeamMember {
  user: User;
  role: Role;
  joinedAt: string;
}

export interface Tag {
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  text: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  timestamp: string;
}

export interface Attachment {
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Issue {
  id: string;
  title: string;
  type: IssueType;
  description: string;
  priority: Priority;
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string;
  } | null;
  assigneeId?: string | null;
  status: Status;
  startDate?: string;
  endDate?: string;
  updatedAt: string;
  comments?: Comment[];
  dependencies?: string[];
  tags?: Tag[];
  attachments?: Attachment[];
}

export interface ColumnData {
  id: Status;
  title: string;
  issues: Issue[];
}

export interface IssueTemplate {
  name: string;
  title?: string;
  type?: IssueType;
  description?: string;
  priority?: Priority;
  tags?: Tag[];
}

export type SortConfig = {
  key: keyof Issue;
  direction: 'ascending' | 'descending';
} | null;

// Project management types
export enum ProjectStatus {
  ACTIVE = 'Active',
  PAUSED = 'Paused',
  ARCHIVED = 'Archived',
}

export interface ProjectConfig {
  // Flexible configuration options per project
  [key: string]: unknown;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  requiresAuth?: boolean;
  createdAt: string;
  updatedAt?: string;
  attachments?: Attachment[];
  config?: ProjectConfig;
  members?: TeamMember[];
  issues?: Issue[];
}