import type { Config, GetToken } from '../types'

export function deriveNodeHost(nodeId: string): string {
  if (nodeId.includes('.')) {
    return nodeId
  }
  return `${nodeId}.id-node.neoke.com`
}

interface CachedToken {
  token: string
  expiresAt: number
  nodeId: string
  apiKey: string
}

let tokenCache: CachedToken | null = null

export function createGetToken(config: Config): GetToken {
  return async () => {
    const now = Date.now()
    const BUFFER_MS = 5 * 60 * 1000

    if (
      tokenCache &&
      tokenCache.nodeId === config.nodeId &&
      tokenCache.apiKey === config.apiKey &&
      now < tokenCache.expiresAt - BUFFER_MS
    ) {
      return { token: tokenCache.token }
    }

    if (!config.nodeId || !config.apiKey) {
      return { error: 'Node ID and API Key are required. Please open Settings.' }
    }

    const nodeHost = deriveNodeHost(config.nodeId)
    try {
      const res = await fetch(`https://${nodeHost}/:/auth/authn`, {
        method: 'POST',
        headers: { Authorization: `ApiKey ${config.apiKey}` },
      })
      const raw = await res.text()
      if (!res.ok) return { error: `Auth failed: HTTP ${res.status} — ${raw}` }
      const data = JSON.parse(raw) as Record<string, unknown>
      const token = (data['token'] ?? data['access_token'] ?? data['accessToken']) as string | undefined
      if (!token) return { error: `Auth response missing token. Got: ${raw}` }
      const expiresIn = (data['expiresIn'] ?? data['expires_in'] ?? 3600) as number
      tokenCache = { token, expiresAt: now + expiresIn * 1000, nodeId: config.nodeId, apiKey: config.apiKey }
      return { token }
    } catch (e) {
      return { error: String(e) }
    }
  }
}

export function clearTokenCache() {
  tokenCache = null
}
