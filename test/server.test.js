import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { describe, test } from 'node:test';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testDataRoot = path.join(projectRoot, 'tmp', 'test-data');

async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function fixture(t) {
  await mkdir(testDataRoot, { recursive: true });
  const directory = await mkdtemp(path.join(testDataRoot, 'server-'));
  const filePath = path.join(directory, 'tasks.json');
  const children = new Set();

  async function start({ port, waitForReady = true } = {}) {
    const selectedPort = port ?? await availablePort();
    const child = spawn(process.execPath, ['src/server.js'], {
      cwd: projectRoot,
      env: { ...process.env, PORT: String(selectedPort), HOST: '127.0.0.1', DATA_FILE: filePath },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const record = { child, stdout: '', stderr: '', result: null };
    children.add(record);
    child.stdout.setEncoding('utf8').on('data', (data) => { record.stdout += data; });
    child.stderr.setEncoding('utf8').on('data', (data) => { record.stderr += data; });
    record.exit = new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (code, signal) => {
        record.result = { code, signal };
        children.delete(record);
        resolve(record.result);
      });
    });
    record.baseUrl = `http://127.0.0.1:${selectedPort}`;
    record.stop = async (signal = 'SIGTERM') => {
      if (!record.result) child.kill(signal);
      return Promise.race([
        record.exit,
        delay(7000, null, { ref: false }).then(() => { throw new Error('Sunucu işlemi kapanmadı.'); }),
      ]);
    };

    if (waitForReady) {
      const deadline = Date.now() + 7000;
      let ready = false;
      while (Date.now() < deadline) {
        if (record.result) throw new Error(`Sunucu hazır olmadan kapandı: ${record.stderr}`);
        try {
          const response = await fetch(`${record.baseUrl}/health`, { signal: AbortSignal.timeout(300) });
          if (response.status === 200 && (await response.json()).data.status === 'ok') {
            ready = true;
            break;
          }
        } catch {
          // Başlatma sırasında dinleme soketinin açılmasını bekle.
        }
        await delay(40);
      }
      assert.ok(ready, `Sunucu hazır olmalı. ${record.stderr}`);
    }
    return record;
  }

  t.after(async () => {
    await Promise.all([...children].map((record) => record.stop('SIGKILL')));
    const childPath = path.relative(testDataRoot, path.resolve(directory));
    assert.ok(childPath && !childPath.startsWith('..') && !path.isAbsolute(childPath));
    await rm(directory, { recursive: true, force: true });
  });

  return { start, filePath };
}

describe('Sunucu süreci', () => {
  test('gerçek giriş dosyası başlar ve veriyi süreç yeniden açıldığında korur', { timeout: 20000 }, async (t) => {
    const sandbox = await fixture(t);
    const first = await sandbox.start();
    const response = await fetch(`${first.baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Süreçler arasında korunan görev', assignee: 'ayse' }),
    });
    assert.equal(response.status, 201);
    const task = (await response.json()).data;
    const update = await fetch(`${first.baseUrl}/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert.equal(update.status, 200);
    await update.arrayBuffer();
    const persisted = JSON.parse(await readFile(sandbox.filePath, 'utf8'));
    assert.equal(persisted[0].status, 'completed');
    await first.stop();
    const second = await sandbox.start();
    const detail = await fetch(`${second.baseUrl}/tasks/${task.id}`);
    assert.equal(detail.status, 200);
    const restored = (await detail.json()).data;
    assert.equal(restored.title, task.title);
    assert.equal(restored.status, 'completed');
    assert.equal(restored.assignee, 'ayse');
    await second.stop();
  });

  test('SIGTERM sunucuyu hatasız kapatır', {
    timeout: 15000,
    skip: process.platform === 'win32' ? 'Windows SIGTERM gönderimini zorla sonlandırmaya dönüştürür; sinyal işleyicisi POSIX ortamında doğrulanır.' : false,
  }, async (t) => {
    const sandbox = await fixture(t);
    const server = await sandbox.start();
    const result = await server.stop('SIGTERM');
    assert.deepEqual(result, { code: 0, signal: null });
    await assert.rejects(fetch(`${server.baseUrl}/health`, { signal: AbortSignal.timeout(500) }));
  });

  test('bozuk veri dosyasında dinlemeye başlamadan hata koduyla kapanır', { timeout: 15000 }, async (t) => {
    const sandbox = await fixture(t);
    const corrupted = '{ geçersiz JSON';
    await writeFile(sandbox.filePath, corrupted, 'utf8');
    const server = await sandbox.start({ waitForReady: false });
    const result = await server.exit;
    assert.deepEqual(result, { code: 1, signal: null });
    assert.match(server.stderr, /Sunucu başlatılamadı/);
    assert.doesNotMatch(server.stdout, /adresinde çalışıyor/);
    assert.equal(await readFile(sandbox.filePath, 'utf8'), corrupted);
    await assert.rejects(fetch(`${server.baseUrl}/health`, { signal: AbortSignal.timeout(500) }));
  });

  test('geçersiz PORT değerleriyle hata koduyla kapanır', { timeout: 15000 }, async (t) => {
    const sandbox = await fixture(t);
    for (const port of ['0', '65536', '1.5', 'gecersiz']) {
      const server = await sandbox.start({ port, waitForReady: false });
      assert.deepEqual(await server.exit, { code: 1, signal: null });
      assert.match(server.stderr, /PORT/);
      assert.doesNotMatch(server.stdout, /adresinde çalışıyor/);
    }
  });
});
