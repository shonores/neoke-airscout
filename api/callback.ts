import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * POST /api/callback
 *
 * Receives the async completion callback from the verifier node after
 * a SIOP/VP session completes. We simply acknowledge receipt so the
 * node does not retry. Session results are fetched directly from the
 * IDN via GET /:/auth/siop/session/{sessionId} (see pollSessionResult).
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  const body = req.body as Record<string, unknown>
  console.log('[callback] VP session complete, sessionId:', body?.sessionId ?? body?.state)

  return res.status(200).json({ ok: true })
}
