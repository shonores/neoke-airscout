import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * POST /api/discover
 * Body: { email: string }
 * Returns: { did: string } or 404 { error: string }
 *
 * Resolves an email address to a Neoke wallet DID.
 *
 * Configuration (env vars):
 *   DEMO_DID_MAP  — JSON string mapping email → DID
 *                   e.g. '{"alice@example.com":"did:web:alice.id-node.neoke.com"}'
 *
 * For local dev, create a .env file with:
 *   DEMO_DID_MAP={"your@email.com":"did:web:your-node.id-node.neoke.com"}
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body as { email?: string } | undefined
  const email = body?.email?.trim().toLowerCase()

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' })
  }

  // Load email → DID registry from env
  const raw = process.env['DEMO_DID_MAP'] ?? '{}'
  let registry: Record<string, string>
  try {
    registry = JSON.parse(raw) as Record<string, string>
  } catch {
    registry = {}
  }

  const did = registry[email]
  if (!did) {
    return res.status(404).json({
      error: `No wallet registered for "${email}". Add this email to the DEMO_DID_MAP environment variable, or use the "Test Wallet DID" override in the configuration panel.`,
    })
  }

  return res.status(200).json({ did })
}
