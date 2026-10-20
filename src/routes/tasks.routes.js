import { Router } from 'express';
import { createTasksController } from '../controllers/tasks.controller.js';
import { requireJson, validateId, validateTask } from '../middleware/validate-task.js';
import { taskQuery } from '../middleware/task-query.js';

export function createTasksRouter(repository) {
  const router = Router();
  const controller = createTasksController(repository);

  router.get('/', taskQuery(), controller.list);
  router.get('/search', taskQuery({ search: true }), controller.list);
  router.get('/assignee/:assignee', taskQuery({ assignee: true }), controller.list);
  router.post('/', requireJson, validateTask(), controller.create);
  router.get('/:id', validateId, controller.detail);
  router.patch('/:id', validateId, requireJson, validateTask({ partial: true }), controller.update);
  router.delete('/:id', validateId, controller.remove);
  return router;
}
