import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken, type AccessTokenPayload } from '../modules/auth/auth.service.js';
import { ApiError } from './error-handler.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AccessTokenPayload;
  }
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async (app: FastifyInstance) => {
  app.decorateRequest('user', undefined);
  app.decorate('authenticate', async (req: FastifyRequest) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
    if (!token) throw new ApiError(401, 'UNAUTHENTICATED', 'Missing bearer token.');
    try {
      req.user = verifyAccessToken(token);
    } catch {
      throw new ApiError(401, 'INVALID_TOKEN', 'Access token is invalid or expired.');
    }
  });
});
