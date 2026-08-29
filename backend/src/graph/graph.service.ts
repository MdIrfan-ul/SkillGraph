import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../database/neo4j.service';
import { toNumber } from '../utils/int.util';

export interface SimilarDeveloper {
  id: string;
  name: string;
  title: string | null;
  location: string | null;
  sharedSkills: number;
}

export interface CollaborationPath {
  found: boolean;
  hops: number;
  nodes: Array<{ label: string; id: string; name: string }>;
  relationships: Array<{ type: string; start: string; end: string }>;
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

@Injectable()
export class GraphService {
  constructor(private readonly neo4jService: Neo4jService) {}

  /**
   * Developers who share >= minShared skills with the given developer but have
   * never worked on a project together.
   */
  async findSimilarDevelopers(devId: string, minShared = 3): Promise<SimilarDeveloper[]> {
    const cypher = `
      MATCH (d:Developer {id: $devId})-[:HAS_SKILL]->(shared:Skill)<-[:HAS_SKILL]-(other:Developer)
      WHERE other.id <> $devId
      WITH d, other, count(shared) AS sharedCount
      WHERE sharedCount >= $minShared
      OPTIONAL MATCH (d)-[:WORKED_ON]->(p:Project)<-[:WORKED_ON]-(other)
      WITH other, sharedCount, count(p) AS sharedProjectCount
      WHERE sharedProjectCount = 0
      RETURN other.id AS id, other.name AS name, other.title AS title,
             other.location AS location, sharedCount AS sharedSkills
      ORDER BY sharedSkills DESC, other.name
    `;

    const rows = await this.neo4jService.runQuery(cypher, { devId, minShared });
    return rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      title: (row.title as string) ?? null,
      location: (row.location as string) ?? null,
      sharedSkills: toNumber(row.sharedSkills) ?? 0,
    }));
  }

  /**
   * Shortest "collaboration path" between two developers - which shared
   * projects connect them (six-degrees style).
   */
  async findCollaborationPath(fromId: string, toId: string): Promise<CollaborationPath> {
    const cypher = `
      MATCH path = shortestPath(
        (a:Developer {id: $fromId})-[:WORKED_ON*1..8]-(b:Developer {id: $toId})
      )
      WHERE path IS NOT NULL
      RETURN [n IN nodes(path) | {
               label: head(labels(n)),
               id: n.id,
               name: coalesce(n.name, n.id)
             }] AS nodes,
             [r IN relationships(path) | {
               type: type(r),
               start: startNode(r).id,
               end: endNode(r).id
             }] AS relationships,
             length(path) AS hops
    `;

    const rows = await this.neo4jService.runQuery(cypher, { fromId, toId });
    const row = rows[0];
    if (!row) {
      return { found: false, hops: 0, nodes: [], relationships: [] };
    }

    return {
      found: true,
      hops: toNumber(row.hops) ?? 0,
      nodes: (row.nodes as Record<string, unknown>[]).map((n) => ({
        label: String(n.label),
        id: String(n.id),
        name: String(n.name),
      })),
      relationships: (row.relationships as Record<string, unknown>[]).map((r) => ({
        type: String(r.type),
        start: String(r.start),
        end: String(r.end),
      })),
    };
  }

  /**
   * Which skill pairs most frequently co-occur on the same project.
   */
  async findSkillAffinity(limit = 10): Promise<SkillAffinityPair[]> {
    const cypher = `
      MATCH (p:Project)-[:USES_SKILL]->(s1:Skill), (p)-[:USES_SKILL]->(s2:Skill)
      WHERE id(s1) < id(s2)
      RETURN s1.name AS skillA, s2.name AS skillB, count(p) AS coOccurrences
      ORDER BY coOccurrences DESC, skillA, skillB
      LIMIT $limit
    `;

    const rows = await this.neo4jService.runQuery(cypher, { limit });
    return rows.map((row) => ({
      skillA: String(row.skillA),
      skillB: String(row.skillB),
      coOccurrences: toNumber(row.coOccurrences) ?? 0,
    }));
  }

  /**
   * Candidate developers for staffing a new project: ranked by how many of the
   * required skills each covers (a simplified, non-optimal take on set cover —
   * per-developer, not the minimal global team).
   */
  async suggestTeam(requiredSkills: string[], limit = 10): Promise<TeamMemberCandidate[]> {
    const cypher = `
      MATCH (d:Developer)-[:HAS_SKILL]->(s:Skill)
      WHERE s.name IN $requiredSkills
      RETURN d.id AS id, d.name AS name,
             collect(DISTINCT s.name) AS coveredSkills,
             count(DISTINCT s) AS coverage
      ORDER BY coverage DESC, d.name
      LIMIT $limit
    `;

    const rows = await this.neo4jService.runQuery(cypher, { requiredSkills, limit });
    return rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      coverage: toNumber(row.coverage) ?? 0,
      coveredSkills: (row.coveredSkills as unknown[]).map(String),
    }));
  }
}