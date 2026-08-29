// SkillGraph - Graph schema for CognoDB (openCypher)
//
// Data model:
//
//   (:Developer)-[:HAS_SKILL {proficiency, yearsUsed}]->(:Skill)
//   (:Developer)-[:WORKED_ON {role, startDate, endDate}]->(:Project)
//   (:Project)-[:USES_SKILL]->(:Skill)
//   (:Project)-[:BUILT_FOR]->(:Company)
//
// Note: (:Developer)-[:COLLABORATED_WITH]->(:Developer) is intentionally NOT
// stored. It is derived on the fly from shared WORKED_ON edges to avoid data
// duplication and staleness. See README for the reasoning.
//
// Diagram:
//   graph LR
//     D1((Developer)) -- HAS_SKILL --> S1((Skill))
//     D1 -- WORKED_ON --> P1((Project))
//     P1 -- USES_SKILL --> S1
//     P1 -- BUILT_FOR --> C1((Company))
//     D1 -- WORKED_ON --> P2((Project))
//     D2((Developer)) -- WORKED_ON --> P2

// Constraints
CREATE CONSTRAINT developer_id IF NOT EXISTS FOR (d:Developer) REQUIRE d.id IS UNIQUE;
CREATE CONSTRAINT skill_id IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT project_id IF NOT EXISTS FOR (p:Project) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT company_id IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE;

// Indexes
CREATE INDEX skill_name IF NOT EXISTS FOR (s:Skill) ON (s.name);
CREATE INDEX developer_name IF NOT EXISTS FOR (d:Developer) ON (d.name);