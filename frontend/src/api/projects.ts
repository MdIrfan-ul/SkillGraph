import { request, type QueryParams } from './client';
import type { ProjectSummary } from './types';

export function listProjects(params?: QueryParams): Promise<{
  count: number;
  items: ProjectSummary[];
}> {
  return request<{ count: number; items: ProjectSummary[] }>('/projects', params);
}