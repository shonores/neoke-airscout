import type { VerifyResponse } from '../types'

const DEFAULT_CE_URL = 'https://neoke-consent-engine.fly.dev'

export async function verify(
  ceUrl: string,
  ceApiKey: string,
  email: string,
  credentialType = 'mdoc-photoid-full',
): Promise<{ result?: VerifyResponse; error?: string }> {
  const url = `${ceUrl || DEFAULT_CE_URL}/v1/verify`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 90_000)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `ApiKey ${ceApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: email, credentialType }),
      signal: controller.signal,
    })

    const raw = await res.text()
    let parsed: unknown
    try { parsed = JSON.parse(raw) } catch { parsed = raw }

    if (res.ok) return { result: parsed as VerifyResponse }
    return { error: `HTTP ${res.status}: ${raw}` }
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') {
      return { error: 'Request timed out after 90 seconds' }
    }
    return { error: String(e) }
  } finally {
    clearTimeout(timeoutId)
  }
}
