import express from 'express';
import { createTaskRepository } from './repositories/tasks.repository.js';
import { createTasksRouter } from './routes/tasks.routes.js';
import { createReportsRouter } from './routes/reports.routes.js';
import { requestLogger } from './middleware/request-logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { HttpError } from './lib/http-error.js';
import { cors } from './middleware/cors.js';

export function createApp({ repository = createTaskRepository(), logger = console.log, corsOrigin } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('query parser', 'simple');
  app.use(requestLogger(logger));
  app.use(cors(corsOrigin));
  app.use(express.json({ limit: '100kb', strict: true }));
  app.get('/health', (req, res) => res.json({ data: { status: 'ok' } }));
  app.use('/tasks', createTasksRouter(repository));
  app.use('/reports', createReportsRouter(repository));
  app.use((req, res, next) => next(new HttpError(404, 'ROUTE_NOT_FOUND', 'İstek yolu bulunamadı.')));
  app.use(errorHandler);
  return app;
}
