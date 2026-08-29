/**
 * SkillGraph seed script
 *
 * Standalone, idempotent (re-runnable) loader that wipes the database and
 * repopulates it with realistic data matching the codebase data model:
 *
 *   (:Developer)-[:HAS_SKILL {proficiency, yearsUsed}]->(:Skill)
 *   (:Developer)-[:WORKED_ON {role, startDate, endDate}]->(:Project)
 *   (:Project)-[:USES_SKILL]->(:Skill)
 *   (:Project)-[:BUILT_FOR]->(:Company)
 *
 * Run: npm run seed
 */
import 'dotenv/config';
import { faker } from '@faker-js/faker';
import neo4j, { Driver } from 'neo4j-driver';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const URI = process.env.COGNODB_URI ?? '';
const USER = process.env.COGNODB_USER ?? '';
const PASSWORD = process.env.COGNODB_PASSWORD ?? '';

const DEVELOPER_COUNT = 60;
const COMPANY_COUNT = 18;
const PROJECT_COUNT = 120;
const TEAM_MIN = 2;
const TEAM_MAX = 5;
const PROJECT_SKILLS_MIN = 3;
const PROJECT_SKILLS_MAX = 8;

// ---------------------------------------------------------------------------
// Hand-curated skill list and categories (a real tech landscape)
// ---------------------------------------------------------------------------
interface SkillDef {
  name: string;
  category: string;
}

const SKILLS: SkillDef[] = [
  // Languages
  { name: 'TypeScript', category: 'Language' },
  { name: 'JavaScript', category: 'Language' },
  { name: 'Python', category: 'Language' },
  { name: 'Go', category: 'Language' },
  { name: 'Rust', category: 'Language' },
  { name: 'Java', category: 'Language' },
  { name: 'Kotlin', category: 'Language' },
  { name: 'Swift', category: 'Language' },
  // Frameworks / backend
  { name: 'NestJS', category: 'Backend' },
  { name: 'Express', category: 'Backend' },
  { name: 'FastAPI', category: 'Backend' },
  { name: 'Spring Boot', category: 'Backend' },
  // Frameworks / frontend
  { name: 'React', category: 'Frontend' },
  { name: 'React Native', category: 'Frontend' },
  { name: 'Next.js', category: 'Frontend' },
  { name: 'Vue.js', category: 'Frontend' },
  { name: 'Angular', category: 'Frontend' },
  // Data stores
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'MySQL', category: 'Database' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'Redis', category: 'Database' },
  { name: 'Elasticsearch', category: 'Database' },
  // APIs / integration
  { name: 'GraphQL', category: 'API' },
  { name: 'REST', category: 'API' },
  { name: 'gRPC', category: 'API' },
  // Cloud / infra
  { name: 'AWS S3', category: 'Cloud' },
  { name: 'AWS SNS', category: 'Cloud' },
  { name: 'AWS Lambda', category: 'Cloud' },
  { name: 'GCP', category: 'Cloud' },
  { name: 'Azure', category: 'Cloud' },
  { name: 'Docker', category: 'Cloud' },
  { name: 'Kubernetes', category: 'Cloud' },
  { name: 'Terraform', category: 'Cloud' },
  // Data / ML
  { name: 'Apache Kafka', category: 'Data Engineering' },
  { name: 'Apache Spark', category: 'Data Engineering' },
  { name: 'TensorFlow', category: 'Data Engineering' },
  // Misc
  { name: 'CI/CD', category: 'DevOps' },
  { name: 'Jest', category: 'Testing' },
  { name: 'Cypress', category: 'Testing' },
];

const SKILL_NAME_TO_CATEGORY = new Map(SKILLS.map((s) => [s.name, s.category]));

// Non-overlapping clusters of "core" skills so developers form meaningful
// communities (backend, frontend, mobile, data, infra).
const CORE_CLUSTERS: string[][] = [
  ['TypeScript', 'NestJS', 'PostgreSQL'],
  ['TypeScript', 'Express', 'MongoDB'],
  ['TypeScript', 'React', 'Next.js'],
  ['Python', 'FastAPI', 'PostgreSQL'],
  ['Python', 'TensorFlow', 'MongoDB'],
  ['Java', 'Spring Boot', 'PostgreSQL'],
  ['TypeScript', 'React Native', 'GraphQL'],
  ['Go', 'gRPC', 'Kubernetes'],
  ['Rust', 'Docker', 'PostgreSQL'],
  ['Kotlin', 'Spring Boot', 'MySQL'],
];

const SECONDARY_SKILL_POOL = [
  'JavaScript',
  'REST',
  'GraphQL',
  'Redis',
  'Docker',
  'AWS S3',
  'AWS SNS',
  'AWS Lambda',
  'Jest',
  'CI/CD',
  'Kubernetes',
  'MySQL',
  'Vue.js',
];

const TITLES = [
  'Full-Stack Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Mobile Engineer',
  'Data Engineer',
  'ML Engineer',
  'Platform Engineer',
  'DevOps Engineer',
  'Staff Engineer',
  'Tech Lead',
  'Senior Software Engineer',
  'Software Architect',
];

