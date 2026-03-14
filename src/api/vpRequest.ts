import type { GetToken, CreateRequestResponse } from '../types'
import { deriveNodeHost } from './auth'

const AIRSCOUT_LOGO_URI =
  "data:image/svg+xml,%3Csvg%20width%3D%2264%22%20height%3D%2264%22%20viewBox%3D%220%200%2064%2064%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%233f54cc%22%2F%3E%3Cpath%20d%3D%22M44%2020L20%2032l6%203%202%209%205-5%208%203%203-22z%22%20fill%3D%22white%22%2F%3E%3C%2Fsvg%3E"

// mDOC Photo ID — Full Profile (matches neoke-test-verifier preset 'mdoc-photoid-full')
const NS = 'org.iso.23220.1'
const claim = (name: string) => ({ path: [NS, name] })

const PHOTO_ID_DCQL_QUERY = {
  credentials: [
    {
      id: 'cred1',
      format: 'mso_mdoc',
      require_cryptographic_holder_binding: true,
      meta: { doctype_value: 'org.iso.23220.photoid.1' },
      claims: [
        claim('family_name'),
        claim('given_name'),
        claim('birth_date'),
        claim('document_number'),
        claim('issue_date'),
        claim('expiry_date'),
        claim('issuing_country'),
      ],
    },
  ],
}

export async function createPhotoIdRequest(
  nodeId: string,
  getToken: GetToken,
  callbackUrl: string,
  opts?: { transactionData?: string[]; clientName?: string; logoUri?: string },
): Promise<{ result?: CreateRequestResponse; error?: string }> {
  const tokenResult = await getToken()
  if ('error' in tokenResult) return { error: tokenResult.error }

  const url = `https://${deriveNodeHost(nodeId)}/:/auth/siop/request`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenResult.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'reference',
        responseType: 'vp_token',
        responseMode: 'direct_post',
        dcqlQuery: PHOTO_ID_DCQL_QUERY,
        trustProfiles: ['EU Trust Framework'],
        clientMetadata: {
          client_name: opts?.clientName ?? 'AirScout Airlines',
          logo_uri: opts?.logoUri ?? AIRSCOUT_LOGO_URI,
        },
        ...(opts?.transactionData?.length ? { transactionData: opts.transactionData } : {}),
        onComplete: {
          url: callbackUrl,
          dataMode: 'full',
          mode: 'async',
          retry: { maxAttempts: 3, delayMs: 1000 },
        },
      }),
    })
    const raw = await res.text()
    if (!res.ok) return { error: `HTTP ${res.status}: ${raw}` }
    const d = JSON.parse(raw) as Record<string, unknown>
    return {
      result: {
        sessionId: (d['sessionId'] ?? d['id'] ?? d['session_id'] ?? '') as string,
        requestUri: (d['requestUri'] ?? d['request_uri'] ?? '') as string,
        rawLink: (d['invocationUrl'] ?? d['rawLink'] ?? d['requestUri'] ?? d['request_uri'] ?? '') as string,
      },
    }
  } catch (e) {
    return { error: String(e) }
  }
}

/**
 * Fetch a completed VP session result from the verifier node.
 *
 * Endpoint: GET /:/auth/siop/session/{sessionId}
 * Auth: Bearer token obtained by authenticating with the node API key.
 *
 * Per CE team guidance: the sessionId must be captured at VP request creation
 * time and used here — do NOT use any redirectUri from the CE auto_executed
 * response for polling. That redirectUri is a browser redirect URL, not an API.
 */
export async function fetchSessionResult(
  nodeId: string,
  getToken: GetToken,
  sessionId: string,
): Promise<{ data?: unknown; error?: string }> {
  const tokenResult = await getToken()
  if ('error' in tokenResult) return { error: tokenResult.error }

  try {
    const res = await fetch(
      `https://${deriveNodeHost(nodeId)}/:/auth/siop/session/${sessionId}`,
      { headers: { Authorization: `Bearer ${tokenResult.token}` }, cache: 'no-store' },
    )
    const raw = await res.text()
    if (!res.ok) return { error: `HTTP ${res.status}: ${raw}` }
    return { data: JSON.parse(raw) }
  } catch (e) {
    return { error: String(e) }
  }
}

/**
 * Poll the session endpoint until a terminal status is reached.
 *
 * Used after auto_executed: the CE immediately calls /respond on the node on
 * behalf of the wallet (standing consent), but the session result may take a
 * moment to become available. Poll with a short interval until terminal.
 */
export async function pollSessionResult(
  nodeId: string,
  getToken: GetToken,
  sessionId: string,
  opts: { intervalMs?: number; maxAttempts?: number } = {},
): Promise<{ data?: unknown; error?: string }> {
  const intervalMs = opts.intervalMs ?? 1500
  const maxAttempts = opts.maxAttempts ?? 20 // ~30s

  for (let i = 0; i < maxAttempts; i++) {
    const { data, error } = await fetchSessionResult(nodeId, getToken, sessionId)
    if (error) return { error }

    const d = data as Record<string, unknown> | undefined
    const status = d?.['status'] as string | undefined
    if (status === 'complete' || status === 'failed' || status === 'expired') {
      return { data }
    }
    // Also accept any response that has a nested "result" with credentials
    const result = d?.['result'] as Record<string, unknown> | undefined
    if (result?.['credentials']) return { data }

    if (i < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, intervalMs))
    }
  }

  return { error: 'Session result polling timed out (no terminal status after 30s)' }
}
