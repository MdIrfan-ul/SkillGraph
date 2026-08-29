import { Injectable, NotFoundException } from '@nestjs/common';
import { Neo4jService } from '../database/neo4j.service';
import { toNumber } from '../utils/int.util';
import { ListProjectsDto } from './dto/list-projects.dto';

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  company: string | null;
  developerCount: number;
}

export interface ProjectProfile extends ProjectSummary {
  skills: Array<{ name: string; category: string | null }>;
  developers: Array<{ name: string; role: string | null }>;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async findAll(query: ListProjectsDto): Promise<{ items: ProjectSummary[]; count: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const countCypher = `MATCH (p:Project) RETURN count(p) AS count`;

    const listCypher = `
      MATCH (p:Project)
      OPTIONAL MATCH (p)<-[:WORKED_ON]-(d:Developer)
      OPTIONAL MATCH (p)-[:BUILT_FOR]->(c:Company)
      RETURN p.id AS id, p.name AS name, p.description AS description,
             toString(p.startDate) AS startDate, toString(p.endDate) AS endDate,
             c.name AS company,
             count(DISTINCT d) AS developerCount
      ORDER BY p.startDate DESC, p.name
      SKIP $skip LIMIT $limit
    `;

    const [countRows, listRows] = await Promise.all([
      this.neo4jService.runQuery(countCypher),
      this.neo4jService.runQuery(listCypher, { skip, limit }),
    ]);

    return {
      count: countRows.length ? toNumber(countRows[0].count) ?? 0 : 0,
      items: listRows.map((row) => this.toSummary(row)),
    };
  }

  async findById(id: string): Promise<ProjectProfile> {
    const cypher = `
      MATCH (p:Project {id: $id})
      OPTIONAL MATCH (p)-[:USES_SKILL]->(s:Skill)
      OPTIONAL MATCH (d:Developer)-[wo:WORKED_ON]->(p)
      OPTIONAL MATCH (p)-[:BUILT_FOR]->(c:Company)
      RETURN p.id AS id, p.name AS name, p.description AS description,
             toString(p.startDate) AS startDate, toString(p.endDate) AS endDate,
             c.name AS company,
             collect(DISTINCT {name: coalesce(s.name, ''), category: coalesce(s.category, '')}) AS skills,
             collect(DISTINCT {name: coalesce(d.name, ''), role: coalesce(wo.role, '')}) AS developers
    `;

    const rows = await this.neo4jService.runQuery(cypher, { id });
    const row = rows[0];
    if (!row || row.id == null) {
      throw new NotFoundException(`Project with id "${id}" not found`);
    }

    return {
      id: String(row.id),
      name: String(row.name),
      description: (row.description as string) ?? null,
      startDate: (row.startDate as string) ?? null,
      endDate: (row.endDate as string) ?? null,
      company: (row.company as string) ?? null,
      developerCount: 0,
      skills: (row.skills as Record<string, unknown>[]).map((s) => ({
        name: String(s.name),
        category: String(s.category ?? ''),
      })),
      developers: (row.developers as Record<string, unknown>[]).map((dev) => ({
        name: String(dev.name),
        role: String(dev.role ?? ''),
      })),
    };
  }

  private toSummary(row: Record<string, unknown>): ProjectSummary {
    return {
      id: String(row.id),
      name: String(row.name),
      description: (row.description as string) ?? null,
      startDate: (row.startDate as string) ?? null,
      endDate: (row.endDate as string) ?? null,
      company: (row.company as string) ?? null,
      developerCount: toNumber(row.developerCount) ?? 0,
    };
  }
}