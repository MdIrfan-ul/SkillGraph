require('dotenv').config();
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(process.env.COGNODB_USER, process.env.COGNODB_PASSWORD)
);

async function main() {
  const session = driver.session();
  try {
    const result = await session.run('RETURN "connected" AS status');
    console.log(result.records[0].get('status'));
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch(console.error);