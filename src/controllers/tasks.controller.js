import { HttpError } from '../lib/http-error.js';
import { selectTasks } from '../lib/task-list.js';

function notFound() {
  return new HttpError(404, 'TASK_NOT_FOUND', 'Görev bulunamadı.');
}

export function createTasksController(repository) {
  return {
    async create(req, res) {
      const task = await repository.create(req.taskInput);
      res.location(`/tasks/${task.id}`).status(201).json({ data: task });
    },
    async list(req, res) {
      const tasks = await repository.list();
      res.json(selectTasks(tasks, req.taskQuery));
    },
    async detail(req, res) {
      const task = await repository.findById(req.params.id);
      if (!task) throw notFound();
      res.json({ data: task });
    },
    async update(req, res) {
      const task = await repository.update(req.params.id, req.taskInput);
      if (!task) throw notFound();
      res.json({ data: task });
    },
    async remove(req, res) {
      if (!(await repository.remove(req.params.id))) throw notFound();
      res.status(204).end();
    },
  };
}
