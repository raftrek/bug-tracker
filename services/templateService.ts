import type { IssueTemplate } from '../types';

const TEMPLATES_KEY = 'bt_issue_templates';

function readCustomTemplates(): IssueTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCustomTemplates(templates: IssueTemplate[]): void {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export function getCustomTemplates(): IssueTemplate[] {
  return readCustomTemplates();
}

export function getAllTemplates(baseTemplates: IssueTemplate[]): IssueTemplate[] {
  const custom = readCustomTemplates();
  const byName = new Map<string, IssueTemplate>();
  [...baseTemplates, ...custom].forEach(t => {
    if (!byName.has(t.name)) byName.set(t.name, t);
  });
  return Array.from(byName.values());
}

export function saveCustomTemplate(template: IssueTemplate): void {
  const existing = readCustomTemplates();
  const filtered = existing.filter(t => t.name !== template.name);
  filtered.push(template);
  writeCustomTemplates(filtered);
}

export function deleteCustomTemplate(name: string): void {
  const existing = readCustomTemplates();
  const filtered = existing.filter(t => t.name !== name);
  writeCustomTemplates(filtered);
}