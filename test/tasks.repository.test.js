import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createTaskRepository } from '../src/repositories/tasks.repository.js';

const testRoot = fileURLToPath(new URL('../tmp/test-data/', import.meta.url));
const initialTime = '2026-10-20T10:00:00.000Z';
const updatedTime = '2026-10-20T11:00:00.000Z';
const firstId = '36b735af-c102-4a93-9d8c-b6e7c0860642';

async function fixture(t, options = {}) {
  await mkdir(testRoot, { recursive: true });
  const directory = await mkdtemp(join(testRoot, 'repository-'));
  const filePath = join(directory, 'data', 'tasks.json');
  t.after(async () => {
    const childPath = relative(testRoot, directory);
    assert.ok(childPath && !childPath.startsWith('..') && !isAbsolute(childPath));
    await rm(directory, { recursive: true, force: true });
  });
  return {
    filePath,
    directory,
    repository: createTaskRepository({ filePath, clock: () => new Date(initialTime), ...options }),
  };
}

function validTask(overrides = {}) {
  return {
    id: firstId,
    title: 'Görev planını hazırlama',
    description: '',
    status: 'pending',
    priority: 'medium',
    assignee: null,
    createdAt: initialTime,
    updatedAt: initialTime,
    ...overrides,
  };
}

async function save(filePath, contents) {
  await mkdir(join(filePath, '..'), { recursive: true });
  await writeFile(filePath, contents, 'utf8');
}

test('Eksik veri dosyası boş başlar ve bulunamayan işlemler kayıt oluşturmaz', async (t) => {
  const { repository, directory } = await fixture(t);
  assert.deepEqual(await repository.list(), []);
  assert.equal(await repository.findById(firstId), null);
  assert.equal(await repository.update(firstId, { title: 'Yeni başlık' }), null);
  assert.equal(await repository.remove(firstId), false);
  assert.deepEqual(await readdir(directory), []);
});

test('Oluşturma varsayılanları ve sunucu alanlarıyla diske kalıcı yazılır', async (t) => {
  const { repository, filePath } = await fixture(t, { idFactory: () => firstId });
  const input = { title: 'Görev planını hazırlama', id: 'istemci-kimliği', createdAt: 'istemci-zamanı' };
  const task = await repository.create(input);
  assert.deepEqual(task, validTask());
  assert.deepEqual(JSON.parse(await readFile(filePath, 'utf8')), [validTask()]);
  assert.deepEqual(await createTaskRepository({ filePath }).list(), [validTask()]);
});

test('Dönüş değerleri ve kuyruğa alınan girdiler dışarıdan değiştirilemez', async (t) => {
  const { repository } = await fixture(t, { idFactory: () => firstId });
  const input = { title: 'Görev planını hazırlama' };
  const pending = repository.create(input);
  input.title = 'Sonradan değişen girdi';
  const created = await pending;
  created.title = 'Değiştirilmiş sonuç';
  const listed = await repository.list();
  listed[0].title = 'Değiştirilmiş liste';
  listed.push(validTask());
  const found = await repository.findById(firstId);
  found.title = 'Değiştirilmiş detay';
  assert.deepEqual(await repository.list(), [validTask()]);
});

test('Güncelleme atama, durum ve önceliği değiştirir; kimlik ve oluşturma zamanı korunur', async (t) => {
  let now = initialTime;
  const { repository } = await fixture(t, { idFactory: () => firstId, clock: () => new Date(now) });
  await repository.create({ title: 'Görev planını hazırlama' });
  now = updatedTime;
  const changes = {
    description: 'Planın kontrol edilmesi',
    status: 'in_progress',
    priority: 'high',
    assignee: 'musa',
    id: 'değiştirilemez',
    createdAt: updatedTime,
  };
  const pending = repository.update(firstId, changes);
  changes.assignee = 'sonradan-değişti';
  const updated = await pending;
  assert.deepEqual(updated, validTask({
    description: 'Planın kontrol edilmesi', status: 'in_progress', priority: 'high', assignee: 'musa', updatedAt: updatedTime,
  }));
  updated.title = 'Yerel değişiklik';
  assert.equal((await repository.findById(firstId)).title, 'Görev planını hazırlama');
  assert.equal((await repository.update(firstId, { assignee: null })).assignee, null);
});

