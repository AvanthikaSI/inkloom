import fs from 'node:fs';
import path from 'node:path';

const nextDir = path.resolve(process.cwd(), 'apps', 'web', '.next');
if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('[Inkloom] Cleaned apps/web/.next build cache for a fresh build.');
  } catch (err) {
    console.warn('[Inkloom] Warning: could not remove .next directory:', err.message);
  }
}
