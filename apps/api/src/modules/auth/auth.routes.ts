import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import {
  registerRequestSchema,
  loginRequestSchema,
  refreshRequestSchema,
  verifyEmailRequestSchema,
  resendVerificationRequestSchema,
} from '@deutsch-lernen/shared';
import { db } from '../../db/client.js';
import { users } from '../../db/schema.js';
import { config } from '../../config.js';
import { ApiError } from '../../plugins/error-handler.js';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  generateVerificationToken,
  hashToken,
} from './auth.service.js';
import { sendVerificationEmail } from './email.service.js';

const REFRESH_COOKIE = 'refreshToken';

const cookieOptions = {
  httpOnly: true,
  secure: config.COOKIE_SECURE,
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: 60 * 60 * 24 * 30,
};

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/register', async (req, reply) => {
    const body = registerRequestSchema.parse(req.body);

    const existing = await db.query.users.findFirst({ where: eq(users.email, body.email) });
    if (existing) throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists.');

    const passwordHash = await hashPassword(body.password);
    const verification = generateVerificationToken();
    const [user] = await db
      .insert(users)
      .values({
        email: body.email,
        passwordHash,
        authProvider: 'password',
        verificationTokenHash: verification.hash,
        verificationTokenExpiresAt: verification.expiresAt,
      })
      .returning();

    await sendVerificationEmail(user.email, verification.raw);

    reply.status(201).send({
      user: { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() },
    });
  });

  app.post('/login', async (req, reply) => {
    const body = loginRequestSchema.parse(req.body);

    const user = await db.query.users.findFirst({ where: eq(users.email, body.email) });
    if (!user || !user.passwordHash) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');

    if (!user.emailVerifiedAt) {
      throw new ApiError(403, 'EMAIL_NOT_VERIFIED', 'Please confirm your email address before logging in.');
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = await issueRefreshToken(user.id);

    reply.setCookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    reply.send({
      user: { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() },
      accessToken,
      refreshToken,
    });
  });

  app.post('/verify-email', async (req, reply) => {
    const body = verifyEmailRequestSchema.parse(req.body);
    const hash = hashToken(body.token);

    const user = await db.query.users.findFirst({ where: eq(users.verificationTokenHash, hash) });
    if (!user || !user.verificationTokenExpiresAt || user.verificationTokenExpiresAt.getTime() < Date.now()) {
      throw new ApiError(400, 'INVALID_VERIFICATION_TOKEN', 'This verification link is invalid or has expired.');
    }

    await db
      .update(users)
      .set({ emailVerifiedAt: new Date(), verificationTokenHash: null, verificationTokenExpiresAt: null })
      .where(eq(users.id, user.id));

    // Verifying logs the user straight in, same shape as /login.
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = await issueRefreshToken(user.id);

    reply.setCookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    reply.send({
      user: { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() },
      accessToken,
      refreshToken,
    });
  });

  app.post('/resend-verification', async (req, reply) => {
    const body = resendVerificationRequestSchema.parse(req.body);
    const user = await db.query.users.findFirst({ where: eq(users.email, body.email) });

    // Always respond the same way regardless of whether the account exists or
    // is already verified, so this can't be used to enumerate registered emails.
    if (user && !user.emailVerifiedAt) {
      const verification = generateVerificationToken();
      await db
        .update(users)
        .set({ verificationTokenHash: verification.hash, verificationTokenExpiresAt: verification.expiresAt })
        .where(eq(users.id, user.id));
      await sendVerificationEmail(user.email, verification.raw);
    }

    reply.send({ ok: true });
  });

  app.post('/refresh', async (req, reply) => {
    const body = refreshRequestSchema.parse(req.body ?? {});
    const presented = req.cookies[REFRESH_COOKIE] ?? body.refreshToken;
    if (!presented) throw new ApiError(401, 'NO_REFRESH_TOKEN', 'No refresh token provided.');

    const result = await rotateRefreshToken(presented);
    if (!result) throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid, expired, or revoked.');

    reply.setCookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
    reply.send({ accessToken: result.accessToken, refreshToken: result.refreshToken });
  });

  app.post('/logout', async (req, reply) => {
    const presented = req.cookies[REFRESH_COOKIE];
    if (presented) await revokeRefreshToken(presented);
    reply.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    reply.status(204).send();
  });
};
