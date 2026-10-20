import { resolve } from 'node:path';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { createTaskRepository } from './repositories/tasks.repository.js';

const portText = process.env.PORT ?? '3000';
const host = process.env.HOST ?? '127.0.0.1';

try {
  if (!/^\d+$/.test(portText) || Number(portText) < 1 || Number(portText) > 65535) {
    throw new Error('PORT 1-65535 arasında bir tam sayı olmalıdır.');
  }
  if (!host.trim()) throw new Error('HOST boş olamaz.');
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin && (!['http:', 'https:'].includes(new URL(corsOrigin).protocol)
    || new URL(corsOrigin).origin !== corsOrigin)) {
    throw new Error('CORS_ORIGIN yol içermeyen geçerli bir HTTP origin olmalıdır.');
  }

  const repository = createTaskRepository({
    ...(process.env.DATA_FILE ? { filePath: resolve(process.env.DATA_FILE) } : {}),
  });
  await repository.list();
  const server = createServer(createApp({ repository, corsOrigin }));
  server.on('error', (error) => {
    console.error('Sunucu başlatılamadı:', error.message);
    process.exitCode = 1;
  });
  server.listen(Number(portText), host, () => {
    console.log(`TaskFlow API http://${host}:${portText} adresinde çalışıyor.`);
  });

  let closing = false;
  function shutdown() {
    if (closing) return;
    closing = true;
    server.close((error) => {
      if (error) process.exitCode = 1;
    });
    const timeout = setTimeout(() => {
      server.closeAllConnections();
    }, 5000);
    timeout.unref();
  }
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
} catch (error) {
  console.error('Sunucu başlatılamadı:', error.message);
  process.exitCode = 1;
}
