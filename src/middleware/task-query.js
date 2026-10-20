import { HttpError } from '../lib/http-error.js';
import { TASK_STATUSES, TASK_PRIORITIES } from '../lib/task-schema.js';

const commonKeys = ['status', 'priority', 'page', 'limit', 'sort'];
const sortable = new Set(['createdAt', 'updatedAt', 'title', 'priority']);

export function taskQuery({ search = false, assignee = false } = {}) {
  return (req, res, next) => {
    const query = req.query;
    const allowed = new Set(search ? [...commonKeys, 'keyword'] : commonKeys);
    for (const key of Object.keys(query)) {
      if (!allowed.has(key) || typeof query[key] !== 'string') {
        throw invalid(key, 'Parametre desteklenmiyor veya birden fazla kez gönderilmiş.');
      }
    }

    const options = {};
    for (const [key, choices] of [['status', TASK_STATUSES], ['priority', TASK_PRIORITIES]]) {
      if (Object.hasOwn(query, key)) {
        if (!choices.includes(query[key])) throw invalid(key, 'Parametre değeri geçersiz.');
        options[key] = query[key];
      }
    }
    if (search) {
      if (!query.keyword?.trim() || query.keyword.trim().length > 200) {
        throw invalid('keyword', 'Arama metni 1-200 karakter arasında olmalıdır.');
      }
      options.keyword = query.keyword.trim();
    }
    if (assignee) {
      const value = req.params.assignee.trim();
      if (!value || value.length > 100) throw invalid('assignee', 'Çalışan tanımlayıcısı 1-100 karakter arasında olmalıdır.');
      options.assignee = value;
    }

    const sort = query.sort ?? 'createdAt';
    options.descending = sort.startsWith('-');
    options.sort = options.descending ? sort.slice(1) : sort;
    if (!sortable.has(options.sort)) throw invalid('sort', 'Sıralama alanı desteklenmiyor.');

    if (Object.hasOwn(query, 'page') || Object.hasOwn(query, 'limit')) {
      options.page = positiveInteger(query.page ?? '1', 'page', Number.MAX_SAFE_INTEGER);
      options.limit = positiveInteger(query.limit ?? '10', 'limit', 100);
    }
    req.taskQuery = options;
    next();
  };
}

function positiveInteger(text, field, maximum) {
  const value = Number(text);
  if (!/^[1-9]\d*$/.test(text) || !Number.isSafeInteger(value) || value > maximum) {
    throw invalid(field, `1-${maximum} arasında bir tam sayı gönderilmelidir.`);
  }
  return value;
}

function invalid(field, message) {
  return new HttpError(400, 'INVALID_QUERY', 'Sorgu parametreleri geçersiz.', [{ field, message }]);
}
