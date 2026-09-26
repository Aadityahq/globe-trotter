import { execSync } from 'node:child_process';
import { Client } from 'pg';

const runMigrations = () => {
  execSync('pnpm exec drizzle-kit migrate', {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.TEST_DATABASE_URL,
    },
  });
};

const client = new Client({
  connectionString: process.env.TEST_DATABASE_URL,
});

beforeAll(async () => {
  runMigrations();
  await client.connect();
});

it('should apply all database migrations', async () => {
  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  `);

  const tableNames = result.rows.map((row) => row.table_name);

  expect(tableNames).toEqual(
    expect.arrayContaining([
      'users',
      'modules',
      'tutorials',
      'labs',
      'user_progress',
    ]),
  );
});

afterAll(async () => {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;

  if (!testDatabaseUrl) {
    throw new Error('TEST_DATABASE_URL is required for database tests');
  }

  const url = new URL(testDatabaseUrl);
  const dbName = url.pathname.replace(/^\//, '');

  if (!dbName.includes('test')) {
    throw new Error(
      `I refuse to run a destructive clean-up against a non-test database! DB name: ${dbName}`,
    );
  }

  await client.query('DROP SCHEMA public CASCADE');
  await client.query('DROP SCHEMA drizzle CASCADE');
  await client.query('CREATE SCHEMA public');
  await client.end();
});