test('Silinen görev yeni repository örneğinde de bulunamaz', async (t) => {
  const { repository, filePath } = await fixture(t, { idFactory: () => firstId });
  await repository.create({ title: 'Görev planını hazırlama' });
  assert.equal(await repository.remove(firstId), true);
  assert.equal(await repository.remove(firstId), false);
  assert.equal(await createTaskRepository({ filePath }).findById(firstId), null);
  assert.deepEqual(JSON.parse(await readFile(filePath, 'utf8')), []);
});

test('Aynı dosyayı kullanan örneklerde eşzamanlı eklemeler kaybolmaz', async (t) => {
  const { repository, filePath } = await fixture(t);
  const otherRepository = createTaskRepository({ filePath: join(filePath, '..', 'tasks.json') });
  const operations = Array.from({ length: 40 }, (_, index) => (
    (index % 2 ? repository : otherRepository).create({ title: `Görev ${index}` })
  ));
  const created = await Promise.all(operations);
  const persisted = await repository.list();
  assert.equal(persisted.length, 40);
  assert.equal(new Set(persisted.map((task) => task.id)).size, 40);
  assert.deepEqual(persisted.map((task) => task.id), created.map((task) => task.id));
  assert.deepEqual((await readdir(join(filePath, '..'))), ['tasks.json']);
});

test('Kuyruktaki okuma, güncelleme ve silme çağrı sırasına göre tutarlıdır', async (t) => {
  const { repository, filePath } = await fixture(t, { idFactory: () => firstId });
  await repository.create({ title: 'Görev planını hazırlama' });
  const otherRepository = createTaskRepository({ filePath });
  const [updated, afterUpdate, removed, afterRemoval] = await Promise.all([
    repository.update(firstId, { status: 'completed' }),
    otherRepository.findById(firstId),
    otherRepository.remove(firstId),
    repository.list(),
  ]);
  assert.equal(updated.status, 'completed');
  assert.equal(afterUpdate.status, 'completed');
  assert.equal(removed, true);
  assert.deepEqual(afterRemoval, []);
});

test('Her işlem diski yeniden okuyarak harici değişiklikleri korur', async (t) => {
  const { repository, filePath } = await fixture(t);
  assert.deepEqual(await repository.list(), []);
  await save(filePath, JSON.stringify([validTask()]));
  assert.deepEqual(await repository.findById(firstId), validTask());
  await repository.create({ title: 'İkinci görev' });
  assert.equal((await repository.list()).length, 2);
});

test('Bozuk JSON ve dizi olmayan veri okunmaz veya üzerine yazılmaz', async (t) => {
  const { repository, filePath } = await fixture(t);
  for (const contents of ['{', '{"tasks":[]}', 'null', '']) {
    await save(filePath, contents);
    await assert.rejects(repository.list());
    await assert.rejects(repository.create({ title: 'Yeni görev' }));
    assert.equal(await readFile(filePath, 'utf8'), contents);
  }
});

test('Geçersiz kayıt şemaları ve yinelenen UUID değerleri reddedilir', async (t) => {
  const { repository, filePath } = await fixture(t);
  const cases = [
    [null],
    [[]],
    [{ ...validTask(), id: 'geçersiz-kimlik' }],
    [{ ...validTask(), title: '' }],
    [{ ...validTask(), title: ' Başlık ' }],
    [{ ...validTask(), title: 'x'.repeat(201) }],
    [{ ...validTask(), description: 4 }],
    [{ ...validTask(), description: 'x'.repeat(5001) }],
    [{ ...validTask(), status: 'cancelled' }],
    [{ ...validTask(), priority: 'urgent' }],
    [{ ...validTask(), assignee: 42 }],
    [{ ...validTask(), assignee: '' }],
    [{ ...validTask(), createdAt: '2026-02-30T10:00:00.000Z' }],
    [{ ...validTask(), updatedAt: 1792490400000 }],
    [{ ...validTask(), updatedAt: '2026-10-20' }],
    [{ ...validTask(), unknown: true }],
    [{ id: firstId, title: 'Eksik alanlar' }],
    [validTask(), validTask({ id: firstId.toUpperCase() })],
  ];
  for (const tasks of cases) {
    const contents = JSON.stringify(tasks);
    await save(filePath, contents);
    await assert.rejects(repository.list());
    await assert.rejects(repository.remove(firstId));
    assert.equal(await readFile(filePath, 'utf8'), contents);
  }
});

