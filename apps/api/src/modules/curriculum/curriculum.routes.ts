import type { FastifyPluginAsync } from 'fastify';
import { CURRICULUM } from '@deutsch-lernen/shared';

export const curriculumRoutes: FastifyPluginAsync = async (app) => {
  app.get('/curriculum', { preHandler: app.authenticate }, async (_req, reply) => {
    // Static content that only changes on deploy — safe to cache client-side.
    reply.header('Cache-Control', 'private, max-age=3600');
    return CURRICULUM;
  });
};
