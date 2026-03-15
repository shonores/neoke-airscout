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
 * Parameters passed to HotelScout via URL redirect after a delegation grant is approved.
 * Both sides must agree on these param names — this type is the single source of truth.
 * HotelScout's App.tsx parseUrlParams() must match these keys exactly.
 */
export interface DelegationRedirectParams {
  /** Opaque one-time grant token from CE. */
  grantToken: string
  /** Hotel search destination name shown in HotelScout's search bar. */
  destination?: string
  /** IATA city code used for hotel search. */
  cityCode?: string
  /** ISO date string (YYYY-MM-DD) for check-in. */
  checkIn?: string
  /** Pre-filled email (informational only — not used for CE verification). */
  email?: string
}

/**
 * Builds the redirect URL that AirScout sends to HotelScout after a delegation grant is approved.
 * Centralising construction here ensures param names stay consistent with HotelScout's parser.
 */
export function buildDelegationRedirectUrl(
  hotelScoutBaseUrl: string,
  params: DelegationRedirectParams,
): string {
  const url = new URL(hotelScoutBaseUrl)
  url.searchParams.set('grant_token', params.grantToken)
  if (params.destination) url.searchParams.set('destination', params.destination)
  if (params.cityCode) url.searchParams.set('city_code', params.cityCode)
  if (params.checkIn) url.searchParams.set('check_in', params.checkIn)
  if (params.email) url.searchParams.set('email', params.email)
  return url.toString()
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
    return { error: ceErrorMessage(parsed, raw, res.status) }
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
    return { error: ceErrorMessage(parsed, raw, res.status) }
  } catch (e: unknown) {
    return { error: String(e) }
  }
}
