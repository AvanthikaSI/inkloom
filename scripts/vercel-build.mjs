import { spawnSync, spawn } from 'node:child_process';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const esbuildCli = join(root, 'node_modules', 'esbuild', 'bin', 'esbuild');
const nextCli = join(root, 'node_modules', 'next', 'dist', 'bin', 'next');

console.log('[Inkloom] Building backend serverless artifacts...');
const serverBuild = spawnSync(
  process.execPath,
  [
    esbuildCli,
    'apps/server/src/app.ts',
    '--bundle',
    '--platform=node',
    '--target=node20',
    '--format=esm',
    '--packages=external',
    '--outfile=apps/server/dist/app.mjs'
  ],
  {
    cwd: root,
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: 'inherit'
  }
);

if (serverBuild.status !== 0) {
  console.error('[Inkloom] Failed to bundle backend artifacts.');
  process.exit(serverBuild.status || 1);
}

console.log('[Inkloom] Backend artifacts ready. Building Next.js web application...');
const build = spawn(process.execPath, [nextCli, 'build', 'apps/web'], {
  cwd: root,
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: 'inherit'
});

build.on('error', (error) => {
  console.error(`[Inkloom] Vercel build failed to start: ${error.message}`);
  process.exitCode = 1;
});

build.on('exit', (code, signal) => {
  if (signal) {
    console.error(`[Inkloom] Vercel build terminated by ${signal}.`);
    process.exitCode = 1;
    return;
  }

  process.exitCode = code ?? 1;
});
