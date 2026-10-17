import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { db, sql, inArray } from '@repo/database';
import { AppModule } from '../src/app.module';
import { EmailService } from '../src/email/email.service';
import { user as userTable } from '@repo/database/src/schema';

const email = 'e2e-password-reset@example.com';
const origin = 'http://localhost:3000';
const oldPassword = 'Password123';
const newPassword = 'NewPassword456';

describe('Password reset flow (e2e)', () => {
  let app: INestApplication<App>;
  let sendResetSpy: jest.SpyInstance;
  let firstDevice: ReturnType<typeof request.agent>;
  let secondDevice: ReturnType<typeof request.agent>;
  let userId: string;
  let usedToken: string;

  const requestReset = async (): Promise<string> => {
    sendResetSpy.mockClear();

    const res = await request(app.getHttpServer() as App)
      .post('/api/auth/request-password-reset')
      .set('Origin', origin)
      .send({ email, redirectTo: `${origin}/reset-password` });
    expect(res.status).toBe(200);
    expect(sendResetSpy).toHaveBeenCalledTimes(1);

    const [, url] = sendResetSpy.mock.calls[0] as [string, string];
    const token = new URL(url).pathname.match(/^\/api\/auth\/reset-password\/([A-Za-z0-9_-]{16,})$/)?.[1];
    expect(token).toBeDefined();
    return token as string;
  };

  const resetPassword = (token: string, password: string) =>
    request(app.getHttpServer() as App)
      .post('/api/auth/reset-password')
      .set('Origin', origin)
      .send({ token, newPassword: password });

  const signIn = (agent: ReturnType<typeof request.agent>, password: string) =>
    agent.post('/api/auth/sign-in/email').set('Origin', origin).send({ email, password });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication({ bodyParser: false });
    await app.init();

    //? Better Auth holds a reference to this instance, so spying on it captures the reset link without a real email
    sendResetSpy = jest.spyOn(app.get(EmailService), 'sendPasswordResetEmail').mockResolvedValue();

    firstDevice = request.agent(app.getHttpServer() as App);
    secondDevice = request.agent(app.getHttpServer() as App);

    const signUp = await firstDevice
      .post('/api/auth/sign-up/email')
      .set('Origin', origin)
      .send({ name: 'E2E Password Reset', email, password: oldPassword });
    expect(signUp.status).toBeLessThan(400);

    await db.execute(sql`update "user" set email_verified = true where email = ${email}`);
    const rows = await db.execute(sql`select id from "user" where email = ${email}`);
    userId = (rows.rows[0] as { id: string }).id;

    // Two separate sessions, e.g. two devices
    expect((await signIn(firstDevice, oldPassword)).status).toBe(200);
    expect((await signIn(secondDevice, oldPassword)).status).toBe(200);
    await firstDevice.get('/profile').expect(200);
    await secondDevice.get('/profile').expect(200);
  });

  afterAll(async () => {
    try {
      await db.execute(sql`delete from "verification" where value = ${userId}`);
      await db.delete(userTable).where(inArray(userTable.email, [email]));
    } catch (err) {
      console.error('Failed to clean up e2e password reset user:', err);
    }
    try {
      await app.close();
    } catch (err) {
      console.error('App failed to close:', err);
    }
  });

  it('requesting a reset sends a single reset token that expires in 1 hour', async () => {
    await requestReset();

    expect(sendResetSpy).toHaveBeenCalledWith(email, expect.stringContaining('/api/auth/reset-password/'));

    const rows = await db.execute(
      sql`select extract(epoch from expires_at - created_at) as ttl from "verification" where value = ${userId} order by created_at desc limit 1`,
    );
    const ttlSeconds = Number((rows.rows[0] as { ttl: string }).ttl);
    expect(ttlSeconds).toBeGreaterThan(59 * 60);
    expect(ttlSeconds).toBeLessThanOrEqual(60 * 60 + 1);
  });

  it('rejects a new password that does not meet the password rules', async () => {
    const token = await requestReset();

    const res = await resetPassword(token, 'weakpassword');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Password must contain at least one uppercase character');
  });

  it('a valid token sets the new password and invalidates all existing sessions', async () => {
    usedToken = await requestReset();

    const res = await resetPassword(usedToken, newPassword);
    expect(res.status).toBe(200);

    await firstDevice.get('/profile').expect(401);
    await secondDevice.get('/profile').expect(401);

    const freshAgent = request.agent(app.getHttpServer() as App);
    expect((await signIn(freshAgent, oldPassword)).status).toBe(401);
    expect((await signIn(freshAgent, newPassword)).status).toBe(200);
  });

  it('rejects an already-used token', async () => {
    const res = await resetPassword(usedToken, 'AnotherPassword789');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_TOKEN');
  });

  it('rejects an expired token', async () => {
    const token = await requestReset();
    await db.execute(
      sql`update "verification" set expires_at = created_at - interval '1 minute' where value = ${userId}`,
    );

    const res = await resetPassword(token, 'AnotherPassword789');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_TOKEN');
  });
});
