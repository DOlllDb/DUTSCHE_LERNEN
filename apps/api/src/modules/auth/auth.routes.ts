import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { registerRequestSchema, loginRequestSchema, refreshRequestSchema } from '@deutsch-lernen/shared';
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
} from './auth.service.js';

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
    const [user] = await db
      .insert(users)
      .values({ email: body.email, passwordHash, authProvider: 'password' })
      .returning();

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = await issueRefreshToken(user.id);

    reply.setCookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    reply.status(201).send({
      user: { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() },
      accessToken,
      refreshToken,
    });
  });

  app.post('/login', async (req, reply) => {
    const body = loginRequestSchema.parse(req.body);

    const user = await db.query.users.findFirst({ where: eq(users.email, body.email) });
    if (!user || !user.passwordHash) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = await issueRefreshToken(user.id);

    reply.setCookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    reply.send({
      user: { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() },
      accessToken,
      refreshToken,
    });
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
