const DEFAULT_CE_URL = 'https://neoke-consent-engine.fly.dev'

export interface DelegateInput {
  userEmail: string
  requesterService: string
  recipientService: string
  credentialTypeId: string
  purpose: string
  ttlMinutes?: number
}

/** Returned immediately after POST /v1/consent/delegate */
export interface DelegationRequest {
  delegationId: string
  status: 'pending_approval'
  expiresAt: string
}

/** Returned when polling GET /v1/consent/delegate/:id */
export interface DelegationStatus {
  delegationId: string
  status: 'pending_approval' | 'approved' | 'rejected' | 'expired'
  grantToken?: string
  expiresAt: string
}

/**
 * Step 1 — Initiates a wallet-centric delegation request.
 * Returns immediately with status:'pending_approval'. The user must approve
 * in their wallet before a grant token is issued.
 */
export async function requestDelegation(
  ceUrl: string,
  ceApiKey: string,
  input: DelegateInput,
): Promise<{ request?: DelegationRequest; error?: string }> {
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

    if (res.ok) return { request: parsed as DelegationRequest }
    return { error: `HTTP ${res.status}: ${raw}` }
  } catch (e: unknown) {
    return { error: String(e) }
  }
}

/**
 * Step 2 — Polls the delegation status once.
 * Call repeatedly until status !== 'pending_approval'.
 */
export async function getDelegationStatus(
  ceUrl: string,
  ceApiKey: string,
  delegationId: string,
): Promise<{ status?: DelegationStatus; error?: string }> {
  const url = `${ceUrl || DEFAULT_CE_URL}/v1/consent/delegate/${delegationId}`

  try {
    const res = await fetch(url, {
      headers: { Authorization: `ApiKey ${ceApiKey}` },
    })

    const raw = await res.text()
    let parsed: unknown
    try { parsed = JSON.parse(raw) } catch { parsed = raw }

    if (res.ok) return { status: parsed as DelegationStatus }
    return { error: `HTTP ${res.status}: ${raw}` }
  } catch (e: unknown) {
    return { error: String(e) }
  }
}
