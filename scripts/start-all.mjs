import { spawn, spawnSync } from 'node:child_process';
import { createConnection } from 'node:net';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const services = [];
const useInfrastructure = process.argv.includes('--infra');
const apiPort = Number.parseInt(process.env.PORT || '4000', 10);
const webPort = Number.parseInt(process.env.WEB_PORT || '3000', 10);

function commandExists(command, args = ['--version']) {
  const result = spawnSync(command, args, { stdio: 'ignore', shell: false });
  return result.status === 0;
}

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: false,
    ...options
  });
  services.push(child);
  child.on('exit', (code, signal) => {
    if (!isShuttingDown && code !== 0) {
      console.error(`[Inkloom] ${command} exited with ${signal || `code ${code}`}.`);
    }
  });
  return child;
}

function waitForPort(port, host = '127.0.0.1', timeoutMs = 60_000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = createConnection({ port, host });
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
          return;
        }
        setTimeout(attempt, 500);
      });
    };
    attempt();
  });
}

async function waitForApi(timeoutMs = 60_000) {
  await waitForHttp(`http://127.0.0.1:${apiPort}/api/health`, timeoutMs);
}

async function waitForHttp(url, timeoutMs = 60_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The service may still be compiling or bootstrapping.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function stopServices() {
  isShuttingDown = true;
  for (const service of services) {
    if (!service.killed) service.kill('SIGTERM');
  }
}

let isShuttingDown = false;
process.once('SIGINT', () => {
  stopServices();
  process.exit(0);
});
process.once('SIGTERM', () => {
  stopServices();
  process.exit(0);
});

try {
  if (useInfrastructure) {
    if (!commandExists('docker', ['compose', 'version'])) {
      throw new Error('Docker Desktop is required for --infra. Remove --infra to run without Docker.');
    }
    console.log('[Inkloom] Starting PostgreSQL and ChromaDB...');
    const composeCommand = process.platform === 'win32' ? 'docker.exe' : 'docker';
    const compose = spawnSync(composeCommand, ['compose', 'up', '-d'], {
      cwd: root,
      env: process.env,
      stdio: 'inherit'
    });
    if (compose.status !== 0) {
      throw new Error('Docker Compose could not start the local infrastructure.');
    }
    await Promise.all([waitForPort(5432), waitForPort(8000)]);
    console.log('[Inkloom] PostgreSQL and ChromaDB are ready.');
  } else {
    console.log('[Inkloom] Running without Docker infrastructure.');
  }

  const nodeModules = join(root, 'node_modules');
  const tsxCli = join(nodeModules, 'tsx', 'dist', 'cli.mjs');
  const nextCli = join(nodeModules, 'next', 'dist', 'bin', 'next');
  console.log(`[Inkloom] Starting API on http://localhost:${apiPort}...`);
  run(process.execPath, [tsxCli, 'apps/server/src/index.ts']);
  await waitForApi();

  console.log(`[Inkloom] Starting frontend on http://localhost:${webPort}...`);
  run(process.execPath, [nextCli, 'dev', 'apps/web', '-p', String(webPort)]);
  await waitForHttp(`http://127.0.0.1:${webPort}`);

  console.log('[Inkloom] All services are running. Press Ctrl+C to stop the API and frontend.');
  await new Promise(() => {});
} catch (error) {
  console.error(`[Inkloom] Startup failed: ${error.message}`);
  stopServices();
  process.exitCode = 1;
}
