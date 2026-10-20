import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TASK_PRIORITIES, TASK_STATUSES, UUID_PATTERN } from '../lib/task-schema.js';

const defaultFilePath = fileURLToPath(new URL('../../data/tasks.json', import.meta.url));
const queues = new Map();
const statuses = new Set(TASK_STATUSES);
const priorities = new Set(TASK_PRIORITIES);
const fields = ['id', 'title', 'description', 'status', 'priority', 'assignee', 'createdAt', 'updatedAt'];
const editableFields = ['title', 'description', 'status', 'priority', 'assignee'];

function serialize(filePath, operation) {
  const queueKey = process.platform === 'win32' ? filePath.toLowerCase() : filePath;
  const previous = queues.get(queueKey) ?? Promise.resolve();
  const current = previous.catch(() => {}).then(operation);
  queues.set(queueKey, current);

  const release = () => {
    if (queues.get(queueKey) === current) queues.delete(queueKey);
  };
  current.then(release, release);
  return current;
}

function isText(value, minimum, maximum) {
  return typeof value === 'string'
    && value.length >= minimum
    && value.length <= maximum
    && value === value.trim();
}

function isTimestamp(value) {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function validateTasks(tasks) {
  if (!Array.isArray(tasks)) throw new Error('Görev verisi bir JSON dizisi olmalıdır.');

  const identifiers = new Set();
  for (const task of tasks) {
    if (!task || typeof task !== 'object' || Array.isArray(task)
      || Object.keys(task).length !== fields.length
      || !fields.every((field) => Object.hasOwn(task, field))
      || typeof task.id !== 'string' || !UUID_PATTERN.test(task.id)
      || !isText(task.title, 1, 200)
      || !isText(task.description, 0, 5000)
      || !statuses.has(task.status)
      || !priorities.has(task.priority)
      || !(task.assignee === null || isText(task.assignee, 1, 100))
      || !isTimestamp(task.createdAt)
      || !isTimestamp(task.updatedAt)) {
      throw new Error('Görev dosyası geçersiz bir kayıt içeriyor.');
    }

    const identifier = task.id.toLowerCase();
    if (identifiers.has(identifier)) throw new Error('Görev dosyası yinelenen bir kimlik içeriyor.');
    identifiers.add(identifier);
    task.id = identifier;
  }
  return tasks;
}

async function readTasks(filePath) {
  let contents;
  try {
    contents = await readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  return validateTasks(JSON.parse(contents));
}

async function writeTasks(filePath, tasks) {
  validateTasks(tasks);
  await mkdir(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  let handle;

  try {
    handle = await open(temporaryPath, 'wx', 0o600);
    await handle.writeFile(`${JSON.stringify(tasks, null, 2)}\n`, 'utf8');
    await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(temporaryPath, filePath);
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }
}

export function createTaskRepository({ filePath = defaultFilePath, clock = () => new Date(), idFactory = randomUUID } = {}) {
  const storagePath = resolve(filePath);

  return {
    async list() {
      return serialize(storagePath, async () => structuredClone(await readTasks(storagePath)));
    },

    async findById(id) {
      return serialize(storagePath, async () => {
        const tasks = await readTasks(storagePath);
        return structuredClone(tasks.find((task) => task.id === id.toLowerCase()) ?? null);
      });
    },

    async create(input) {
      const values = structuredClone(input);
      return serialize(storagePath, async () => {
        const tasks = await readTasks(storagePath);
        const timestamp = clock().toISOString();
        const task = {
          id: idFactory(),
          title: values.title,
          description: values.description ?? '',
          status: values.status ?? 'pending',
          priority: values.priority ?? 'medium',
          assignee: values.assignee ?? null,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        tasks.push(task);
        await writeTasks(storagePath, tasks);
        return structuredClone(task);
      });
    },

    async update(id, changes) {
      const values = structuredClone(changes);
      return serialize(storagePath, async () => {
        const tasks = await readTasks(storagePath);
        const task = tasks.find((candidate) => candidate.id === id.toLowerCase());
        if (!task) return null;

        for (const field of editableFields) {
          if (Object.hasOwn(values, field)) task[field] = values[field];
        }
        task.updatedAt = clock().toISOString();
        await writeTasks(storagePath, tasks);
        return structuredClone(task);
      });
    },

    async remove(id) {
      return serialize(storagePath, async () => {
        const tasks = await readTasks(storagePath);
        const index = tasks.findIndex((task) => task.id === id.toLowerCase());
        if (index === -1) return false;

        tasks.splice(index, 1);
        await writeTasks(storagePath, tasks);
        return true;
      });
    },
  };
}
