import { createApp } from '../apps/server/src/app.js';

const app = createApp();

export default function handler(req: any, res: any) {
  return app(req, res);
}
