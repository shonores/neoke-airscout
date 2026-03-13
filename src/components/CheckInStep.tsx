import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export function CheckInStep() {
  const [showWallet, setShowWallet] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowWallet(true), 6000)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] p-10 w-full max-w-[460px]
                 flex flex-col items-center gap-6 text-center"
    >
      {/* Spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-[#e8eaf6]" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#3f54cc] animate-spin" />
      </div>

      <div>
        <p className="text-[22px] font-bold text-[#28272e] leading-snug">
          {showWallet ? 'Check your wallet' : 'Checking you in.'}
        </p>
        <p className="text-[15px] text-[#6d6b7e] mt-2 leading-relaxed max-w-[320px]">
          {showWallet
            ? 'Open your Neoke wallet and approve the check-in request.'
            : 'Calling your wallet to retrieve your information…'}
        </p>
      </div>

      {showWallet && (
        <div className="flex items-center gap-2 text-[13px] text-[#6d6b7e]">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
          Waiting for wallet approval…
        </div>
      )}
    </motion.div>
  )
}
