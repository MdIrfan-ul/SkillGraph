export interface DeveloperSummary {
  id: string;
  name: string;
  title: string | null;
  location: string | null;
  yearsExperience: number | null;
}

export interface DeveloperListResponse {
  count: number;
  items: DeveloperSummary[];
}

export interface DeveloperSkill {
  name: string;
  category: string;
  proficiency: string;
  yearsUsed: number | null;
}

export interface DeveloperProject {
  name: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
}

export interface DeveloperProfile extends DeveloperSummary {
  bio: string | null;
  skills: DeveloperSkill[];
  projects: DeveloperProject[];
}

export interface NetworkMatch {
  id: string;
  name: string;
  title: string | null;
  location: string | null;
  distance: number;
  degreesOfSeparation: number;
  sharedProjects: string[];
}

export interface SimilarDeveloper {
  id: string;
  name: string;
  title: string | null;
  location: string | null;
  sharedSkills: number;
}

export interface SkillSummary {
  name: string;
  category: string | null;
  developerCount: number;
  projectCount: number;
}

export interface SkillDeveloperRef {
  id: string;
  name: string;
  title: string | null;
  proficiency: string | null;
  yearsUsed: number | null;
}

export interface SkillDetail {
  name: string;
  category: string | null;
  developers: SkillDeveloperRef[];
}

export interface PathNode {
  label: string;
  id: string;
  name: string;
}

export interface PathRelationship {
  type: string;
  start: string;
  end: string;
}

export interface CollaborationPath {
  found: boolean;
  hops: number;
  nodes: PathNode[];
  relationships: PathRelationship[];
}

export interface SkillAffinityPair {
  skillA: string;
  skillB: string;
  coOccurrences: number;
}

export interface TeamMemberCandidate {
  id: string;
  name: string;
  coverage: number;
  coveredSkills: string[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  company: string | null;
  developerCount: number;
}