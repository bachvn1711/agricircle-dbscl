import path from 'node:path';
import { createApp } from './app.js';

function parsePort(rawPort) {
  if (rawPort === undefined || rawPort === '') {
    return 3000;
  }
  if (!/^(0|[1-9]\d{0,4})$/.test(rawPort)) {
    throw new Error(`Invalid PORT: ${rawPort}`);
  }
  const num = Number(rawPort);
  if (!Number.isInteger(num) || num < 0 || num > 65535) {
    throw new Error(`Invalid PORT: ${rawPort}`);
  }
  return num;
}

function parseHost(rawHost) {
  if (rawHost === undefined || rawHost === '') {
    return '0.0.0.0';
  }
  const trimmed = rawHost.trim();
  if (trimmed === '' || /[\u0000-\u001f\u007f\s]/.test(trimmed)) {
    throw new Error('Invalid HOST');
  }
  return trimmed;
}

function parseDbPath(rawDbPath) {
  if (rawDbPath === undefined || rawDbPath === '') {
    return 'data/agricircle.db';
  }
  if (rawDbPath.trim() === '' || /\u0000/.test(rawDbPath)) {
    throw new Error('Invalid DB_PATH');
  }
  return rawDbPath;
}

const port = parsePort(process.env.PORT);
const host = parseHost(process.env.HOST);
const dbPath = parseDbPath(process.env.DB_PATH);
const adminPin = process.env.ADMIN_PIN;

const app = await createApp({
  dbPath,
  adminPin,
  staticDir: path.resolve('public'),
  sharedDir: path.resolve('src/shared'),
  leafletDistDir: path.resolve('node_modules/leaflet/dist')
});

function shutdown() {
  app.close().finally(() => {
    process.exitCode = 0;
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

app.server.listen(port, host, () => {
  const addr = app.server.address();
  const actualPort = typeof addr === 'object' && addr ? addr.port : port;
  process.stdout.write(`AgriCircle server listening on http://${host}:${actualPort}\n`);
});
