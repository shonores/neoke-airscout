import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { PassengerData, VerifyResponse } from '../types'

function extractFromClaims(claims: Record<string, unknown>): Partial<PassengerData> {
  const flat: Record<string, unknown> = { ...claims }
  if (typeof claims.electronicPassport === 'object' && claims.electronicPassport) {
    Object.assign(flat, claims.electronicPassport as object)
  }
  const s = (v: unknown) => (v ? String(v) : '')
  return {
    firstName:   s(flat.given_name   ?? flat.firstName  ?? flat.givenName),
    lastName:    s(flat.family_name  ?? flat.lastName   ?? flat.familyName ?? flat.surname),
    email:       s(flat.email        ?? flat.email_address ?? flat.emailAddress),
    birthDate:   s(flat.birth_date   ?? flat.birthDate  ?? flat.date_of_birth)  || undefined,
    nationality: s(flat.nationality  ?? flat.issuing_country ?? flat.issuingCountry) || undefined,
  }
}

interface Props {
  initialData?: Partial<PassengerData>
  onBack: () => void
  onContinue: (data: PassengerData) => void
  onRequestWalletVerify: (email: string) => Promise<{ result?: VerifyResponse; error?: string }>
}

export function PassengerInfoStep({ initialData, onBack, onContinue, onRequestWalletVerify }: Props) {
  const [email,       setEmail]       = useState(initialData?.email       ?? '')
  const [firstName,   setFirstName]   = useState(initialData?.firstName   ?? '')
  const [lastName,    setLastName]    = useState(initialData?.lastName    ?? '')
  const [nationality, setNationality] = useState(initialData?.nationality ?? '')
  const [birthDate,   setBirthDate]   = useState(initialData?.birthDate   ?? '')

  const [walletLoading, setWalletLoading] = useState(false)
  const [walletWaiting, setWalletWaiting] = useState(false)
  const [walletError,   setWalletError]   = useState('')
  const [walletFilled,  setWalletFilled]  = useState(false)

  // Sync when initialData changes (e.g. user logs in via header)
  useEffect(() => {
    if (!initialData) return
    if (initialData.email)       setEmail(initialData.email)
    if (initialData.firstName)   setFirstName(initialData.firstName)
    if (initialData.lastName)    setLastName(initialData.lastName)
    if (initialData.nationality) setNationality(initialData.nationality)
    if (initialData.birthDate)   setBirthDate(initialData.birthDate)
    if (initialData.firstName || initialData.lastName) setWalletFilled(true)
  }, [initialData])

  const canWalletFill = email.trim().includes('@') && !walletLoading
  const canContinue   = email.trim().includes('@') && firstName.trim() && lastName.trim()

  const handleWalletFill = async () => {
    if (!canWalletFill) return
    setWalletLoading(true)
    setWalletWaiting(false)
    setWalletError('')

    const waitTimer = setTimeout(() => setWalletWaiting(true), 5500)

    const { result, error: err } = await onRequestWalletVerify(email.trim())

    clearTimeout(waitTimer)
    setWalletLoading(false)
    setWalletWaiting(false)

    if (err || !result) {
      setWalletError(err ?? 'Wallet request failed')
      return
    }

    if (result.action === 'auto_executed' || result.action === 'approved') {
      const ex = extractFromClaims(result.claims ?? {})
      if (ex.firstName)   setFirstName(ex.firstName)
      if (ex.lastName)    setLastName(ex.lastName)
      if (ex.nationality) setNationality(ex.nationality)
      if (ex.birthDate)   setBirthDate(ex.birthDate)
      setWalletFilled(true)
      setWalletError('')
    } else if (result.action === 'rejected') {
      setWalletError(`Wallet request rejected: ${result.reason ?? 'no reason given'}`)
    } else if (result.action === 'timeout') {
      setWalletError('No response from wallet. Please try again.')
    } else {
      setWalletError(`Wallet error: ${result.action}`)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canContinue) return
    onContinue({
      firstName:   firstName.trim(),
      lastName:    lastName.trim(),
      email:       email.trim(),
      nationality: nationality.trim() || undefined,
      birthDate:   birthDate || undefined,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-[460px]"
    >
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center
                     hover:bg-white transition-colors shrink-0"
        >
          <svg width="18" height="18" fill="none" stroke="#28272e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h2 className="text-[26px] font-black text-[#28272e]">Passenger info</h2>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] p-7">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Email — first, with inline wallet button */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-[#6d6b7e] uppercase tracking-wider">
              Email address
              <span className="ml-1.5 normal-case text-[11px] font-normal text-[#9ca3af]">used to reach your wallet</span>
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                className="flex-1 border border-[#e4e4e7] rounded-2xl px-4 py-3 text-[15px] text-[#28272e]
                           focus:outline-none focus:border-[#3f54cc] focus:ring-2 focus:ring-[#3f54cc]/20 min-w-0"
              />
              {/* Inline wallet button */}
              <button
                type="button"
                onClick={handleWalletFill}
                disabled={!canWalletFill}
                title="Fill from wallet"
                className="w-12 h-12 shrink-0 rounded-2xl border-2 border-[#3f54cc] text-[#3f54cc]
                           flex items-center justify-center
                           hover:bg-[#eaeefc] active:bg-[#d8dff8] transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {walletLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-transparent border-t-[#3f54cc] animate-spin" />
                ) : (
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                    <line x1="12" y1="12" x2="12" y2="16" />
                    <circle cx="12" cy="12" r="1" fill="currentColor" />
                  </svg>
                )}
              </button>
            </div>
            {walletWaiting && (
              <p className="text-[12px] text-amber-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                Check your Neoke wallet to approve the request…
              </p>
            )}
            {walletError && (
              <p className="text-[12px] text-red-500">{walletError}</p>
            )}
          </div>

          {/* Wallet-filled badge */}
          {walletFilled && (
            <div className="flex items-center gap-2 bg-[#f0f4ff] border border-[#c7d2fb] rounded-xl px-3 py-2.5">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#3f54cc" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span className="text-[13px] font-semibold text-[#3f54cc]">Information filled from your wallet</span>
            </div>
          )}

          {/* First name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-[#6d6b7e] uppercase tracking-wider">First name</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="e.g. Alex"
              autoComplete="given-name"
              className="border border-[#e4e4e7] rounded-2xl px-4 py-3 text-[15px] text-[#28272e]
                         focus:outline-none focus:border-[#3f54cc] focus:ring-2 focus:ring-[#3f54cc]/20"
            />
          </div>

          {/* Last name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-[#6d6b7e] uppercase tracking-wider">Last name</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="e.g. Scout"
              autoComplete="family-name"
              className="border border-[#e4e4e7] rounded-2xl px-4 py-3 text-[15px] text-[#28272e]
                         focus:outline-none focus:border-[#3f54cc] focus:ring-2 focus:ring-[#3f54cc]/20"
            />
          </div>

          {/* Nationality */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-[#6d6b7e] uppercase tracking-wider">Nationality</label>
            <input
              type="text"
              value={nationality}
              onChange={e => setNationality(e.target.value)}
              placeholder="e.g. Spanish"
              autoComplete="off"
              className="border border-[#e4e4e7] rounded-2xl px-4 py-3 text-[15px] text-[#28272e]
                         focus:outline-none focus:border-[#3f54cc] focus:ring-2 focus:ring-[#3f54cc]/20"
            />
          </div>

          {/* Date of birth */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-[#6d6b7e] uppercase tracking-wider">Date of birth</label>
            <input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className="border border-[#e4e4e7] rounded-2xl px-4 py-3 text-[15px] text-[#28272e]
                         focus:outline-none focus:border-[#3f54cc] focus:ring-2 focus:ring-[#3f54cc]/20"
            />
          </div>

          <button
            type="submit"
            disabled={!canContinue}
            className="mt-1 w-full bg-[#3f54cc] text-white font-bold text-[16px] py-4 rounded-full
                       hover:bg-[#3448b8] active:bg-[#2d3d9f] transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </form>
      </div>
    </motion.div>
  )
}
