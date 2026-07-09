import type { FastifyInstance, FastifyError } from 'fastify';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err: FastifyError | ZodError, _req, reply) => {
    if (err instanceof ApiError) {
      reply.status(err.statusCode).send({ error: { code: err.code, message: err.message } });
      return;
    }
    if (err instanceof ZodError) {
      reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: err.issues[0]?.message ?? 'Invalid request body.' } });
      return;
    }
    if ('validation' in err && err.validation) {
      reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: err.message } });
      return;
    }
    app.log.error(err);
    reply.status(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } });
  });
}
