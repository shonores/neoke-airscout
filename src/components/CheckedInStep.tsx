import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Flight, PassengerData } from '../types'
import { requestDelegation, getDelegationStatus } from '../api/delegate'
import { AIRSCOUT_SERVICE_NAME, HOTELSCOUT_SERVICE_NAME } from '../serviceConfig'

const HOTELSCOUT_URL =
  import.meta.env['VITE_HOTELSCOUT_URL'] ?? 'https://neoke-hotelscout.vercel.app'
const CE_URL =
  import.meta.env['VITE_AIRSCOUT_CE_URL'] ?? 'https://neoke-consent-engine.fly.dev'
const CE_API_KEY =
  import.meta.env['VITE_AIRSCOUT_CE_API_KEY'] ?? ''
const CREDENTIAL_TYPE =
  import.meta.env['VITE_AIRSCOUT_TEMPLATE_ID']
    ? `template:${import.meta.env['VITE_AIRSCOUT_TEMPLATE_ID']}`
    : (import.meta.env['VITE_AIRSCOUT_CREDENTIAL_TYPE'] ?? 'sdjwt-epassport-copy')

const UPSELLS_EXTRA = [
  {
    id: 'car',
    emoji: '🚗',
    title: 'Need a car at your destination?',
    desc: 'Rent the perfect car and pick it up right at the airport — no queues.',
    cta: 'Find a car',
    color: '#0f766e',
    onClick: undefined as (() => void) | undefined,
  },
  {
    id: 'lounge',
    emoji: '✈️',
    title: 'Upgrade your airport experience',
    desc: 'Access premium lounges and fast-track security with AirScout Pass.',
    cta: 'Explore perks',
    color: '#7c3aed',
    onClick: undefined as (() => void) | undefined,
  },
]

// Aisle seat assignments by flight id
const AISLE_SEATS = ['14C', '7C', '22C', '3C', '18C']

interface Props {
  flight: Flight
  passenger: PassengerData
  travelDate?: string
  onReset: () => void
}

