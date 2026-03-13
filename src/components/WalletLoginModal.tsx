import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import type { VerifyResponse } from '../types'

interface Props {
  onVerify: (email: string) => Promise<{ result?: VerifyResponse; error?: string }>
  onSuccess: (claims: Record<string, unknown>, email: string) => void
  onClose: () => void
}

export function WalletLoginModal({ onVerify, onSuccess, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState<'form' | 'verifying' | 'check-wallet'>('form')
  const [error, setError] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim().includes('@')) return
    setPhase('verifying')
    setError('')

    timerRef.current = setTimeout(() => setPhase('check-wallet'), 5500)

    const { result, error: err } = await onVerify(email)

    if (timerRef.current) clearTimeout(timerRef.current)

    if (err || !result) {
      setError(err ?? 'No response from consent engine')
      setPhase('form')
      return
    }

    if (result.action === 'auto_executed' || result.action === 'approved') {
      onSuccess(result.claims ?? {}, email)
      return
    }

    if (result.action === 'rejected') {
      setError(`Login rejected by wallet: ${result.reason ?? 'no reason given'}`)
    } else if (result.action === 'timeout') {
      setError('No response from wallet. Please try again.')
    } else {
      setError(`Login failed: ${result.action}`)
    }
    setPhase('form')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={phase === 'form' ? onClose : undefined}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-[380px] flex flex-col gap-5 text-center"
      >
        {phase === 'form' ? (
          <>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f7f8ff] flex items-center justify-center
                         hover:bg-[#eaeefc] transition-colors"
            >
              <svg width="14" height="14" fill="none" stroke="#6d6b7e" strokeWidth={2.5} strokeLinecap="round" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="w-14 h-14 rounded-full bg-[#eaeefc] flex items-center justify-center mx-auto">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#3f54cc" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                <line x1="12" y1="12" x2="12" y2="16" />
                <circle cx="12" cy="12" r="1" fill="#3f54cc" />
              </svg>
            </div>

            <div>
              <h3 className="text-[20px] font-black text-[#28272e]">Login with your wallet</h3>
              <p className="text-[14px] text-[#6d6b7e] mt-1 leading-snug">
                Enter your email to connect your Neoke identity wallet
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoFocus
                className="w-full border border-[#e4e4e7] rounded-2xl px-4 py-3 text-[15px] text-[#28272e]
                           focus:outline-none focus:border-[#3f54cc] focus:ring-2 focus:ring-[#3f54cc]/20"
              />
              {error && <p className="text-[13px] text-red-500 leading-snug">{error}</p>}
              <button
                type="submit"
                disabled={!email.trim().includes('@')}
                className="w-full bg-[#3f54cc] text-white font-bold text-[15px] py-3.5 rounded-full
                           hover:bg-[#3448b8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Login with wallet
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="relative w-14 h-14 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-[#e8eaf6]" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#3f54cc] animate-spin" />
            </div>

            <div>
              <p className="text-[18px] font-bold text-[#28272e]">
                {phase === 'check-wallet' ? 'Check your wallet' : 'Connecting…'}
              </p>
              <p className="text-[14px] text-[#6d6b7e] mt-1 leading-snug">
                {phase === 'check-wallet'
                  ? 'Open your Neoke wallet and approve the login request'
                  : 'Routing a secure request to your Neoke wallet'}
              </p>
            </div>

            {phase === 'check-wallet' && (
              <div className="flex items-center justify-center gap-2 text-[13px] text-[#6d6b7e]">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                Waiting for approval…
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
