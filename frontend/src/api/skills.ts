import { request } from './client';
import type { SkillDetail, SkillSummary } from './types';

export function listSkills(): Promise<SkillSummary[]> {
  return request<SkillSummary[]>('/skills');
}

export function getSkill(name: string): Promise<SkillDetail> {
  return request<SkillDetail>(`/skills/${encodeURIComponent(name)}`);
}