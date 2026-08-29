require('dotenv').config();
const fs = require('fs');
const path = require('path');
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(process.env.COGNODB_USER, process.env.COGNODB_PASSWORD)
);

const schemaPath = path.join(__dirname, '..', 'cypher', 'schema.cypher');
const statements = fs
  .readFileSync(schemaPath, 'utf8')
  .split(/;\s*(?:\n|$)/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith('//'));

async function main() {
  const session = driver.session();
  try {
    for (const statement of statements) {
      await session.run(statement);
      console.log(`Applied: ${statement.split('\n')[0].slice(0, 90)}...`);
    }
    console.log('Schema applied.');
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error('Schema setup failed:', err.message);
  process.exit(1);
});