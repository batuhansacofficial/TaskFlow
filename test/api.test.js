import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test } from 'node:test';
import { createApp } from '../src/app.js';
import { createTaskRepository } from '../src/repositories/tasks.repository.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testDataRoot = path.join(projectRoot, 'tmp', 'test-data');
const absentId = 'c7eb5c97-80ed-4dcb-8ac9-97241b7b62c1';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function fixture(t, appOptions = {}) {
  await mkdir(testDataRoot, { recursive: true });
  const directory = await mkdtemp(path.join(testDataRoot, 'api-'));
  const filePath = path.join(directory, 'tasks.json');
  const logs = [];
  const servers = new Set();

  async function start() {
    const repository = await createTaskRepository({ filePath });
    const app = await createApp({ ...appOptions, repository, logger: (line) => logs.push(line) });
    const server = createServer(app);
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    servers.add(server);
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    async function close() {
      if (!servers.has(server)) return;
      await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
        server.closeIdleConnections?.();
      });
      servers.delete(server);
    }

    async function request(route, { method = 'GET', body, rawBody, headers = {} } = {}) {
      const hasBody = body !== undefined || rawBody !== undefined;
      const response = await fetch(`${baseUrl}${route}`, {
        method,
        headers: hasBody ? { 'Content-Type': 'application/json', ...headers } : headers,
        body: rawBody !== undefined ? rawBody : body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await response.text();
      let payload = null;
      if (text) {
        assert.match(response.headers.get('content-type') ?? '', /application\/json/i);
        payload = JSON.parse(text);
      }
      return { status: response.status, headers: response.headers, body: payload, text };
    }

    return { request, close };
  }

  t.after(async () => {
    await Promise.all([...servers].map((server) => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
      server.closeIdleConnections?.();
    })));
    const childPath = path.relative(testDataRoot, path.resolve(directory));
    assert.ok(childPath && !childPath.startsWith('..') && !path.isAbsolute(childPath));
    await rm(directory, { recursive: true, force: true });
  });

  return { ...(await start()), start, logs, filePath };
}

