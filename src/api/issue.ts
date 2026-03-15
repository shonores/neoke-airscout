import type { IssueResponse } from '../types'

const DEFAULT_CE_URL = 'https://neoke-consent-engine.fly.dev'

function ceErrorMessage(parsed: unknown, raw: string, status: number): string {
  if (parsed && typeof parsed === 'object') {
    const err = (parsed as Record<string, unknown>).error
    if (err && typeof err === 'object') {
      const msg = (err as Record<string, unknown>).message
      const code = (err as Record<string, unknown>).code
      if (typeof msg === 'string') return code ? `[${code}] ${msg}` : msg
    }
  }
  return `HTTP ${status}: ${raw}`
}

export async function issueCredential(
  ceUrl: string,
  ceApiKey: string,
  /** Either an email address (to) or a wallet nodeId — nodeId is preferred when available. */
  target: { email: string } | { nodeId: string },
  credentialType: string,
  claims: Record<string, unknown>,
  issuerNodeId = 'airscout',
  issuerNameHint?: string,
): Promise<{ result?: IssueResponse; error?: string }> {
  const url = `${ceUrl || DEFAULT_CE_URL}/v1/issue`
  const targetField = 'nodeId' in target ? { nodeId: target.nodeId } : { to: target.email }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `ApiKey ${ceApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...targetField, credentialType, claims, issuerNodeId, ...(issuerNameHint ? { issuerNameHint } : {}) }),
    })

    const raw = await res.text()
    let parsed: unknown
    try { parsed = JSON.parse(raw) } catch { parsed = raw }

    if (res.ok) return { result: parsed as IssueResponse }
    return { error: ceErrorMessage(parsed, raw, res.status) }
  } catch (e: unknown) {
    return { error: String(e) }
  }
}
