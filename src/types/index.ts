export type AppState = 'home' | 'verifying' | 'success' | 'error'

export interface Config {
  ceUrl: string
  ceApiKey: string
}

export interface VerifyResponse {
  action: 'auto_executed' | 'approved' | 'rejected' | 'timeout' | 'error'
  claims?: Record<string, unknown>
  reason?: string
  requestId?: string
  nodeId?: string
}
