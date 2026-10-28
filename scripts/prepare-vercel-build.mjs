import { cp, rm } from 'node:fs/promises';

await rm('.next', { recursive: true, force: true });
await cp('apps/web/.next', '.next', { recursive: true });
