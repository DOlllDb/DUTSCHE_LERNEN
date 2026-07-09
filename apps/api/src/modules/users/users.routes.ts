import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { users } from '../../db/schema.js';
import { ApiError } from '../../plugins/error-handler.js';

export const usersRoutes: FastifyPluginAsync = async (app) => {
  app.get('/me', { preHandler: app.authenticate }, async (req) => {
    const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.sub) });
    if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'User no longer exists.');
    return { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() };
  });
};
