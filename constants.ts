import { Issue, Status, Priority, Tag, IssueTemplate, IssueType } from './types';

export const ALL_TAGS: Tag[] = [
  { name: 'Bug', color: 'bg-red-200 text-red-800' },
  { name: 'Feature', color: 'bg-blue-200 text-blue-800' },
  { name: 'UI', color: 'bg-purple-200 text-purple-800' },
  { name: 'Backend', color: 'bg-gray-200 text-gray-800' },
  { name: 'Refactor', color: 'bg-yellow-200 text-yellow-800' },
  { name: 'Urgent', color: 'bg-pink-200 text-pink-800' },
  { name: 'Documentation', color: 'bg-green-200 text-green-800' },
  { name: 'Testing', color: 'bg-indigo-200 text-indigo-800' },
];

export const INITIAL_ISSUES: Issue[] = [
  {
    id: 'TASK-1',
    title: 'Implement user authentication',
    type: IssueType.FEATURE,
    description: 'Set up JWT-based authentication for the main application API.',
    priority: Priority.HIGH,
    assignee: { id: 'u1', name: 'Alice Johnson', avatarUrl: 'https://i.pravatar.cc/150?u=AliceJohnson' },
    status: Status.TODO,
    startDate: '2023-10-01',
    endDate: '2023-10-15',
    updatedAt: '2023-10-01T10:00:00Z',
    tags: [ALL_TAGS[1], ALL_TAGS[3]],
    dependencies: [],
  },
  {
    id: 'TASK-2',
    title: 'Design the main dashboard UI',
    type: IssueType.TASK,
    description: 'Create mockups and a design system for the dashboard view.',
    priority: Priority.MEDIUM,
    assignee: { id: 'u2', name: 'Bob Williams', avatarUrl: 'https://i.pravatar.cc/150?u=BobWilliams' },
    status: Status.IN_PROGRESS,
    startDate: '2023-10-02',
    updatedAt: '2023-10-03T14:30:00Z',
    tags: [ALL_TAGS[2]],
    comments: [
      {
        id: 'comment-1',
        text: 'Initial draft is ready for review.',
        author: { name: 'Bob Williams', avatarUrl: 'https://i.pravatar.cc/150?u=BobWilliams' },
        timestamp: '2023-10-03T14:30:00Z'
      }
    ],
    attachments: [
        { name: 'dashboard-mockup-v1.png', type: 'image/png', size: 120000, url: '#' }
    ]
  },
  {
    id: 'TASK-3',
    title: 'Set up CI/CD pipeline',
    type: IssueType.TASK,
    description: 'Configure GitHub Actions for automated testing and deployment.',
    priority: Priority.HIGH,
    assignee: { id: 'u3', name: 'Charlie Brown', avatarUrl: 'https://i.pravatar.cc/150?u=CharlieBrown' },
    status: Status.READY_FOR_TEST,
    startDate: '2023-10-03',
    endDate: '2023-10-10',
    updatedAt: '2023-10-04T16:00:00Z',
    dependencies: ['TASK-1'],
    tags: [ALL_TAGS[3]]
  },
  {
    id: 'TASK-4',
    title: 'Fix login button style issue on mobile',
    type: IssueType.BUG,
    description: 'The login button is misaligned on screens smaller than 480px.',
    priority: Priority.HIGHEST,
    assignee: { id: 'u4', name: 'Diana Prince', avatarUrl: 'https://i.pravatar.cc/150?u=DianaPrince' },
    status: Status.TODO,
    startDate: '2023-10-04',
    updatedAt: '2023-10-04T15:00:00Z',
    tags: [ALL_TAGS[0], ALL_TAGS[2], ALL_TAGS[5]],
  },
  {
    id: 'TASK-5',
    title: 'Write API documentation',
    type: IssueType.TASK,
    description: 'Document all public API endpoints using Swagger/OpenAPI.',
    priority: Priority.LOW,
    assignee: { id: 'u5', name: 'Ethan Hunt', avatarUrl: 'https://i.pravatar.cc/150?u=EthanHunt' },
    status: Status.DONE,
    startDate: '2023-09-28',
    endDate: '2023-10-05',
    updatedAt: '2023-10-02T18:00:00Z',
    tags: [ALL_TAGS[6]],
  },
  {
    id: 'TASK-6',
    title: 'Refactor database service layer',
    type: IssueType.IMPROVEMENT,
    description: 'Improve performance and readability of the database query service.',
    priority: Priority.MEDIUM,
    assignee: { id: 'u1', name: 'Alice Johnson', avatarUrl: 'https://i.pravatar.cc/150?u=AliceJohnson' },
    status: Status.DONE,
    startDate: '2023-09-25',
    endDate: '2023-09-30',
    updatedAt: '2023-09-30T11:00:00Z',
    tags: [ALL_TAGS[3], ALL_TAGS[4]],
  }
];

export const ISSUE_TEMPLATES: IssueTemplate[] = [
    {
        name: 'Bug Report',
        title: 'Bug: [Short Description]',
        type: IssueType.BUG,
        description: '**Describe the bug**\nA clear and concise description of what the bug is.\n\n**To Reproduce**\nSteps to reproduce the behavior:\n1. Go to \'...\'\n2. Click on \'....\'\n3. Scroll down to \'....\'\n4. See error\n\n**Expected behavior**\nA clear and concise description of what you expected to happen.',
        priority: Priority.HIGH,
        tags: [ALL_TAGS[0]],
    },
    {
        name: 'Feature Request',
        title: 'Feature: [Short Description]',
        type: IssueType.FEATURE,
        description: '**Is your feature request related to a problem? Please describe.**\nA clear and concise description of what the problem is. Ex. I\'m always frustrated when [...]\n\n**Describe the solution you\'d like**\nA clear and concise description of what you want to happen.',
        priority: Priority.MEDIUM,
        tags: [ALL_TAGS[1]],
    },
    {
        name: 'Blank Issue',
        type: IssueType.TASK,
    },
];