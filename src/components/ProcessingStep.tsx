import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export function ProcessingStep() {
  const [waitingForWallet, setWaitingForWallet] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setWaitingForWallet(true), 5000)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-white rounded-xl shadow-[0px_2px_5px_rgba(36,35,41,0.03),0px_9px_9px_rgba(36,35,41,0.03),0px_21px_13px_rgba(36,35,41,0.02)]
                 p-8 w-full max-w-[480px] flex flex-col items-center gap-6 text-center"
    >
      {/* Spinner */}
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-[#e8eaf6]" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#3f54cc] animate-spin" />
      </div>

      <div>
        <p className="text-[20px] font-bold text-[#28272e]">
          {waitingForWallet ? 'Check your wallet' : 'Verifying your identity…'}
        </p>
        <p className="text-[15px] text-[#6d6b7e] mt-1 leading-snug">
          {waitingForWallet
            ? 'Open your Neoke wallet and approve the identity request'
            : 'Routing a secure credential request to your Neoke wallet'}
        </p>
      </div>

      {waitingForWallet && (
        <div className="flex items-center gap-2 text-[13px] text-[#6d6b7e]">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
          Waiting for approval…
        </div>
      )}
    </motion.div>
  )
}
