import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.API_KEY = 'test_api_key';

import { suggestAssignee, detectDuplicates, naturalLanguageSearch, chatWithProject } from './geminiService';
import { Issue, Status, Priority, IssueType, Role } from '../types';

// Mock the Gemini API
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: vi.fn().mockImplementation(async ({ contents }) => {
          // Provide mock responses based on the prompt content
          if (contents.includes('suggest the BEST member')) {
            return { text: 'user123' };
          }
          if (contents.includes('detect duplicates')) {
            return { text: '["issue1", "issue2"]' };
          }
          if (contents.includes('natural language search query')) {
            return { text: '["issue3"]' };
          }
          if (contents.includes('Answer the user\'s question')) {
            return { text: 'The project is doing well.' };
          }
          return { text: 'Mock response' };
        })
      };
    }
  };
});

describe('geminiService AI features', () => {
  const mockMembers = [
    { user: { id: 'user123', name: 'Alice', email: 'alice@test.com' }, role: Role.MEMBER, joinedAt: '' },
    { user: { id: 'user456', name: 'Bob', email: 'bob@test.com' }, role: Role.MEMBER, joinedAt: '' }
  ];

  const mockIssues: Issue[] = [
    {
      id: 'issue1', title: 'Login bug', description: 'Cannot login', status: Status.TODO, priority: Priority.HIGH, type: IssueType.BUG, updatedAt: ''
    },
    {
      id: 'issue2', title: 'Login error', description: 'Error when logging in', status: Status.IN_PROGRESS, priority: Priority.MEDIUM, type: IssueType.BUG, updatedAt: ''
    },
    {
      id: 'issue3', title: 'Add dashboard', description: 'New dashboard view', status: Status.TODO, priority: Priority.LOW, type: IssueType.FEATURE, updatedAt: ''
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('suggestAssignee should return the correct member ID', async () => {
    const assignee = await suggestAssignee('Fix login', 'Login is broken', mockMembers);
    expect(assignee).toBe('user123');
  });

  it('suggestAssignee should return null if no members', async () => {
    const assignee = await suggestAssignee('Fix login', 'Login is broken', []);
    expect(assignee).toBeNull();
  });

  it('detectDuplicates should return an array of duplicate issue IDs', async () => {
    const duplicates = await detectDuplicates('Login issue', 'Can not login', mockIssues);
    expect(duplicates).toEqual(['issue1', 'issue2']);
  });

  it('naturalLanguageSearch should return matching issue IDs', async () => {
    const results = await naturalLanguageSearch('dashboard tasks', mockIssues);
    expect(results).toEqual(['issue3']);
  });

  it('chatWithProject should return a helpful response', async () => {
    const response = await chatWithProject('How is the project?', { name: 'Test Project' });
    expect(response).toBe('The project is doing well.');
  });
});
