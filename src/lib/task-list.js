import { TASK_PRIORITIES } from './task-schema.js';

const textOrder = new Intl.Collator('tr-TR', { sensitivity: 'variant' });

export function selectTasks(tasks, options = {}) {
  const keyword = options.keyword?.toLocaleLowerCase('tr-TR');
  const selected = tasks.filter((task) => (
    (!options.status || task.status === options.status)
    && (!options.priority || task.priority === options.priority)
    && (options.assignee === undefined || task.assignee === options.assignee)
    && (!keyword || `${task.title}\n${task.description}`.toLocaleLowerCase('tr-TR').includes(keyword))
  ));
  const field = options.sort ?? 'createdAt';
  selected.sort((left, right) => {
    let order;
    if (field === 'priority') {
      order = TASK_PRIORITIES.indexOf(left.priority) - TASK_PRIORITIES.indexOf(right.priority);
    } else if (field === 'title') {
      order = textOrder.compare(left.title, right.title);
    } else {
      order = compare(left[field], right[field]);
    }
    return (options.descending ? -order : order) || compare(left.id, right.id);
  });

  const meta = { total: selected.length };
  if (options.page !== undefined) {
    Object.assign(meta, {
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(selected.length / options.limit),
    });
    const offset = (options.page - 1) * options.limit;
    return { data: selected.slice(offset, offset + options.limit), meta };
  }
  return { data: selected, meta };
}

function compare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
