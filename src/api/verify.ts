import type { VerifyResponse } from '../types'

const DEFAULT_CE_URL = 'https://neoke-consent-engine.fly.dev'

/** Extract a human-readable message from a CE structured error or raw string. */
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

export async function verify(
  ceUrl: string,
  ceApiKey: string,
  email: string,
  /** Either a credentialType preset ID or a templateId (prefixed with 'template:'). */
  credentialTypeOrTemplateId = 'mdoc-photoid-full',
  opts?: {
    transactionData?: string[]
    verifierName?: string
    logoUri?: string
    /** Pass the nodeId from a previous verify result to skip email re-resolution (faster). */
    nodeId?: string
  },
): Promise<{ result?: VerifyResponse; error?: string }> {
  const url = `${ceUrl || DEFAULT_CE_URL}/v1/verify`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 90_000)

  const isTemplate = credentialTypeOrTemplateId.startsWith('template:')
  const credentialSelector = isTemplate
    ? { templateId: credentialTypeOrTemplateId.slice('template:'.length) }
    : { credentialType: credentialTypeOrTemplateId }

  // Prefer nodeId when available — skips directory re-resolution on the CE side
  const targetField = opts?.nodeId ? { nodeId: opts.nodeId } : { to: email }

  const finalPayload = {
    ...targetField,
    ...credentialSelector,
    ...(opts?.transactionData?.length ? { transactionData: opts.transactionData } : {}),
    ...(opts?.verifierName ? { verifierName: opts.verifierName } : {}),
    ...(opts?.logoUri ? { logoUri: opts.logoUri } : {}),
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `ApiKey ${ceApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalPayload),
      signal: controller.signal,
    })

    const raw = await res.text()
    let parsed: unknown
    try { parsed = JSON.parse(raw) } catch { parsed = raw }

    if (res.ok) return { result: parsed as VerifyResponse }
    return { error: ceErrorMessage(parsed, raw, res.status) }
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') {
      return { error: 'Request timed out after 90 seconds' }
    }
    return { error: String(e) }
  } finally {
    clearTimeout(timeoutId)
  }
}

/** Lists credential type presets supported by this CE. Useful for validating config at startup. */
export async function listCredentialTypes(
  ceUrl: string,
): Promise<{ types?: Array<{ id: string; label: string }>; error?: string }> {
  try {
    const res = await fetch(`${ceUrl || DEFAULT_CE_URL}/v1/credential-types`)
    const raw = await res.text()
    let parsed: unknown
    try { parsed = JSON.parse(raw) } catch { parsed = raw }
    if (res.ok) {
      const data = parsed as { credentialTypes: Array<{ id: string; label: string }> }
      return { types: data.credentialTypes }
    }
    return { error: `HTTP ${res.status}: ${raw}` }
  } catch (e: unknown) {
    return { error: String(e) }
  }
}
