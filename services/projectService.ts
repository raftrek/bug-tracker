import { Project, ProjectStatus, Issue } from '../types';
import { INITIAL_ISSUES } from '../constants';

const PROJECTS_KEY = 'bt_projects';
const PROJECT_ISSUES_PREFIX = 'bt_project_issues_';
const AUTH_TOKEN_KEY = 'bt_auth_token';

function readProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

function readIssues(projectId: string): Issue[] {
  try {
    const raw = localStorage.getItem(PROJECT_ISSUES_PREFIX + projectId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeIssues(projectId: string, issues: Issue[]): void {
  localStorage.setItem(PROJECT_ISSUES_PREFIX + projectId, JSON.stringify(issues));
}

function ensureSeed(): void {
  const existing = readProjects();
  if (existing.length === 0) {
    const demo: Project = {
      id: 'demo',
      name: 'Demo Project',
      description: 'Pre-seeded project with sample issues.',
      status: ProjectStatus.ACTIVE,
      requiresAuth: false,
      createdAt: new Date().toISOString(),
    };
    writeProjects([demo]);
    writeIssues(demo.id, INITIAL_ISSUES);
  }
}

export function getProjects(): Project[] {
  ensureSeed();
  return readProjects();
}

export function getProjectById(id: string): Project | undefined {
  return getProjects().find(p => p.id === id);
}

export function getProjectIssues(id: string): Issue[] {
  return readIssues(id);
}

export function saveProjectIssues(id: string, issues: Issue[]): void {
  writeIssues(id, issues);
}

export function createProject(input: {
  name: string;
  description?: string;
  status?: ProjectStatus;
  requiresAuth?: boolean;
  attachments?: Array<{ name: string; type: string; size: number; url: string }>;
  config?: Record<string, unknown>;
}): Project {
  const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `proj_${Date.now()}`;
  const project: Project = {
    id,
    name: input.name,
    description: input.description,
    status: input.status ?? ProjectStatus.ACTIVE,
    requiresAuth: input.requiresAuth ?? false,
    createdAt: new Date().toISOString(),
    attachments: input.attachments as any,
    config: input.config,
  };
  const projects = getProjects();
  projects.push(project);
  writeProjects(projects);
  // New projects start with empty issues
  writeIssues(id, []);
  return project;
}

export function updateProjectStatus(id: string, status: ProjectStatus): void {
  const projects = getProjects().map(p => p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p);
  writeProjects(projects);
}

export function authorize(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function canAccessProject(project: Project): boolean {
  if (!project.requiresAuth) return true;
  const token = getAuthToken();
  return !!token;
}

export function deleteProject(id: string): void {
  const filtered = getProjects().filter(p => p.id !== id);
  writeProjects(filtered);
  localStorage.removeItem(PROJECT_ISSUES_PREFIX + id);
}

export function searchProjects(query: string, status?: ProjectStatus): Project[] {
  const lower = query.trim().toLowerCase();
  return getProjects().filter(p => {
    const matchesQuery = !lower || p.name.toLowerCase().includes(lower) || (p.description || '').toLowerCase().includes(lower);
    const matchesStatus = !status || p.status === status;
    return matchesQuery && matchesStatus;
  });
}