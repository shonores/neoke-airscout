import type { ConsentResponse, QueueItem } from '../types'

export async function sendToWallet(
  ceUrl: string,
  targetWalletDid: string,
  rawLink: string,
): Promise<{ result?: ConsentResponse; error?: string }> {
  try {
    const res = await fetch(`${ceUrl}/consent/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: targetWalletDid, rawLink }),
    })
    const raw = await res.text()
    if (!res.ok) return { error: `Consent Engine error (HTTP ${res.status}): ${raw}` }
    return { result: JSON.parse(raw) as ConsentResponse }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function pollQueueItem(
  ceUrl: string,
  itemId: string,
): Promise<{ item?: QueueItem; error?: string }> {
  try {
    const res = await fetch(`${ceUrl}/queue/${itemId}/status`, { cache: 'no-store' })
    const raw = await res.text()
    if (!res.ok) return { error: `HTTP ${res.status}` }
    return { item: JSON.parse(raw) as QueueItem }
  } catch (e) {
    return { error: String(e) }
  }
}
