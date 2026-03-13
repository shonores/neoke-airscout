const DEFAULT_CE_URL = 'https://neoke-consent-engine.fly.dev'

export interface DelegateInput {
  userEmail: string
  requesterService: string
  recipientService: string
  credentialTypeId: string
  purpose: string
  ttlMinutes?: number
}

export interface DelegateResult {
  grantToken: string
  expiresAt: string
}

/**
 * Calls POST /v1/consent/delegate on the Consent Engine.
 *
 * Creates a delegation grant: a short-lived, single-use opaque token that
 * allows the recipient service to retrieve the user's verified claims without
 * ever needing their email address before consent is granted.
 *
 * The caller (AirScout) must have obtained the user's explicit consent before
 * calling this — typically by showing a consent modal with the fields listed.
 */
export async function createDelegationGrant(
  ceUrl: string,
  ceApiKey: string,
  input: DelegateInput,
): Promise<{ result?: DelegateResult; error?: string }> {
  const url = `${ceUrl || DEFAULT_CE_URL}/v1/consent/delegate`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `ApiKey ${ceApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail: input.userEmail,
        requesterService: input.requesterService,
        recipientService: input.recipientService,
        credentialTypeId: input.credentialTypeId,
        purpose: input.purpose,
        ttlMinutes: input.ttlMinutes ?? 30,
      }),
    })

    const raw = await res.text()
    let parsed: unknown
    try { parsed = JSON.parse(raw) } catch { parsed = raw }

    if (res.ok) return { result: parsed as DelegateResult }
    return { error: `HTTP ${res.status}: ${raw}` }
  } catch (e: unknown) {
    return { error: String(e) }
  }
}
