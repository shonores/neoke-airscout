import type { IssueResponse } from '../types'

const DEFAULT_CE_URL = 'https://neoke-consent-engine.fly.dev'

export async function issueCredential(
  ceUrl: string,
  ceApiKey: string,
  to: string,
  credentialType: string,
  claims: Record<string, unknown>,
): Promise<{ result?: IssueResponse; error?: string }> {
  const url = `${ceUrl || DEFAULT_CE_URL}/v1/issue`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `ApiKey ${ceApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, credentialType, claims }),
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
