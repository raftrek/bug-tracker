import api from './api';
import { Project, ProjectStatus, Issue, Role } from '../types';

export async function getProjects(): Promise<Project[]> {
  const response = await api.get('/projects');
  return response.data;
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  try {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  } catch {
    return undefined;
  }
}

export async function createProject(input: {
  name: string;
  description?: string;
  status?: ProjectStatus;
  requiresAuth?: boolean;
  attachments?: Array<{ name: string; type: string; size: number; url: string }>;
  config?: Record<string, unknown>;
}): Promise<Project> {
  const response = await api.post('/projects', input);
  return response.data;
}

export async function updateProject(id: string, input: Partial<{
  name: string;
  description: string;
  status: ProjectStatus;
  requiresAuth: boolean;
  config: Record<string, unknown>;
}>): Promise<Project> {
  const response = await api.put(`/projects/${id}`, input);
  return response.data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}

export async function addMemberToProject(
  projectId: string, 
  email: string, 
  role: Role, 
  name?: string, 
  password?: string,
  bio?: string,
  avatar?: File | null
): Promise<void> {
  if (name && password) {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('role', role);
    formData.append('name', name);
    formData.append('password', password);
    if (bio) formData.append('bio', bio);
    if (avatar) formData.append('avatar', avatar);

    await api.post(`/projects/${projectId}/members`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } else {
    await api.post(`/projects/${projectId}/members`, { email, role });
  }
}

export async function removeMemberFromProject(projectId: string, userId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/members/${userId}`);
}

export async function updateMemberRole(projectId: string, userId: string, role: Role): Promise<void> {
  await api.put(`/projects/${projectId}/members/${userId}`, { role });
}

export async function createIssue(projectId: string, issue: Partial<Issue>): Promise<Issue> {
  const response = await api.post(`/projects/${projectId}/issues`, issue);
  return response.data;
}

export async function updateIssue(projectId: string, issueId: string, issue: Partial<Issue>): Promise<Issue> {
  const response = await api.put(`/projects/${projectId}/issues/${issueId}`, issue);
  return response.data;
}

export async function createComment(projectId: string, issueId: string, text: string): Promise<Comment> {
  const response = await api.post(`/projects/${projectId}/issues/${issueId}/comments`, { text });
  return response.data;
}

export async function updateComment(projectId: string, issueId: string, commentId: string, text: string): Promise<Comment> {
  const response = await api.put(`/projects/${projectId}/issues/${issueId}/comments/${commentId}`, { text });
  return response.data;
}

export async function deleteComment(projectId: string, issueId: string, commentId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/issues/${issueId}/comments/${commentId}`);
}