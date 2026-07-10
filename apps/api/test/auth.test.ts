import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { unlinkSync, existsSync } from 'node:fs';

process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-please-ignore';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-please-ignore';
process.env.COOKIE_SECRET ??= 'test-cookie-secret-please-ignore';
process.env.DB_PATH = './data/test-vocab.db';
process.env.NODE_ENV = 'test';

const dbFile = './data/test-vocab.db';
for (const suffix of ['', '-wal', '-shm']) {
  if (existsSync(dbFile + suffix)) unlinkSync(dbFile + suffix);
}

let lastVerificationEmail: { to: string; token: string } | null = null;
vi.mock('../src/modules/auth/email.service.js', () => ({
  sendVerificationEmail: async (to: string, token: string) => {
    lastVerificationEmail = { to, token };
  },
}));

const { buildApp } = await import('../src/app.js');
const { db } = await import('../src/db/client.js');
const { migrate } = await import('drizzle-orm/better-sqlite3/migrator');

migrate(db, { migrationsFolder: './drizzle' });

let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
  app = buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

const credentials = { email: 'learner@example.com', password: 'correcthorsebattery' };

describe('registration and email verification', () => {
  it('registers without logging the user in', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/register', payload: credentials });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.user.email).toBe(credentials.email);
    expect(body.accessToken).toBeUndefined();
    expect(lastVerificationEmail?.to).toBe(credentials.email);
    expect(lastVerificationEmail?.token).toBeTruthy();
  });

  it('rejects duplicate registration', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/register', payload: credentials });
    expect(res.statusCode).toBe(409);
  });

  it('blocks login before the email is verified', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: credentials });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('rejects an invalid verification token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-email',
      payload: { token: 'not-a-real-token' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('verifies the email and logs the user in', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-email',
      payload: { token: lastVerificationEmail!.token },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.email).toBe(credentials.email);
    expect(body.accessToken).toBeTruthy();
  });

  it('rejects reusing the same verification token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-email',
      payload: { token: lastVerificationEmail!.token },
    });
    expect(res.statusCode).toBe(400);
  });

  it('can now log in normally', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: credentials });
    expect(res.statusCode).toBe(200);
  });

  it('resend-verification is a no-op for an already-verified account, but always responds ok', async () => {
    lastVerificationEmail = null;
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/resend-verification',
      payload: { email: credentials.email },
    });
    expect(res.statusCode).toBe(200);
    expect(lastVerificationEmail).toBeNull();
  });

  it('resend-verification responds ok even for an unknown email (no enumeration)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/resend-verification',
      payload: { email: 'nobody@example.com' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('resends a working token for an unverified account', async () => {
    const unverified = { email: 'pending@example.com', password: 'correcthorsebattery' };
    await app.inject({ method: 'POST', url: '/api/auth/register', payload: unverified });
    lastVerificationEmail = null;

    const resend = await app.inject({
      method: 'POST',
      url: '/api/auth/resend-verification',
      payload: { email: unverified.email },
    });
    expect(resend.statusCode).toBe(200);
    expect(lastVerificationEmail?.to).toBe(unverified.email);

    const verify = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-email',
      payload: { token: lastVerificationEmail!.token },
    });
    expect(verify.statusCode).toBe(200);
  });
});

describe('auth + progress lifecycle', () => {
  let accessToken: string;
  let refreshCookie: string;

  it('logs in with correct credentials', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: credentials });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    accessToken = body.accessToken;
    refreshCookie = res.cookies.find((c) => c.name === 'refreshToken')!.value;
  });

  it('rejects login with the wrong password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { ...credentials, password: 'wrong' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('fetches the current user with the access token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().email).toBe(credentials.email);
  });

  it('rejects requests without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/me' });
    expect(res.statusCode).toBe(401);
  });

  it('rotates the refresh token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      cookies: { refreshToken: refreshCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().accessToken).toBeTruthy();
    const oldCookie = refreshCookie;
    refreshCookie = res.cookies.find((c) => c.name === 'refreshToken')!.value;

    // the old (now-revoked) token must not work again
    const replay = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      cookies: { refreshToken: oldCookie },
    });
    expect(replay.statusCode).toBe(401);
  });

  it('round-trips the progress blob', async () => {
    const getEmpty = await app.inject({
      method: 'GET',
      url: '/api/progress',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(getEmpty.json()).toEqual({ doneDays: {}, wordStatus: {}, testScores: {} });

    const payload = { doneDays: { '1': true }, wordStatus: { '1_0': 'known' }, testScores: {} };
    const put = await app.inject({
      method: 'PUT',
      url: '/api/progress',
      headers: { authorization: `Bearer ${accessToken}` },
      payload,
    });
    expect(put.statusCode).toBe(200);

    const getFilled = await app.inject({
      method: 'GET',
      url: '/api/progress',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(getFilled.json()).toEqual(payload);
  });

  it('records a quiz result and marks the test day done', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/progress/quiz-result',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { testDay: 7, score: 18, total: 20 },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.testScores['7']).toEqual({ score: 18, total: 20 });
    expect(body.doneDays['7']).toBe(true);
  });

  it('logs out and revokes the refresh token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      cookies: { refreshToken: refreshCookie },
    });
    expect(res.statusCode).toBe(204);

    const replay = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      cookies: { refreshToken: refreshCookie },
    });
    expect(replay.statusCode).toBe(401);
  });
});
