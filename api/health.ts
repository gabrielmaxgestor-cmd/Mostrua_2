import type { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({ ok: true, env: process.env.NODE_ENV, timestamp: new Date().toISOString() });
}
