import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { pollQueueItem } from '../api/consent'
import { fetchSessionResult } from '../api/vpRequest'
import type { GetToken } from '../types'

const POLL_INTERVAL_MS = 5000
const MAX_ATTEMPTS = 60

interface Props {
  nodeId: string
  getToken: GetToken
  ceUrl: string
  queueItemId: string
  sessionId?: string
  onResolved: (data: unknown) => void
  onRejected: (reason: string) => void
  onCancel: () => void
}

export function ConsentPendingStep({
  nodeId,
  getToken,
  ceUrl,
  queueItemId,
  sessionId,
  onResolved,
  onRejected,
  onCancel,
}: Props) {
  const [elapsed, setElapsed] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [pollError, setPollError] = useState<string | null>(null)
  const startTime = useRef(Date.now())
  const attemptsRef = useRef(0)
  const stoppedRef = useRef(false)

  useEffect(() => {
    const tick = async () => {
      if (stoppedRef.current) return
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000))

      const { item, error } = await pollQueueItem(ceUrl, queueItemId)
      if (stoppedRef.current) return

      if (error) {
        setPollError(error)
        return
      }

      if (item) {
        attemptsRef.current += 1
        setAttempts(attemptsRef.current)

        if (item.status === 'approved') {
          stoppedRef.current = true
          clearInterval(interval)
          if (sessionId) {
            const { data } = await fetchSessionResult(nodeId, getToken, sessionId)
            onResolved(data)
          } else {
            onResolved(item)
          }
          return
        }

        if (item.status === 'rejected' || item.status === 'expired') {
          stoppedRef.current = true
          clearInterval(interval)
          onRejected(`Request was ${item.status} in the wallet`)
          return
        }

        if (attemptsRef.current >= MAX_ATTEMPTS) {
          stoppedRef.current = true
          clearInterval(interval)
          onRejected('Request timed out — no response from wallet after 5 minutes')
        }
      }
    }

    const interval = setInterval(tick, POLL_INTERVAL_MS)
    tick()
    return () => {
      stoppedRef.current = true
      clearInterval(interval)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-white rounded-xl shadow-[0px_2px_5px_rgba(36,35,41,0.03),0px_9px_9px_rgba(36,35,41,0.03),0px_21px_13px_rgba(36,35,41,0.02)]
                 p-8 w-full max-w-[480px] flex flex-col gap-6"
    >
      {/* Icon + title */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <p className="text-[18px] font-bold text-[#28272e]">Check your Neoke wallet</p>
          <p className="text-[14px] text-[#6d6b7e] mt-1 leading-snug">
            A consent request has been sent to your wallet. Please approve it to continue.
          </p>
        </div>
      </div>

      {/* Pulse indicator */}
      <div className="flex items-center gap-3 py-3 px-4 bg-amber-50 rounded-xl border border-amber-100">
        <span className="inline-flex relative">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping absolute" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 relative" />
        </span>
        <span className="text-[13px] text-amber-700">
          Waiting for wallet approval · {elapsed}s elapsed
        </span>
      </div>

      {/* Queue ID */}
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase text-[#8e8e93] tracking-wide">Queue reference</p>
        <p className="text-[13px] font-mono text-[#6d6b7e] break-all">{queueItemId}</p>
      </div>

      {pollError && (
        <p className="text-[13px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          Poll error: {pollError}
        </p>
      )}

      <div className="flex items-center justify-between text-[12px] text-[#8e8e93]">
        <span>Poll #{attempts} · checking every 5s</span>
        <button
          onClick={onCancel}
          className="text-[#6d6b7e] hover:text-red-500 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  )
}
