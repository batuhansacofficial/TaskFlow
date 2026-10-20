import { HttpError } from '../lib/http-error.js';
import { TASK_STATUSES, TASK_PRIORITIES, UUID_PATTERN } from '../lib/task-schema.js';
const editable = new Set(['title', 'description', 'status', 'priority', 'assignee']);

export function validateId(req, res, next) {
  if (!UUID_PATTERN.test(req.params.id)) {
    throw new HttpError(400, 'INVALID_ID', 'Görev kimliği geçerli bir UUID olmalıdır.');
  }
  req.params.id = req.params.id.toLowerCase();
  next();
}

export function requireJson(req, res, next) {
  if (!req.is('application/json')) {
    throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type application/json olmalıdır.');
  }
  next();
}

export function validateTask({ partial = false } = {}) {
  return (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new HttpError(400, 'INVALID_BODY', 'İstek gövdesi bir JSON nesnesi olmalıdır.');
    }

    const details = [];
    const data = {};
    const keys = Object.keys(body);
    for (const key of keys) {
      if (!editable.has(key)) {
        details.push({ field: key, message: 'Bu alan gönderilemez.' });
      }
    }
    if (!partial || Object.hasOwn(body, 'title')) {
      checkText('title', 1, 200);
    }
    if (Object.hasOwn(body, 'description')) checkText('description', 0, 5000);
    if (Object.hasOwn(body, 'assignee')) {
      if (body.assignee === null) data.assignee = null;
      else checkText('assignee', 1, 100);
    }
    for (const [field, values] of [['status', TASK_STATUSES], ['priority', TASK_PRIORITIES]]) {
      if (Object.hasOwn(body, field)) {
        if (!values.includes(body[field])) {
          details.push({ field, message: `Geçerli değerler: ${values.join(', ')}.` });
        } else data[field] = body[field];
      }
    }

    if (partial && keys.length === 0) {
      details.push({ field: 'body', message: 'En az bir düzenlenebilir alan gönderilmelidir.' });
    }
    if (details.length) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Görev bilgileri geçersiz.', details);
    }

    req.taskInput = partial ? data : {
      description: '', status: 'pending', priority: 'medium', assignee: null, ...data,
    };
    next();

    function checkText(field, min, max) {
      if (typeof body[field] !== 'string') {
        details.push({ field, message: 'Metin değeri gönderilmelidir.' });
        return;
      }
      const value = body[field].trim();
      if (value.length < min || value.length > max) {
        details.push({ field, message: `Uzunluk ${min}-${max} karakter arasında olmalıdır.` });
      } else data[field] = value;
    }
  };
}
