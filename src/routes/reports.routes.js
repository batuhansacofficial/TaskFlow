import { Router } from 'express';
import { HttpError } from '../lib/http-error.js';

export function createReportsRouter(repository) {
  const router = Router();
  router.use((req, res, next) => {
    if (Object.keys(req.query).length) {
      throw new HttpError(400, 'INVALID_QUERY', 'Rapor endpointlerinde sorgu parametresi desteklenmiyor.');
    }
    next();
  });

  for (const status of ['completed', 'pending']) {
    router.get(`/${status}`, async (req, res) => {
      const tasks = await repository.list();
      res.json({ data: { count: tasks.filter((task) => task.status === status).length } });
    });
  }
  router.get('/summary', async (req, res) => {
    const tasks = await repository.list();
    const summary = { total: tasks.length, pending: 0, inProgress: 0, completed: 0 };
    for (const task of tasks) {
      if (task.status === 'in_progress') summary.inProgress += 1;
      else summary[task.status] += 1;
    }
    res.json({ data: summary });
  });
  return router;
}
