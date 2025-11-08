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
  assignee: {
    name: string;
    avatarUrl: string;
  };
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