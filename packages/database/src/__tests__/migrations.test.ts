import { execSync } from 'node:child_process';
import { Client } from 'pg';

const runMigrations = () => {
  execSync('NODE_ENV=test pnpm exec drizzle-kit migrate', {
    cwd: process.cwd(),
    stdio: 'inherit',
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
  await client.query('DROP SCHEMA public CASCADE');
  await client.query('DROP SCHEMA drizzle CASCADE');
  await client.query('CREATE SCHEMA public');
  await client.end();
});