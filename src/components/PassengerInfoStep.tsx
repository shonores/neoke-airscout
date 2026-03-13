import { useState } from 'react'
import { motion } from 'framer-motion'
import type { PassengerData } from '../types'

interface Props {
  onBack: () => void
  onContinue: (data: PassengerData) => void
  onFillWithWallet: (email: string) => void
}

export function PassengerInfoStep({ onBack, onContinue, onFillWithWallet }: Props) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  const canContinue = firstName.trim() && lastName.trim() && email.trim().includes('@')
  const canWalletFill = email.trim().includes('@')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canContinue) return
    onContinue({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() })
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
        <h2 className="text-[28px] font-black text-[#28272e]">Passenger info</h2>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] p-7">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-[#6d6b7e] uppercase tracking-wider">
              Email address
              <span className="ml-1 normal-case text-[11px] font-normal text-[#9ca3af]">(needed for wallet)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. alex@example.com"
              autoComplete="email"
              className="border border-[#e4e4e7] rounded-2xl px-4 py-3 text-[15px] text-[#28272e]
                         focus:outline-none focus:border-[#3f54cc] focus:ring-2 focus:ring-[#3f54cc]/20"
            />
          </div>

          <div className="flex flex-col gap-3 mt-2">
            {/* Wallet fill CTA */}
            <button
              type="button"
              onClick={() => onFillWithWallet(email)}
              disabled={!canWalletFill}
              className="w-full border-2 border-[#3f54cc] text-[#3f54cc] font-bold text-[15px] py-3.5 rounded-full
                         hover:bg-[#eaeefc] active:bg-[#d8dff8] transition-colors
                         flex items-center justify-center gap-2
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {/* Wallet icon */}
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 12V22H4V12"/>
                <path d="M22 7H2v5h20V7z"/>
                <path d="M12 22V7"/>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
              Fill with wallet information
            </button>

            {/* Manual continue */}
            <button
              type="submit"
              disabled={!canContinue}
              className="w-full bg-[#3f54cc] text-white font-bold text-[16px] py-4 rounded-full
                         hover:bg-[#3448b8] active:bg-[#2d3d9f] transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
