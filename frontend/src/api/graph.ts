import { request, type QueryParams } from './client';
import type {
  CollaborationPath,
  SimilarDeveloper,
  SkillAffinityPair,
  TeamMemberCandidate,
} from './types';

export function sharedSkills(devId: string, minShared = 3): Promise<SimilarDeveloper[]> {
  return request<SimilarDeveloper[]>('/graph/shared-skills', { devId, minShared });
}

export function collaborationPath(fromId: string, toId: string): Promise<CollaborationPath> {
  return request<CollaborationPath>('/graph/collaboration-path', { fromId, toId });
}

export function skillAffinity(
  params?: Pick<QueryParams, 'limit'>,
): Promise<SkillAffinityPair[]> {
  return request<SkillAffinityPair[]>('/graph/skill-affinity', params);
}

export function teamSuggestion(
  requiredSkills: string[],
  params?: Pick<QueryParams, 'limit'>,
): Promise<TeamMemberCandidate[]> {
  return request<TeamMemberCandidate[]>('/graph/team-suggestion', {
    requiredSkills,
    ...params,
  });
}