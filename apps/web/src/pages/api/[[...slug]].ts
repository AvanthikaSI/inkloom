import type { NextApiRequest, NextApiResponse } from 'next';
import { createApp } from '../../../../server/dist/app.mjs';

const app = createApp();

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return app(req, res);
}