const CITIES = [
  'San Francisco',
  'New York',
  'London',
  'Berlin',
  'Toronto',
  'Austin',
  'Singapore',
  'Amsterdam',
  'Stockholm',
  'Remote',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function weightedSample<T>(arr: T[], n: number): T[] {
  // Bias toward elements near the front of the array when shrinking the pool.
  return sample(arr, Math.min(n, arr.length));
}

// ---------------------------------------------------------------------------
// Data generation
// ---------------------------------------------------------------------------
interface GeneratedDeveloper {
  id: string;
  name: string;
  title: string;
  location: string;
  yearsExperience: number;
  bio: string;
  skills: { name: string; category: string; proficiency: number; yearsUsed: number }[];
}

interface GeneratedCompany {
  id: string;
  name: string;
  industry: string;
  location: string;
}

interface GeneratedProject {
  id: string;
  name: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  companyId: string;
  skillIds: string[];
  developerIds: { id: string; role: string }[];
}

function generateData() {
  const developers: GeneratedDeveloper[] = [];
  const usedDevIds = new Set<string>();

  for (let i = 0; i < DEVELOPER_COUNT; i++) {
    let devId: string;
    do {
      devId = faker.string.alphanumeric(8);
    } while (usedDevIds.has(devId));
    usedDevIds.add(devId);

    // Weighted skill distribution: pick a core cluster, then add some
    // secondary skills so every developer batches into a community.
    const core = pick(CORE_CLUSTERS);
    const secondaryCount = randInt(2, 4);
    const secondary = weightedSample(
      SECONDARY_SKILL_POOL.filter((s) => !core.includes(s)),
      secondaryCount,
    );

    const skillNames = [...core, ...secondary];
    const skills = skillNames.map((name) => ({
      name,
      category: SKILL_NAME_TO_CATEGORY.get(name) ?? 'General',
      proficiency: randInt(4, 9),
      yearsUsed: randInt(1, 12),
    }));

    developers.push({
      id: devId,
      name: faker.person.fullName(),
      title: pick(TITLES),
      location: pick(CITIES),
      yearsExperience: randInt(1, 25),
      bio: faker.person.bio(),
      skills,
    });
  }

  const companies: GeneratedCompany[] = [];
  const usedCompanyIds = new Set<string>();
  for (let i = 0; i < COMPANY_COUNT; i++) {
    let companyId: string;
    do {
      companyId = faker.string.alphanumeric(8);
    } while (usedCompanyIds.has(companyId));
    usedCompanyIds.add(companyId);
    companies.push({
      id: companyId,
      name: faker.company.name(),
      industry: faker.company.buzzNoun(),
      location: pick(CITIES),
    });
  }

  const allSkillNames = developers.flatMap((d) => d.skills.map((s) => s.name));
  const usedProjectIds = new Set<string>();
  const usedProjectNames = new Set<string>();
  const projects: GeneratedProject[] = [];

  for (let i = 0; i < PROJECT_COUNT; i++) {
    let projectId: string;
    do {
      projectId = faker.string.alphanumeric(8);
    } while (usedProjectIds.has(projectId));
    usedProjectIds.add(projectId);

    let projectName: string;
    do {
      projectName = faker.commerce.productName();
    } while (usedProjectNames.has(projectName));
    usedProjectNames.add(projectName);

    const companyId = pick(companies).id;

    // Assemble a team of 2-5 developers.
    const team = sample(developers, randInt(TEAM_MIN, TEAM_MAX));
    const developerIds = team.map((d) => ({ id: d.id, role: pick(['Backend', 'Frontend', 'Full-Stack', 'Mobile', 'Data', 'DevOps', 'Lead']) }));

    // USES_SKILL drawn preferentially FROM the assigned developers' skills
    // so the graph is internally consistent (a project uses the skills its
    // team actually has).
    const teamSkillPool = [
      ...new Set(team.flatMap((d) => d.skills.map((s) => s.name))),
    ];
    const skillCount = randInt(PROJECT_SKILLS_MIN, PROJECT_SKILLS_MAX);
    let projectSkillNames: string[];
    if (teamSkillPool.length >= skillCount) {
      projectSkillNames = sample(teamSkillPool, skillCount);
    } else {
      projectSkillNames = [...teamSkillPool];
      const need = skillCount - teamSkillPool.length;
      projectSkillNames.push(...weightedSample(allSkillNames.filter((n) => !projectSkillNames.includes(n)), need));
    }
    const skillIds = [...new Set(projectSkillNames)];

    const startDate = faker.date.past({ years: 6 });
    const endDate = Math.random() < 0.6 ? faker.date.between({ from: startDate, to: new Date() }) : null;

    projects.push({
      id: projectId,
      name: projectName,
      description: faker.commerce.productDescription(),
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate ? endDate.toISOString().slice(0, 10) : null,
      companyId,
      skillIds,
      developerIds,
    });
  }

  return { developers, companies, projects };
}

// ---------------------------------------------------------------------------
// Constraint / index creation (mirrors cypher/schema.cypher)
// ---------------------------------------------------------------------------
const SCHEMA_STATEMENTS = [
  'CREATE CONSTRAINT developer_id IF NOT EXISTS FOR (d:Developer) REQUIRE d.id IS UNIQUE',
  'CREATE CONSTRAINT skill_id IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE',
  'CREATE CONSTRAINT project_id IF NOT EXISTS FOR (p:Project) REQUIRE p.id IS UNIQUE',
  'CREATE CONSTRAINT company_id IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE',
  'CREATE INDEX skill_name IF NOT EXISTS FOR (s:Skill) ON (s.name)',
  'CREATE INDEX developer_name IF NOT EXISTS FOR (d:Developer) ON (d.name)',
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (!URI || !USER || !PASSWORD) {
    throw new Error('COGNODB_URI / COGNODB_USER / COGNODB_PASSWORD must be set in .env');
  }

  const driver: Driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
  const session = driver.session();

  try {
    console.log('Generating seed data...');
    const { developers, companies, projects } = generateData();
    console.log(
      `  ${developers.length} developers, ${companies.length} companies, ${projects.length} projects`,
    );

    console.log('Ensuring constraints & indexes...');
    for (const statement of SCHEMA_STATEMENTS) {
      await session.run(statement);
    }
    console.log('  schema ready');

    console.log('Wiping existing data...');
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('  cleared');

    // Developers
    await session.run(
      `
      UNWIND $developers AS dev
      CREATE (d:Developer {
        id: dev.id, name: dev.name, title: dev.title,
        location: dev.location, yearsExperience: dev.yearsExperience,
        bio: dev.bio
      })
      `,
      { developers },
    );
    console.log(`  + ${developers.length} developers`);

    // Skills + HAS_SKILL edges from developers (batch, single UNWIND)
    const skillRecords = developers.flatMap((d) => d.skills.map((s) => ({ devId: d.id, ...s })));
    await session.run(
      `
      UNWIND $rows AS row
      MERGE (s:Skill {id: row.name})
        ON CREATE SET s.name = row.name, s.category = row.category
      WITH row, s
      MATCH (d:Developer {id: row.devId})
      MERGE (d)-[hs:HAS_SKILL]->(s)
      SET hs.proficiency = row.proficiency, hs.yearsUsed = row.yearsUsed
      `,
      { rows: skillRecords },
    );
    console.log(`  + ${skillRecords.length} HAS_SKILL edges`);

    // Companies
    await session.run(
      `
      UNWIND $companies AS c
      CREATE (co:Company {id: c.id, name: c.name, industry: c.industry, location: c.location})
      `,
      { companies },
    );
    console.log(`  + ${companies.length} companies`);

    // Projects + BUILT_FOR
    await session.run(
      `
      UNWIND $projects AS p
      CREATE (pr:Project {
        id: p.id, name: p.name, description: p.description,
        startDate: p.startDate, endDate: p.endDate
      })
      WITH pr, p
      MATCH (c:Company {id: p.companyId})
      MERGE (pr)-[:BUILT_FOR]->(c)
      `,
      { projects },
    );
    console.log(`  + ${projects.length} projects (+BUILT_FOR)`);

    // USES_SKILL edges from projects
    const usesSkillRecords = projects.flatMap((p) => p.skillIds.map((skillName) => ({ projectId: p.id, skillName })));
    await session.run(
      `
      UNWIND $rows AS row
      MATCH (pr:Project {id: row.projectId})
      MATCH (s:Skill {id: row.skillName})
      MERGE (pr)-[:USES_SKILL]->(s)
      `,
      { rows: usesSkillRecords },
    );
    console.log(`  + ${usesSkillRecords.length} USES_SKILL edges`);

    // WORKED_ON edges
    const workedOnRecords = projects.flatMap((p) =>
      p.developerIds.map(({ id, role }) => ({ projectId: p.id, devId: id, role })),
    );
    await session.run(
      `
      UNWIND $rows AS row
      MATCH (d:Developer {id: row.devId})
      MATCH (pr:Project {id: row.projectId})
      MERGE (d)-[wo:WORKED_ON]->(pr)
      SET wo.role = row.role
      `,
      { rows: workedOnRecords },
    );
    console.log(`  + ${workedOnRecords.length} WORKED_ON edges`);

    // Final summary
    console.log('\n=== Node counts by label ===');
    const nodeRows = await session.run(`
      MATCH (n) RETURN labels(n)[0] AS label, count(*) AS count ORDER BY label
    `);
    for (const row of nodeRows.records) {
      console.log(`  ${String(row.get('label')).padEnd(12)} ${String(row.get('count'))}`);
    }

    console.log('\n=== Relationship counts by type ===');
    const relRows = await session.run(`
      MATCH ()-[r]->() RETURN type(r) AS type, count(*) AS count ORDER BY type
    `);
    for (const row of relRows.records) {
      console.log(`  ${String(row.get('type')).padEnd(12)} ${String(row.get('count'))}`);
    }

    console.log('\nSeed complete.');
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
