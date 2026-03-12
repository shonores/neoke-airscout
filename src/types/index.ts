export type AppState =
  | 'home'
  | 'discovering'
  | 'requesting'
  | 'sending'
  | 'pending'
  | 'success'
  | 'error'

export interface Config {
  nodeId: string
  apiKey: string
  ceUrl: string
  demoDid: string // optional DID override (bypasses email discovery for local testing)
}

export type GetToken = () => Promise<{ token: string } | { error: string }>

export interface CreateRequestResponse {
  sessionId: string
  requestUri: string
  rawLink?: string
}

export interface ConsentResponse {
  action?: string
  outcome?: string
  ruleLabel?: string
  reason?: string
  result?: {
    status?: string
    redirectUri?: string
  }
  queuedItem?: {
    id: string
    issuer?: string
    credentialTypes?: string[]
    requestedClaims?: string[]
    status?: string
  }
  [key: string]: unknown
}

export function ceOutcome(r: ConsentResponse): string {
  return r.action ?? r.outcome ?? ''
}

export interface QueueItem {
  id: string
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'error'
  resolvedAt?: string
  vpRequestExpiresAt?: string
}

export interface CredentialClaim {
  elementIdentifier: string
  elementValue: unknown
}

export interface CredentialResult {
  queryId?: string
  docType?: string
  format?: string
  deviceAuthVerified?: boolean
  signatureValid?: boolean
  statusCheck?: string
  nameSpaces?: Record<string, CredentialClaim[]>
  [key: string]: unknown
}

export interface SessionResult {
  valid?: boolean
  dcqlValid?: boolean
  credentials?: CredentialResult[]
  errors?: unknown[]
  sessionId?: string
  status?: string
  result?: {
    valid?: boolean
    dcqlValid?: boolean
    credentials?: CredentialResult[]
    errors?: unknown[]
  }
  [key: string]: unknown
}
