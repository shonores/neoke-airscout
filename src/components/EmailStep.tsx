import { useState } from 'react'
import { motion } from 'framer-motion'
import { ConfigPanel } from './ConfigPanel'
import type { Config } from '../types'

interface Props {
  config: Config
  onConfigChange: (c: Config) => void
  onSubmit: (email: string) => void
}

export function EmailStep({ config, onConfigChange, onSubmit }: Props) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (!config.nodeId || !config.apiKey) {
      setError('Please configure the Node ID and API Key in settings below.')
      return
    }
    setError('')
    onSubmit(trimmed)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-white rounded-xl shadow-[0px_2px_5px_rgba(36,35,41,0.03),0px_9px_9px_rgba(36,35,41,0.03),0px_21px_13px_rgba(36,35,41,0.02)]
                 p-8 w-full max-w-[480px]"
    >
      {/* Card title */}
      <div className="mb-6">
        <h2 className="text-[28px] font-extrabold text-[#28272e] leading-8">
          Check in with your digital ID
        </h2>
        <p className="text-[15px] text-[#6d6b7e] mt-2 leading-snug">
          Enter your email to securely verify your identity via your Neoke wallet.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email field */}
        <div className="flex flex-col gap-2">
          <label className="text-[16px] font-semibold text-[#28272e]">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            placeholder="your@email.com"
            autoComplete="email"
            className="border border-[#d7d6dc] rounded-lg h-14 px-4 text-[16px] text-[#28272e]
                       focus:outline-none focus:border-[#3f54cc] focus:ring-1 focus:ring-[#3f54cc]/20
                       placeholder-[#c7c7cc] transition-colors"
          />
          {error && (
            <p className="text-[13px] text-red-500 mt-0.5">{error}</p>
          )}
        </div>

        {/* CTA button */}
        <button
          type="submit"
          className="bg-[#3f54cc] text-white text-[16px] font-medium px-6 py-3 rounded-full
                     hover:bg-[#3449b8] active:bg-[#2d3fa8] transition-colors
                     shadow-lg shadow-[#3f54cc]/20 self-start mt-1"
        >
          Check in
        </button>
      </form>

      <ConfigPanel config={config} onChange={onConfigChange} />
    </motion.div>
  )
}