export function CheckedInStep({ flight, passenger, travelDate, onReset }: Props) {
  const fullName = [passenger.firstName, passenger.lastName].filter(Boolean).join(' ') || 'Passenger'
  const seat = AISLE_SEATS[(parseInt(flight.id, 10) - 1) % AISLE_SEATS.length]

  const [showConsent, setShowConsent] = useState(false)
  const [includeBirthDate, setIncludeBirthDate] = useState(!!passenger.birthDate)
  // 'idle' | 'requesting' | 'waiting' | 'done'
  const [delegatePhase, setDelegatePhase] = useState<'idle' | 'requesting' | 'waiting' | 'done'>('idle')
  const [delegateError, setDelegateError] = useState('')
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)

  const delegating = delegatePhase === 'requesting' || delegatePhase === 'waiting'

  const stopPolling = () => {
    cancelledRef.current = true
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
  }

  const handleCancel = () => {
    stopPolling()
    setDelegatePhase('idle')
    setShowConsent(false)
  }

  const handleBrowseHotels = () => {
    setDelegateError('')
    setShowConsent(true)
  }

  const handleConsentConfirm = async () => {
    setDelegatePhase('requesting')
    setDelegateError('')
    cancelledRef.current = false

    const { request, error } = await requestDelegation(CE_URL, CE_API_KEY, {
      userEmail: passenger.email,
      requesterService: AIRSCOUT_SERVICE_NAME,
      recipientService: HOTELSCOUT_SERVICE_NAME,
      credentialTypeId: CREDENTIAL_TYPE,
      purpose: 'Hotel booking pre-fill — share verified identity with HotelScout',
      ttlMinutes: 30,
    })

    if (error || !request) {
      setDelegatePhase('idle')
      setDelegateError(error ?? 'Failed to send approval request. Please try again.')
      return
    }

    setDelegatePhase('waiting')

    // Poll until user approves/rejects/expires in wallet
    const poll = async () => {
      if (cancelledRef.current) return

      const { status, error: pollError } = await getDelegationStatus(CE_URL, CE_API_KEY, request.delegationId)

      if (cancelledRef.current) return

      if (pollError) {
        setDelegatePhase('idle')
        setDelegateError(pollError)
        return
      }

      if (!status || status.status === 'pending_approval') {
        // Keep polling every 3 seconds
        pollTimerRef.current = setTimeout(poll, 3000)
        return
      }

      if (status.status === 'approved' && status.grantToken) {
        setDelegatePhase('done')
        const paramObj: Record<string, string> = {
          grant_token: status.grantToken,
          destination: flight.to,
          city_code: flight.toCode,
          email: passenger.email,
        }
        if (travelDate) paramObj.check_in = travelDate
        const params = new URLSearchParams(paramObj)
        window.location.href = `${HOTELSCOUT_URL}?${params.toString()}`
        return
      }

      // rejected or expired
      setDelegatePhase('idle')
      setDelegateError(
        status.status === 'rejected'
          ? 'You declined the request in your wallet.'
          : 'The approval window expired. Please try again.',
      )
    }

    poll()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[460px] flex flex-col gap-4"
      >
        {/* Confirmation card */}
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] p-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-[#eaeefc] flex items-center justify-center mb-5">
            <svg width="34" height="34" fill="none" viewBox="0 0 24 24" stroke="#3f54cc" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h2 className="text-[30px] font-black text-[#28272e] mb-2">You're checked in!</h2>
          <p className="text-[15px] text-[#6d6b7e] leading-relaxed mb-5">
            Welcome aboard, <strong className="text-[#28272e]">{fullName}</strong>.
          </p>

          {/* Mini boarding pass */}
          <div className="w-full bg-[#f7f8ff] rounded-2xl px-6 py-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <p className="text-[11px] font-bold text-[#6d6b7e] uppercase tracking-wider mb-1">From</p>
                <p className="text-[26px] font-black text-[#28272e]">{flight.fromCode}</p>
                <p className="text-[13px] text-[#6d6b7e]">{flight.departTime}</p>
              </div>
              <div className="flex flex-col items-center gap-1 px-2">
                <svg width="52" height="18" viewBox="0 0 52 18" fill="none">
                  <line x1="0" y1="9" x2="38" y2="9" stroke="#3f54cc" strokeWidth={1.5} strokeDasharray="4 3" />
                  <path d="M38 5l10 4-10 4" fill="none" stroke="#3f54cc" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[11px] text-[#9ca3af] font-medium">{flight.duration}</span>
              </div>
              <div className="text-center">
                <p className="text-[11px] font-bold text-[#6d6b7e] uppercase tracking-wider mb-1">To</p>
                <p className="text-[26px] font-black text-[#28272e]">{flight.toCode}</p>
                <p className="text-[13px] text-[#6d6b7e]">{flight.arrivalTime}</p>
              </div>
            </div>

            {/* Seat assignment */}
            <div className="border-t border-[#eceaf2] pt-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#6d6b7e] uppercase tracking-wider">Seat</p>
                <p className="text-[22px] font-black text-[#28272e]">{seat}</p>
              </div>
              <div className="text-right max-w-[200px]">
                <p className="text-[11px] font-bold text-[#6d6b7e] uppercase tracking-wider mb-0.5">Type</p>
                <p className="text-[13px] font-semibold text-[#3f54cc]">Aisle</p>
                <p className="text-[11px] text-[#9ca3af] leading-snug mt-0.5">Selected based on your travel preferences from your wallet</p>
              </div>
            </div>
          </div>
        </div>

        {/* HotelScout upsell */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.07)] p-5 flex items-start gap-4"
        >
          <span className="text-3xl leading-none mt-0.5">🏨</span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[#28272e]">Haven't booked a hotel yet?</p>
            <p className="text-[13px] text-[#6d6b7e] mt-0.5 leading-snug">
              Share your verified details with <strong className="text-[#28272e]">HotelScout</strong> and skip the form — your info is pre-filled, no re-entry needed.
            </p>
          </div>
          <button
            onClick={handleBrowseHotels}
            className="shrink-0 text-white text-[13px] font-bold px-4 py-2 rounded-full
                       hover:opacity-90 active:opacity-80 transition-opacity whitespace-nowrap"
            style={{ backgroundColor: '#3f54cc' }}
          >
            Browse hotels
          </button>
        </motion.div>

        {/* Other upsells */}
        {UPSELLS_EXTRA.map((u, i) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 * (i + 1) + 0.35, duration: 0.35 }}
            className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.07)] p-5 flex items-start gap-4"
          >
            <span className="text-3xl leading-none mt-0.5">{u.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-[#28272e]">{u.title}</p>
              <p className="text-[13px] text-[#6d6b7e] mt-0.5 leading-snug">{u.desc}</p>
            </div>
            <button
              style={{ backgroundColor: u.color }}
              className="shrink-0 text-white text-[13px] font-bold px-4 py-2 rounded-full
                         hover:opacity-90 active:opacity-80 transition-opacity whitespace-nowrap"
            >
              {u.cta}
            </button>
          </motion.div>
        ))}

        <button
          onClick={onReset}
          className="text-[14px] text-[#9ca3af] hover:text-[#3f54cc] transition-colors text-center py-2"
        >
          Start a new search
        </button>
      </motion.div>

      {/* Consent modal */}
      <AnimatePresence>
        {showConsent && (
          <motion.div
            key="consent-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowConsent(false) }}
          >
            <motion.div
              key="consent-card"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-[400px] p-7 flex flex-col gap-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[20px] font-black text-[#28272e]">Share with HotelScout</h3>
                  <p className="text-[13px] text-[#6d6b7e] mt-1 leading-snug">
                    HotelScout will receive your verified details to pre-fill your hotel booking.
                    Your wallet stays in control — this is a one-time share.
                  </p>
                </div>
                <button
                  onClick={() => setShowConsent(false)}
                  className="shrink-0 w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center hover:bg-[#e5e7eb] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="#6d6b7e" strokeWidth={1.8} strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Fields being shared */}
              <div className="bg-[#f7f8ff] rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-[11px] font-bold text-[#6d6b7e] uppercase tracking-wider">Details being shared</p>

                {/* Fixed fields */}
                {[
                  { label: 'Full name', value: [passenger.firstName, passenger.lastName].filter(Boolean).join(' ') },
                  { label: 'Email', value: passenger.email },
                ].map((f) => (
                  <div key={f.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-[#28272e]">{f.label}</p>
                      <p className="text-[12px] text-[#9ca3af] truncate max-w-[220px]">{f.value}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-[#3f54cc] flex items-center justify-center shrink-0">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                ))}

                {/* Optional birth date toggle */}
                {passenger.birthDate && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-[#28272e]">Date of birth</p>
                      <p className="text-[12px] text-[#9ca3af]">{passenger.birthDate}</p>
                    </div>
                    <button
                      onClick={() => setIncludeBirthDate((v) => !v)}
                      className={`w-10 h-6 rounded-full transition-colors duration-200 relative ${
                        includeBirthDate ? 'bg-[#3f54cc]' : 'bg-[#d1d5db]'
                      }`}
                    >
                      <span
                        className={`absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-200 ${
                          includeBirthDate ? 'translate-x-[18px]' : 'translate-x-[3px]'
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Purpose */}
              <p className="text-[12px] text-[#9ca3af] leading-snug -mt-1">
                <strong className="text-[#6d6b7e]">Purpose:</strong> Hotel booking pre-fill at {flight.to}.
                This token expires in 30 minutes and can only be used once.
              </p>

              {delegateError && (
                <p className="text-[13px] text-red-500 bg-red-50 rounded-xl px-4 py-3">{delegateError}</p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleCancel}
                  disabled={delegatePhase === 'done'}
                  className="flex-1 py-3 rounded-2xl border border-[#e5e7eb] text-[14px] font-semibold text-[#6d6b7e] hover:bg-[#f9fafb] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConsentConfirm}
                  disabled={delegating}
                  className="flex-1 py-3 rounded-2xl bg-[#3f54cc] text-white text-[14px] font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {delegatePhase === 'requesting' ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Sending…
                    </>
                  ) : delegatePhase === 'waiting' ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Waiting for wallet approval…
                    </>
                  ) : (
                    'Share & continue'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