function expectError(response, status) {
  assert.equal(response.status, status);
  assert.equal(typeof response.body?.error?.code, 'string');
  assert.ok(response.body.error.code.length > 0);
  assert.equal(typeof response.body.error.message, 'string');
  assert.ok(response.body.error.message.length > 0);
  assert.equal(response.body.error.stack, undefined);
  assert.doesNotMatch(response.text, /node_modules|[A-Za-z]:\\|at\s+\w+\s+\(/);
}

async function createTask(api, fields = {}) {
  const result = await api.request('/tasks', {
    method: 'POST', body: { title: 'Görev API’sini geliştirme', ...fields },
  });
  assert.equal(result.status, 201, result.text);
  return result.body.data;
}

async function seed(api) {
  return Promise.all([
    { title: 'API geliştirme', description: 'Backend servisleri', status: 'pending', priority: 'high', assignee: 'ayse' },
    { title: 'İŞ AKIŞI', description: 'Durum geçişleri', status: 'in_progress', priority: 'medium', assignee: 'musa' },
    { title: 'Arayüz inceleme', description: 'İstanbul ofisi için tasarım', status: 'completed', priority: 'low', assignee: 'ayse' },
    { title: 'API testleri', description: 'Backend doğrulama', status: 'completed', priority: 'high', assignee: null },
  ].map((fields) => createTask(api, fields)));
}

describe('Zorunlu kapsam', () => {
  test('sağlık kontrolü hizmet durumunu bildirir', async (t) => {
    const api = await fixture(t);
    const response = await api.request('/health');
    assert.equal(response.status, 200);
    assert.equal(response.body.data.status, 'ok');
  });

  test('boş görev listesi veri ve toplam zarfını döndürür', async (t) => {
    const api = await fixture(t);
    const response = await api.request('/tasks');
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { data: [], meta: { total: 0 } });
  });

  test('görev oluşturma varsayılanları, kimliği ve tarihleri üretir', async (t) => {
    const api = await fixture(t);
    const response = await api.request('/tasks', { method: 'POST', body: { title: '  Türkçe görev  ' } });
    assert.equal(response.status, 201);
    const task = response.body.data;
    assert.match(task.id, uuidPattern);
    assert.equal(response.headers.get('location'), `/tasks/${task.id}`);
    assert.equal(task.title, 'Türkçe görev');
    assert.equal(task.description, '');
    assert.equal(task.status, 'pending');
    assert.equal(task.priority, 'medium');
    assert.equal(task.assignee, null);
    assert.ok(Number.isFinite(Date.parse(task.createdAt)));
    assert.equal(task.createdAt, new Date(task.createdAt).toISOString());
    assert.equal(task.updatedAt, task.createdAt);
  });

  test('liste ve detay oluşturulan görevi aynı alanlarla döndürür', async (t) => {
    const api = await fixture(t);
    const task = await createTask(api, { description: 'Kod incelemesi', priority: 'high', assignee: 'musa' });
    const detail = await api.request(`/tasks/${task.id}`);
    assert.equal(detail.status, 200);
    assert.deepEqual(detail.body.data, task);
    const list = await api.request('/tasks');
    assert.equal(list.status, 200);
    assert.deepEqual(list.body.data, [task]);
    assert.equal(list.body.meta.total, 1);
  });

  test('kısmi güncelleme atama, durum ve önceliği değiştirirken diğer alanları korur', async (t) => {
    const api = await fixture(t);
    const task = await createTask(api, { description: 'Korunacak açıklama', assignee: 'musa' });
    const response = await api.request(`/tasks/${task.id}`, {
      method: 'PATCH', body: { status: 'in_progress', priority: 'high', assignee: '  ayse  ' },
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.data.id, task.id);
    assert.equal(response.body.data.title, task.title);
    assert.equal(response.body.data.description, task.description);
    assert.equal(response.body.data.createdAt, task.createdAt);
    assert.ok(Date.parse(response.body.data.updatedAt) >= Date.parse(task.updatedAt));
    assert.equal(response.body.data.status, 'in_progress');
    assert.equal(response.body.data.priority, 'high');
    assert.equal(response.body.data.assignee, 'ayse');
    const unassign = await api.request(`/tasks/${task.id}`, { method: 'PATCH', body: { assignee: null } });
    assert.equal(unassign.status, 200);
    assert.equal(unassign.body.data.assignee, null);
    assert.equal(unassign.body.data.status, 'in_progress');
  });

  test('silme boş 204 yanıtı verir ve kayıt artık bulunamaz', async (t) => {
    const api = await fixture(t);
    const task = await createTask(api);
    const response = await api.request(`/tasks/${task.id}`, { method: 'DELETE' });
    assert.equal(response.status, 204);
    assert.equal(response.text, '');
    expectError(await api.request(`/tasks/${task.id}`), 404);
    assert.equal((await api.request('/tasks')).body.meta.total, 0);
  });

  test('bulunmayan görev ve yollar tutarlı 404 hatası verir', async (t) => {
    const api = await fixture(t);
    expectError(await api.request(`/tasks/${absentId}`), 404);
    expectError(await api.request(`/tasks/${absentId}`, { method: 'PATCH', body: { title: 'Yeni başlık' } }), 404);
    expectError(await api.request(`/tasks/${absentId}`, { method: 'DELETE' }), 404);
    expectError(await api.request('/tanimlanmayan-yol'), 404);
  });

  test('geçersiz görev kimliği 400 hatası verir', async (t) => {
    const api = await fixture(t);
    expectError(await api.request('/tasks/gecersiz-kimlik'), 400);
  });

  test('büyük harfli UUID yolları aynı görevi bulur, günceller ve siler', async (t) => {
    const api = await fixture(t);
    const task = await createTask(api);
    const upperId = task.id.toUpperCase();
    const detail = await api.request(`/tasks/${upperId}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.body.data.id, task.id);
    const update = await api.request(`/tasks/${upperId}`, { method: 'PATCH', body: { status: 'completed' } });
    assert.equal(update.status, 200);
    assert.equal(update.body.data.id, task.id);
    assert.equal(update.body.data.status, 'completed');
    assert.equal((await api.request(`/tasks/${upperId}`, { method: 'DELETE' })).status, 204);
    expectError(await api.request(`/tasks/${task.id}`), 404);
  });

  test('UUID sürüm veya varyant bitleri geçersizse yol reddedilir', async (t) => {
    const api = await fixture(t);
    for (const id of ['c7eb5c97-80ed-0dcb-8ac9-97241b7b62c1', 'c7eb5c97-80ed-4dcb-7ac9-97241b7b62c1']) {
      expectError(await api.request(`/tasks/${id}`), 400);
      expectError(await api.request(`/tasks/${id}`, { method: 'PATCH', body: { status: 'completed' } }), 400);
      expectError(await api.request(`/tasks/${id}`, { method: 'DELETE' }), 400);
    }
  });

  test('logger başarılı, bulunamayan ve bozuk JSON isteklerini zaman damgasıyla kaydeder', async (t) => {
    const api = await fixture(t);
    await api.request('/tasks');
    await api.request('/tanimlanmayan-yol');
    expectError(await api.request('/tasks', { method: 'POST', rawBody: '{"title":' }), 400);
    const entries = api.logs.map((line) => typeof line === 'string' ? JSON.parse(line) : line);
    for (const [method, endpoint] of [['GET', '/tasks'], ['GET', '/tanimlanmayan-yol'], ['POST', '/tasks']]) {
      const entry = entries.find((item) => item.method === method && item.endpoint === endpoint);
      assert.ok(entry, `${method} ${endpoint} kaydı bulunmalı`);
      assert.ok(Number.isFinite(Date.parse(entry.timestamp)));
      assert.equal(entry.timestamp, new Date(entry.timestamp).toISOString());
    }
  });

  test('oluşturma, güncelleme ve silme uygulama yeniden açıldığında korunur', async (t) => {
    const api = await fixture(t);
    const task = await createTask(api);
    await api.request(`/tasks/${task.id}`, { method: 'PATCH', body: { status: 'completed' } });
    await api.close();
    const reopened = await api.start();
    const persisted = await reopened.request(`/tasks/${task.id}`);
    assert.equal(persisted.status, 200);
    assert.equal(persisted.body.data.status, 'completed');
    assert.equal(JSON.parse(await readFile(api.filePath, 'utf8')).length, 1);
    await reopened.request(`/tasks/${task.id}`, { method: 'DELETE' });
    await reopened.close();
    const again = await api.start();
    expectError(await again.request(`/tasks/${task.id}`), 404);
    assert.equal((await again.request('/tasks')).body.meta.total, 0);
  });

  test('eşzamanlı oluşturma istekleri kalıcı dosyada kayıt kaybetmez', async (t) => {
    const api = await fixture(t);
    const titles = Array.from({ length: 12 }, (_, index) => `Eşzamanlı görev ${index + 1}`);
    const tasks = await Promise.all(titles.map((title) => createTask(api, { title })));
    assert.equal(new Set(tasks.map((task) => task.id)).size, titles.length);
    await api.close();
    const reopened = await api.start();
    const response = await reopened.request('/tasks');
    assert.equal(response.body.meta.total, titles.length);
    assert.deepEqual(response.body.data.map((task) => task.title).sort(), [...titles].sort());
  });

  test('bozuk veri dosyası 500 hatası verir ve mevcut içeriği korur', async (t) => {
    const api = await fixture(t);
    const corrupted = '{ geçersiz JSON';
    await writeFile(api.filePath, corrupted, 'utf8');
    expectError(await api.request('/tasks'), 500);
    expectError(await api.request('/tasks', { method: 'POST', body: { title: 'Yeni görev' } }), 500);
    assert.equal(await readFile(api.filePath, 'utf8'), corrupted);
  });
});

describe('İsteğe bağlı: doğrulama', () => {
  for (const [label, body] of [
    ['eksik başlık', {}], ['boş başlık', { title: '  ' }], ['metin olmayan başlık', { title: 5 }],
    ['uzun başlık', { title: 'a'.repeat(201) }], ['uzun açıklama', { title: 'Görev', description: 'a'.repeat(5001) }],
    ['boş çalışan', { title: 'Görev', assignee: '  ' }], ['uzun çalışan', { title: 'Görev', assignee: 'a'.repeat(101) }],
    ['geçersiz durum', { title: 'Görev', status: 'done' }], ['geçersiz öncelik', { title: 'Görev', priority: 'urgent' }],
    ['bilinmeyen alan', { title: 'Görev', extra: true }], ['istemci kimliği', { title: 'Görev', id: absentId }],
    ['istemci oluşturma tarihi', { title: 'Görev', createdAt: new Date().toISOString() }],
    ['istemci güncelleme tarihi', { title: 'Görev', updatedAt: new Date().toISOString() }],
    ['dizi gövdesi', []], ['null gövdesi', null],
  ]) {
    test(`${label} 400 ile reddedilir ve veri oluşturulmaz`, async (t) => {
      const api = await fixture(t);
      expectError(await api.request('/tasks', { method: 'POST', body }), 400);
      assert.equal((await api.request('/tasks')).body.meta.total, 0);
    });
  }

  test('boş veya geçersiz güncelleme mevcut veriyi değiştirmez', async (t) => {
    const api = await fixture(t);
    const task = await createTask(api);
    for (const body of [{}, { title: '' }, { description: null }, { assignee: 10 }, { status: 'done' }, { id: absentId }]) {
      expectError(await api.request(`/tasks/${task.id}`, { method: 'PATCH', body }), 400);
    }
    assert.deepEqual((await api.request(`/tasks/${task.id}`)).body.data, task);
  });

  test('desteklenmeyen içerik türü ve aşırı büyük gövde reddedilir', async (t) => {
    const api = await fixture(t);
    expectError(await api.request('/tasks', {
      method: 'POST', rawBody: 'title=Görev', headers: { 'Content-Type': 'text/plain' },
    }), 415);
    expectError(await api.request('/tasks', { method: 'POST', body: { title: 'Görev', description: 'a'.repeat(150 * 1024) } }), 413);
  });

  test('bozuk sıkıştırılmış gövdeler istemci hatası verir ve veri değiştirmez', async (t) => {
    const api = await fixture(t);
    for (const encoding of ['gzip', 'deflate', 'br']) {
      expectError(await api.request('/tasks', {
        method: 'POST', rawBody: 'invalid compressed body', headers: { 'Content-Encoding': encoding },
      }), 400);
    }
    assert.equal((await api.request('/tasks')).body.meta.total, 0);
  });

  test('bilinmeyen ve yinelenen query parametreleri reddedilir', async (t) => {
    const api = await fixture(t);
    for (const route of ['/tasks?unexpected=1', '/tasks?status=pending&status=completed', '/tasks?page=1&page=2', '/tasks/search?keyword=api&keyword=test']) {
      expectError(await api.request(route), 400);
    }
  });
});

describe('İsteğe bağlı: durum filtresi', () => {
  test('tam durum eşleşmesini ve bulunamayan sonuçları döndürür', async (t) => {
    const api = await fixture(t);
    await seed(api);
    const response = await api.request('/tasks?status=completed');
    assert.equal(response.status, 200);
    assert.equal(response.body.meta.total, 2);
    assert.ok(response.body.data.every((task) => task.status === 'completed'));
    expectError(await api.request('/tasks?status=done'), 400);
  });
});

describe('İsteğe bağlı: öncelik filtresi', () => {
  test('durum ve öncelik filtrelerini kesişim olarak uygular', async (t) => {
    const api = await fixture(t);
    await seed(api);
    const response = await api.request('/tasks?status=completed&priority=high');
    assert.equal(response.status, 200);
    assert.equal(response.body.meta.total, 1);
    assert.equal(response.body.data[0].title, 'API testleri');
    const empty = await api.request('/tasks?status=pending&priority=low');
    assert.deepEqual(empty.body.data, []);
    assert.equal(empty.body.meta.total, 0);
    expectError(await api.request('/tasks?priority=urgent'), 400);
  });
});

describe('İsteğe bağlı: arama', () => {
  test('başlık ve açıklamada harf duyarsız arama yapar', async (t) => {
    const api = await fixture(t);
    await seed(api);
    const response = await api.request('/tasks/search?keyword=BACKEND');
    assert.equal(response.status, 200);
    assert.equal(response.body.meta.total, 2);
    assert.deepEqual(new Set(response.body.data.map((task) => task.title)), new Set(['API geliştirme', 'API testleri']));
  });

  test('Türkçe harf dönüşümünü ve ortak filtreleri uygular', async (t) => {
    const api = await fixture(t);
    await seed(api);
    const title = await api.request(`/tasks/search?keyword=${encodeURIComponent('iş akışı')}`);
    assert.equal(title.status, 200);
    assert.equal(title.body.data[0].title, 'İŞ AKIŞI');
    const description = await api.request(`/tasks/search?keyword=${encodeURIComponent('istanbul')}&status=completed`);
    assert.equal(description.body.meta.total, 1);
    assert.equal(description.body.data[0].title, 'Arayüz inceleme');
    const filtered = await api.request('/tasks/search?keyword=backend&priority=high&status=pending');
    assert.equal(filtered.body.meta.total, 1);
    assert.equal(filtered.body.data[0].title, 'API geliştirme');
  });

  test('boş anahtar kelime reddedilir, eşleşme yoksa boş liste döner', async (t) => {
    const api = await fixture(t);
    expectError(await api.request('/tasks/search'), 400);
    expectError(await api.request('/tasks/search?keyword=%20%20'), 400);
    const response = await api.request('/tasks/search?keyword=bulunamayan');
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { data: [], meta: { total: 0 } });
  });
});

describe('İsteğe bağlı: çalışana göre listeleme', () => {
  test('temizlenmiş çalışan adında harf duyarlı tam eşleşme kullanır', async (t) => {
    const api = await fixture(t);
    await seed(api);
    const response = await api.request('/tasks/assignee/%20ayse%20');
    assert.equal(response.status, 200);
    assert.equal(response.body.meta.total, 2);
    assert.ok(response.body.data.every((task) => task.assignee === 'ayse'));
    const differentCase = await api.request('/tasks/assignee/Ayse');
    assert.deepEqual(differentCase.body.data, []);
    const filtered = await api.request('/tasks/assignee/ayse?status=completed&priority=low');
    assert.equal(filtered.body.meta.total, 1);
    assert.equal(filtered.body.data[0].title, 'Arayüz inceleme');
  });
});

describe('İsteğe bağlı: sayfalama', () => {
  test('filtre sonrası toplamı, sayfa verisini ve aralık dışı boş sayfayı döndürür', async (t) => {
    const api = await fixture(t);
    await seed(api);
    const first = await api.request('/tasks?status=completed&page=1&limit=1&sort=title');
    const second = await api.request('/tasks?status=completed&page=2&limit=1&sort=title');
    assert.equal(first.status, 200);
    assert.deepEqual(first.body.meta, { total: 2, page: 1, limit: 1, totalPages: 2 });
    assert.equal(first.body.data.length, 1);
    assert.equal(second.body.data.length, 1);
    assert.notEqual(first.body.data[0].id, second.body.data[0].id);
    const beyond = await api.request('/tasks?status=completed&page=3&limit=1');
    assert.equal(beyond.status, 200);
    assert.deepEqual(beyond.body.data, []);
    assert.equal(beyond.body.meta.total, 2);
  });

  test('tek parametrede eksik sayfa ve limit varsayılanlarını kullanır', async (t) => {
    const api = await fixture(t);
    await seed(api);
    assert.deepEqual((await api.request('/tasks?limit=2')).body.meta, { total: 4, page: 1, limit: 2, totalPages: 2 });
    assert.deepEqual((await api.request('/tasks?page=1')).body.meta, { total: 4, page: 1, limit: 10, totalPages: 1 });
    const search = await api.request('/tasks/search?keyword=backend&page=1&limit=1');
    assert.equal(search.body.meta.total, 2);
    assert.equal(search.body.data.length, 1);
    const assignee = await api.request('/tasks/assignee/ayse?page=1&limit=1');
    assert.equal(assignee.body.meta.total, 2);
    assert.equal(assignee.body.data.length, 1);
  });

  test('geçersiz sayfa ve limit değerlerini reddeder', async (t) => {
    const api = await fixture(t);
    for (const query of ['page=0', 'page=-1', 'page=1.5', 'page=abc', 'page=', 'limit=0', 'limit=101', 'limit=2.5', 'limit=abc']) {
      expectError(await api.request(`/tasks?${query}`), 400);
    }
  });
});

describe('İsteğe bağlı: sıralama', () => {
  test('önceliği low, medium, high sırasıyla ve ters yönde sıralar', async (t) => {
    const api = await fixture(t);
    await seed(api);
    const ascending = await api.request('/tasks?sort=priority');
    assert.equal(ascending.status, 200);
    assert.deepEqual(ascending.body.data.map((task) => task.priority), ['low', 'medium', 'high', 'high']);
    const descending = await api.request('/tasks?sort=-priority');
    assert.deepEqual(descending.body.data.map((task) => task.priority), ['high', 'high', 'medium', 'low']);
  });

  test('başlık ve tarih sıralamasını uygular, bilinmeyen alanı reddeder', async (t) => {
    const api = await fixture(t);
    for (const title of ['Zebra', 'Alfa', 'Beta']) await createTask(api, { title });
    assert.deepEqual((await api.request('/tasks?sort=title')).body.data.map((task) => task.title), ['Alfa', 'Beta', 'Zebra']);
    assert.deepEqual((await api.request('/tasks?sort=-title')).body.data.map((task) => task.title), ['Zebra', 'Beta', 'Alfa']);
    for (const sort of ['createdAt', 'updatedAt']) {
      const tasks = (await api.request(`/tasks?sort=-${sort}`)).body.data;
      assert.equal(tasks.length, 3);
      assert.ok(tasks.every((task, index) => index === 0 || Date.parse(tasks[index - 1][sort]) >= Date.parse(task[sort])));
    }
    expectError(await api.request('/tasks?sort=assignee'), 400);
  });
});

describe('İsteğe bağlı: raporlar', () => {
  test('boş depoda sayılar sıfırdır', async (t) => {
    const api = await fixture(t);
    assert.deepEqual((await api.request('/reports/completed')).body.data, { count: 0 });
    assert.deepEqual((await api.request('/reports/pending')).body.data, { count: 0 });
    assert.deepEqual((await api.request('/reports/summary')).body.data, { total: 0, pending: 0, inProgress: 0, completed: 0 });
  });

  test('durum dağılımı güncelleme ve silme sonrasında tutarlıdır', async (t) => {
    const api = await fixture(t);
    const tasks = await seed(api);
    const summary = await api.request('/reports/summary');
    assert.equal(summary.status, 200);
    assert.deepEqual(summary.body.data, { total: 4, pending: 1, inProgress: 1, completed: 2 });
    assert.deepEqual((await api.request('/reports/completed')).body.data, { count: 2 });
    assert.deepEqual((await api.request('/reports/pending')).body.data, { count: 1 });
    await api.request(`/tasks/${tasks[0].id}`, { method: 'PATCH', body: { status: 'completed' } });
    await api.request(`/tasks/${tasks[1].id}`, { method: 'DELETE' });
    const updated = (await api.request('/reports/summary')).body.data;
    assert.deepEqual(updated, { total: 3, pending: 0, inProgress: 0, completed: 3 });
    assert.equal(updated.pending + updated.inProgress + updated.completed, updated.total);
  });
});

describe('İsteğe bağlı: tarayıcı erişimi', () => {
  test('varsayılan ayarda çapraz origin erişim başlığı göndermez', async (t) => {
    const api = await fixture(t);
    const response = await api.request('/health', { headers: { Origin: 'https://web.postman.co' } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
    assert.equal(response.headers.get('access-control-allow-private-network'), null);
  });

  test('yalnız yapılandırılmış origin için erişim başlığı gönderir', async (t) => {
    const api = await fixture(t, { corsOrigin: 'https://web.postman.co' });
    const allowed = await api.request('/tasks', { headers: { Origin: 'https://web.postman.co' } });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://web.postman.co');
    const foreign = await api.request('/tasks', { headers: { Origin: 'https://baska.example' } });
    assert.equal(foreign.status, 200);
    assert.equal(foreign.headers.get('access-control-allow-origin'), null);
    const noOrigin = await api.request('/tasks');
    assert.equal(noOrigin.headers.get('access-control-allow-origin'), null);
  });

  test('preflight yöntem ve gövde başlıklarını, istendiyse özel ağ iznini döndürür', async (t) => {
    const api = await fixture(t, { corsOrigin: 'https://web.postman.co' });
    const headers = {
      Origin: 'https://web.postman.co',
      'Access-Control-Request-Method': 'PATCH',
      'Access-Control-Request-Headers': 'content-type',
    };
    const ordinary = await api.request('/tasks', { method: 'OPTIONS', headers });
    assert.equal(ordinary.status, 204);
    assert.equal(ordinary.headers.get('access-control-allow-origin'), 'https://web.postman.co');
    assert.match(ordinary.headers.get('access-control-allow-methods') ?? '', /\bPATCH\b/);
    assert.match(ordinary.headers.get('access-control-allow-headers') ?? '', /\bcontent-type\b/i);
    assert.equal(ordinary.headers.get('access-control-allow-private-network'), null);
    const privateNetwork = await api.request('/tasks', {
      method: 'OPTIONS', headers: { ...headers, 'Access-Control-Request-Private-Network': 'true' },
    });
    assert.equal(privateNetwork.status, 204);
    assert.equal(privateNetwork.headers.get('access-control-allow-private-network'), 'true');
  });
});