test('Başarısız güncelleme ve yinelenen oluşturma mevcut veriyi değiştirmez', async (t) => {
  const { repository, filePath } = await fixture(t, { idFactory: () => firstId });
  await repository.create({ title: 'Görev planını hazırlama' });
  const before = await readFile(filePath, 'utf8');
  await assert.rejects(repository.update(firstId, { status: 'invalid' }));
  await assert.rejects(repository.create({ title: 'Kimliği çakışan görev' }));
  assert.equal(await readFile(filePath, 'utf8'), before);
  assert.deepEqual(await repository.list(), [validTask()]);
});

test('Geçersiz UUID sürüm ve variant bitleri reddedilir ve dosya korunur', async (t) => {
  const { repository, filePath } = await fixture(t);
  const invalidIds = [
    '36b735af-c102-0a93-9d8c-b6e7c0860642',
    '36b735af-c102-9a93-9d8c-b6e7c0860642',
    '36b735af-c102-4a93-0d8c-b6e7c0860642',
    '36b735af-c102-4a93-dd8c-b6e7c0860642',
  ];
  for (const id of invalidIds) {
    const contents = JSON.stringify([validTask({ id })]);
    await save(filePath, contents);
    await assert.rejects(repository.list());
    await assert.rejects(repository.findById(id));
    await assert.rejects(repository.create({ title: 'Yeni görev' }));
    await assert.rejects(repository.update(id, { title: 'Yeni başlık' }));
    await assert.rejects(repository.remove(id));
    assert.equal(await readFile(filePath, 'utf8'), contents);
  }
});

test('Büyük harfle saklanan UUID okumada normalleştirilir ve küçük harfle güncellenip silinebilir', async (t) => {
  const { repository, filePath } = await fixture(t);
  const contents = JSON.stringify([validTask({ id: firstId.toUpperCase() })]);
  await save(filePath, contents);
  assert.deepEqual(await repository.list(), [validTask()]);
  assert.deepEqual(await repository.findById(firstId), validTask());
  assert.deepEqual(await repository.findById(firstId.toUpperCase()), validTask());
  assert.equal(await readFile(filePath, 'utf8'), contents);

  const updated = await repository.update(firstId, { title: 'Güncellenen görev' });
  assert.equal(updated.id, firstId);
  assert.equal(updated.title, 'Güncellenen görev');
  assert.equal(JSON.parse(await readFile(filePath, 'utf8'))[0].id, firstId);
  await save(filePath, contents);
  assert.equal(await repository.remove(firstId), true);
  assert.deepEqual(await repository.list(), []);
});

test('Oluşturma kimlik fabrikasından gelen büyük harfli UUID değerini normalleştirir', async (t) => {
  const { repository } = await fixture(t, { idFactory: () => firstId.toUpperCase() });
  const created = await repository.create({ title: 'Görev planını hazırlama' });
  assert.equal(created.id, firstId);
  assert.equal((await repository.update(firstId.toUpperCase(), { status: 'completed' })).status, 'completed');
  assert.equal(await repository.remove(firstId.toUpperCase()), true);
});

test('Okuma hatası boş veri sayılmaz; hata sonrasında kuyruk çalışmaya devam eder', async (t) => {
  const { repository, filePath } = await fixture(t);
  await mkdir(filePath, { recursive: true });
  await assert.rejects(repository.list());
  await assert.rejects(repository.create({ title: 'Kaydedilmemeli' }));
  await rm(filePath, { recursive: true });
  await repository.create({ title: 'Kurtarılan kayıt' });
  assert.equal((await repository.list())[0].title, 'Kurtarılan kayıt');
});

test('Başarısız atomik değiştirme geçici dosyayı temizler ve sonraki yazmayı engellemez', async (t) => {
  let blockRename = true;
  let filePath;
  const fixtureResult = await fixture(t, {
    clock: () => {
      if (blockRename) {
        mkdirSync(filePath, { recursive: true });
        blockRename = false;
      }
      return new Date(initialTime);
    },
  });
  filePath = fixtureResult.filePath;
  const { repository } = fixtureResult;
  await assert.rejects(repository.create({ title: 'Başarısız kayıt' }));
  assert.deepEqual(await readdir(join(filePath, '..')), ['tasks.json']);
  await rm(filePath, { recursive: true });
  await repository.create({ title: 'Başarılı kayıt' });
  assert.equal((await repository.list()).length, 1);
  assert.equal((await repository.list())[0].title, 'Başarılı kayıt');
});
