import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { config } from './config.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import authPlugin from './plugins/auth.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { curriculumRoutes } from './modules/curriculum/curriculum.routes.js';
import { progressRoutes } from './modules/progress/progress.routes.js';

export function buildApp() {
  const app = Fastify({
    logger: config.NODE_ENV === 'development' ? { transport: { target: 'pino-pretty' } } : true,
  });

  registerErrorHandler(app);

  app.register(cors, { origin: config.CORS_ORIGIN, credentials: true });
  app.register(cookie, { secret: config.COOKIE_SECRET });
  app.register(authPlugin);

  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(usersRoutes, { prefix: '/api' });
  app.register(curriculumRoutes, { prefix: '/api' });
  app.register(progressRoutes, { prefix: '/api' });

  return app;
}
