import { Injectable, NotFoundException } from '@nestjs/common';
import { Neo4jService } from '../database/neo4j.service';
import { toNumber } from '../utils/int.util';
import { ListDevelopersDto } from './dto/list-developers.dto';

export interface DeveloperSummary {
  id: string;
  name: string;
  title: string | null;
  location: string | null;
  yearsExperience: number | null;
}

export interface DeveloperProfile extends DeveloperSummary {
  skills: Array<{
    name: string;
    category: string | null;
    proficiency: string | null;
    yearsUsed: number | null;
  }>;
  projects: Array<{
    name: string;
    role: string | null;
    company: string | null;
    startDate: string | null;
    endDate: string | null;
  }>;
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

@Injectable()
export class DevelopersService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async findAll(query: ListDevelopersDto): Promise<{ items: DeveloperSummary[]; count: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const skill = query.skill ?? null;

    const countCypher = `
      MATCH (d:Developer)
      OPTIONAL MATCH (d)-[:HAS_SKILL]->(s:Skill)
      WITH d, collect(s.name) AS skills
      WHERE $skill IS NULL OR $skill IN skills
      RETURN count(d) AS count
    `;

    const listCypher = `
      MATCH (d:Developer)
      OPTIONAL MATCH (d)-[:HAS_SKILL]->(s:Skill)
      WITH d, collect(s.name) AS skills
      WHERE $skill IS NULL OR $skill IN skills
      RETURN d.id AS id, d.name AS name, d.title AS title, d.location AS location,
             d.yearsExperience AS yearsExperience
      ORDER BY d.name
      SKIP $skip LIMIT $limit
    `;

    const [countRows, listRows] = await Promise.all([
      this.neo4jService.runQuery(countCypher, { skill }),
      this.neo4jService.runQuery(listCypher, { skill, skip, limit }),
    ]);

    return {
      count: countRows.length ? toNumber(countRows[0].count) ?? 0 : 0,
      items: listRows.map((row) => this.toSummary(row)),
    };
  }

  async findById(id: string): Promise<DeveloperProfile> {
    const cypher = `
      MATCH (d:Developer {id: $id})
      OPTIONAL MATCH (d)-[hs:HAS_SKILL]->(s:Skill)
      OPTIONAL MATCH (d)-[wo:WORKED_ON]->(p:Project)-[:BUILT_FOR]->(c:Company)
      RETURN d.id AS id, d.name AS name, d.title AS title, d.location AS location,
             d.yearsExperience AS yearsExperience, d.bio AS bio,
             collect(DISTINCT {
               name: coalesce(s.name, ''),
               category: coalesce(s.category, ''),
               proficiency: coalesce(hs.proficiency, ''),
               yearsUsed: coalesce(hs.yearsUsed, 0)
             }) AS skills,
             collect(DISTINCT {
               name: coalesce(p.name, ''),
               role: coalesce(wo.role, ''),
               company: coalesce(c.name, ''),
               startDate: coalesce(toString(p.startDate), ''),
               endDate: coalesce(toString(p.endDate), '')
             }) AS projects
    `;

    const rows = await this.neo4jService.runQuery(cypher, { id });
    const row = rows[0];
    if (!row || row.id == null) {
      throw new NotFoundException(`Developer with id "${id}" not found`);
    }

    return {
      id: String(row.id),
      name: String(row.name),
      title: (row.title as string) ?? null,
      location: (row.location as string) ?? null,
      yearsExperience: row.yearsExperience as number | null,
      skills: (row.skills as Record<string, unknown>[]).map((s) => ({
        name: String(s.name),
        category: String(s.category ?? ''),
        proficiency: String(s.proficiency ?? ''),
        yearsUsed: toNumber(s.yearsUsed),
      })),
      projects: (row.projects as Record<string, unknown>[]).map((p) => ({
        name: String(p.name),
        role: String(p.role ?? ''),
        company: String(p.company ?? ''),
        startDate: String(p.startDate ?? ''),
        endDate: String(p.endDate ?? ''),
      })),
    };
  }

  async findNetwork(id: string, hops = 2): Promise<NetworkMatch[]> {
    const cypher = `
      MATCH (d:Developer {id: $id})
      MATCH path = shortestPath((d)-[:WORKED_ON*1..$hops]-(other:Developer))
      WHERE other.id <> $id
      OPTIONAL MATCH (d)-[:WORKED_ON]->(p:Project)<-[:WORKED_ON]-(other)
      RETURN other.id AS id, other.name AS name, other.title AS title,
             other.location AS location,
             length(path) AS distance,
             collect(p.name) AS sharedProjects
      ORDER BY distance, other.name
    `;

    const rows = await this.neo4jService.runQuery(cypher, { id, hops: Number(hops) });
    return rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      title: (row.title as string) ?? null,
      location: (row.location as string) ?? null,
      distance: toNumber(row.distance) ?? 0,
      degreesOfSeparation: Math.ceil((toNumber(row.distance) ?? 0) / 2),
      sharedProjects: (row.sharedProjects as unknown[]).map(String),
    }));
  }

  private toSummary(row: Record<string, unknown>): DeveloperSummary {
    return {
      id: String(row.id),
      name: String(row.name),
      title: (row.title as string) ?? null,
      location: (row.location as string) ?? null,
      yearsExperience: row.yearsExperience as number | null,
    };
  }
}