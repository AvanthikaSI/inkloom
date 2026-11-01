import { spawn } from 'node:child_process';
import { join } from 'node:path';
import process from 'node:process';

const nextCli = join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const build = spawn(process.execPath, [nextCli, 'build', 'apps/web'], {
  cwd: process.cwd(),
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
