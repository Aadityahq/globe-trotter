import { eq } from 'drizzle-orm';
import { execSync } from 'node:child_process';
import { db, closeDatabase } from '../client';
import { users, modules } from '../schema';

const runMigrations = () => {
  execSync('NODE_ENV=test pnpm exec drizzle-kit migrate', {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
};

beforeAll(() => {
  runMigrations();
});

afterAll(async () => {
  await closeDatabase();
});

describe('Database CRUD operations', () => {
    it('should insert and query a user', async () => {
    const email = `test-${Date.now()}@example.com`;

    const [user] = await db
        .insert(users)
        .values({
        email,
        passwordHash: 'test-password-hash',
        role: 'learner',
        createdAt: new Date(),
        updatedAt: new Date(),
        })
        .returning();

    if (!user) {
        throw new Error('User was not returned after insert');
    }
    expect(user.email).toBe(email);
    expect(user.role).toBe('learner');

    const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
        
    expect(result).toHaveLength(1);

    const queriedUser = result[0];
    if (!queriedUser) {
        throw new Error('User was not found after insert');
    }
    expect(queriedUser.email).toBe(email);
    });

    it('should insert and query a module', async () => {
    const email = `module-test-${Date.now()}@example.com`;

    const [user] = await db
        .insert(users)
        .values({
        email,
        passwordHash: 'test-password-hash',
        role: 'author',
        createdAt: new Date(),
        updatedAt: new Date(),
        })
        .returning();

    if (!user) {
        throw new Error('Author was not returned after insert');
    }

    const [module] = await db
        .insert(modules)
        .values({
        authorId: user.id,
        title: 'Test Module',
        description: 'Test module description',
        orderIndex: 1,
        thumbnailUrl: 'https://example.com/thumbnail.png',
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        })
        .returning();

    if (!module) {
        throw new Error('Module was not returned after insert');
    }

    expect(module.title).toBe('Test Module');
    expect(module.authorId).toBe(user.id);

    const result = await db
        .select()
        .from(modules)
        .where(eq(modules.id, module.id));

    expect(result).toHaveLength(1);

    const queriedModule = result[0];

    if (!queriedModule) {
        throw new Error('Module was not found after insert');
    }

    expect(queriedModule.title).toBe('Test Module');
    expect(queriedModule.authorId).toBe(user.id);
    });
});