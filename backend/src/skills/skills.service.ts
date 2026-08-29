import { Injectable, NotFoundException } from '@nestjs/common';
import { Neo4jService } from '../database/neo4j.service';
import { toNumber } from '../utils/int.util';

export interface SkillSummary {
  name: string;
  category: string | null;
  developerCount: number;
  projectCount: number;
}

@Injectable()
export class SkillsService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async findAll(): Promise<SkillSummary[]> {
    const cypher = `
      MATCH (s:Skill)
      OPTIONAL MATCH (d:Developer)-[:HAS_SKILL]->(s)
      OPTIONAL MATCH (p:Project)-[:USES_SKILL]->(s)
      RETURN s.name AS name, s.category AS category,
             count(DISTINCT d) AS developerCount,
             count(DISTINCT p) AS projectCount
      ORDER BY developerCount DESC, s.name
    `;

    const rows = await this.neo4jService.runQuery(cypher);
    return rows.map((row) => ({
      name: String(row.name),
      category: (row.category as string) ?? null,
      developerCount: toNumber(row.developerCount) ?? 0,
      projectCount: toNumber(row.projectCount) ?? 0,
    }));
  }

  async findByName(name: string) {
    const cypher = `
      MATCH (s:Skill {name: $name})
      OPTIONAL MATCH (d:Developer)-[hs:HAS_SKILL]->(s)
      RETURN s.name AS name, s.category AS category,
             collect(DISTINCT {
               id: d.id, name: d.name, title: d.title,
               proficiency: hs.proficiency, yearsUsed: hs.yearsUsed
             }) AS developers
    `;

    const rows = await this.neo4jService.runQuery(cypher, { name });
    const row = rows[0];
    if (!row || row.name == null) {
      throw new NotFoundException(`Skill "${name}" not found`);
    }

    return {
      name: String(row.name),
      category: (row.category as string) ?? null,
      developers: (row.developers as Record<string, unknown>[])
        .filter((dev) => dev.id != null)
        .map((dev) => ({
          id: String(dev.id),
          name: String(dev.name),
          title: (dev.title as string) ?? null,
          proficiency: (dev.proficiency as string) ?? null,
          yearsUsed: toNumber(dev.yearsUsed),
        })),
    };
  }
}