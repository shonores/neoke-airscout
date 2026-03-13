import { useState } from 'react'
import { motion } from 'framer-motion'
import type { SearchQuery } from '../types'

const CITIES = ['Amsterdam', 'Barcelona', 'Berlin', 'Bologna', 'Malaga']

interface Props {
  onSearch: (query: SearchQuery) => void
}

export function SearchStep({ onSearch }: Props) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch({
      from: from || 'Amsterdam',
      to: to || 'Barcelona',
      date: date || '2026-04-26',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="mb-8">
        <h1 className="text-[48px] sm:text-[56px] font-black text-[#28272e] leading-tight">
          Book your next<br />flight
        </h1>
        <p className="text-[17px] font-medium text-[#28272e]/60 mt-2">
          Experience the Art of Effortless Travel
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] p-7 w-full max-w-[460px] flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-[#6d6b7e] uppercase tracking-wider">From</label>
          <div className="relative">
            <select
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-full border border-[#e4e4e7] rounded-2xl px-4 py-3 pr-10 text-[15px] text-[#28272e] bg-white
                         focus:outline-none focus:border-[#3f54cc] focus:ring-2 focus:ring-[#3f54cc]/20
                         appearance-none cursor-pointer"
            >
              <option value="">Select departure city</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" fill="none" stroke="#9ca3af" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-[#6d6b7e] uppercase tracking-wider">To</label>
          <div className="relative">
            <select
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full border border-[#e4e4e7] rounded-2xl px-4 py-3 pr-10 text-[15px] text-[#28272e] bg-white
                         focus:outline-none focus:border-[#3f54cc] focus:ring-2 focus:ring-[#3f54cc]/20
                         appearance-none cursor-pointer"
            >
              <option value="">Select destination</option>
              {CITIES.filter(c => c !== from).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" fill="none" stroke="#9ca3af" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-[#6d6b7e] uppercase tracking-wider">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full border border-[#e4e4e7] rounded-2xl px-4 py-3 text-[15px] text-[#28272e] bg-white
                       focus:outline-none focus:border-[#3f54cc] focus:ring-2 focus:ring-[#3f54cc]/20"
          />
        </div>

        <button
          type="submit"
          className="mt-1 bg-[#3f54cc] text-white font-bold text-[16px] py-4 rounded-full
                     hover:bg-[#3448b8] active:bg-[#2d3d9f] transition-colors"
        >
          Search flights
        </button>
      </form>
    </motion.div>
  )
}
