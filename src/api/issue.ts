import type { IssueResponse } from '../types'

const DEFAULT_CE_URL = 'https://neoke-consent-engine.fly.dev'

export async function issueCredential(
  ceUrl: string,
  ceApiKey: string,
  /** Either an email address (to) or a wallet nodeId — nodeId is preferred when available. */
  target: { email: string } | { nodeId: string },
  credentialType: string,
  claims: Record<string, unknown>,
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
      body: JSON.stringify({ ...targetField, credentialType, claims }),
    })

    const raw = await res.text()
    let parsed: unknown
    try { parsed = JSON.parse(raw) } catch { parsed = raw }

    if (res.ok) return { result: parsed as IssueResponse }
    return { error: `HTTP ${res.status}: ${raw}` }
  } catch (e: unknown) {
    return { error: String(e) }
  }
}
