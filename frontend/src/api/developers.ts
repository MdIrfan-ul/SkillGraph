import { request, type QueryParams } from './client';
import type {
  DeveloperListResponse,
  DeveloperProfile,
  NetworkMatch,
} from './types';

export function listDevelopers(params?: QueryParams): Promise<DeveloperListResponse> {
  return request<DeveloperListResponse>('/developers', params);
}

export function getDeveloper(id: string): Promise<DeveloperProfile> {
  return request<DeveloperProfile>(`/developers/${encodeURIComponent(id)}`);
}

export function getDeveloperNetwork(id: string, hops = 2): Promise<NetworkMatch[]> {
  return request<NetworkMatch[]>(`/developers/${encodeURIComponent(id)}/network`, {
    hops,
  });
}