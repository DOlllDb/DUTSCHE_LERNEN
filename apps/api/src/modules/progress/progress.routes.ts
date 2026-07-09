import type { FastifyPluginAsync } from 'fastify';
import { progressSchema, quizResultRequestSchema } from '@deutsch-lernen/shared';
import { getProgress, saveProgress, recordQuizResult } from './progress.service.js';

export const progressRoutes: FastifyPluginAsync = async (app) => {
  app.get('/progress', { preHandler: app.authenticate }, async (req) => {
    return getProgress(req.user!.sub);
  });

  app.put('/progress', { preHandler: app.authenticate }, async (req) => {
    const body = progressSchema.parse(req.body);
    return saveProgress(req.user!.sub, body);
  });

  app.post('/progress/quiz-result', { preHandler: app.authenticate }, async (req) => {
    const body = quizResultRequestSchema.parse(req.body);
    return recordQuizResult(req.user!.sub, body.testDay, body.score, body.total);
  });
};
