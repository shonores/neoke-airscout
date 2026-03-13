import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Flight, SearchQuery } from '../types'

const CITY_CODE: Record<string, string> = {
  Amsterdam: 'AMS',
  Barcelona: 'BCN',
  Berlin:    'BER',
  Bologna:   'BLQ',
  Malaga:    'AGP',
}

function addMins(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// Four realistic short-haul schedules; duration is fixed per slot regardless of city pair
const SCHEDULES = [
  { depart: '06:30', durationMin: 120, stops: 'Direct' as const, price: 89  },
  { depart: '09:45', durationMin: 120, stops: 'Direct' as const, price: 137 },
  { depart: '13:20', durationMin: 205, stops: '1 Stop'  as const, price: 112 },
  { depart: '18:05', durationMin: 120, stops: 'Direct' as const, price: 99  },
]

function generateFlights(from: string, to: string): Flight[] {
  const fromCode = CITY_CODE[from] ?? 'XXX'
  const toCode   = CITY_CODE[to]   ?? 'YYY'
  return SCHEDULES.map((s, i) => ({
    id:          String(i + 1),
    fromCode, from,
    toCode,   to,
    departTime:  s.depart,
    arrivalTime: addMins(s.depart, s.durationMin),
    duration:    fmtDuration(s.durationMin),
    stops:       s.stops,
    price:       s.price,
  }))
}

interface Props {
  searchQuery: SearchQuery
  onBack: () => void
  onSelect: (flight: Flight) => void
}

export function FlightResultsStep({ searchQuery, onBack, onSelect }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const flights = generateFlights(searchQuery.from, searchQuery.to)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-[520px]"
    >
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center
                     hover:bg-white transition-colors shrink-0"
        >
          <svg width="18" height="18" fill="none" stroke="#28272e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h2 className="text-[26px] font-black text-[#28272e]">Select your flight</h2>
      </div>
      <p className="text-[14px] text-[#28272e]/60 font-medium mb-5 ml-[52px]">
        {searchQuery.from} → {searchQuery.to}
      </p>

      <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden">
        {flights.map((flight, idx) => (
          <button
            key={flight.id}
            onClick={() => setSelectedId(flight.id)}
            className={[
              'w-full text-left px-6 py-4 flex items-center gap-4 transition-colors',
              idx !== 0 ? 'border-t border-[#f0f0f3]' : '',
              selectedId === flight.id ? 'bg-[#eaeefc]' : 'hover:bg-[#f7f8ff]',
            ].join(' ')}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-black text-[#28272e]">{flight.fromCode}</span>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span className="text-[16px] font-black text-[#28272e]">{flight.toCode}</span>
                {flight.stops === 'Direct' && (
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Direct</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[13px] text-[#6d6b7e]">{flight.departTime} → {flight.arrivalTime}</span>
                <span className="text-[#c4c2cc]">·</span>
                <span className="text-[13px] text-[#6d6b7e]">{flight.duration}</span>
                {flight.stops !== 'Direct' && (
                  <>
                    <span className="text-[#c4c2cc]">·</span>
                    <span className="text-[13px] text-[#6d6b7e]">{flight.stops}</span>
                  </>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[20px] font-black text-[#3f54cc]">€{flight.price}</span>
            </div>

            <div className={[
              'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
              selectedId === flight.id ? 'bg-[#3f54cc] border-[#3f54cc]' : 'border-[#d4d2de]',
            ].join(' ')}>
              {selectedId === flight.id && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </button>
        ))}

        <div className="px-6 py-5 border-t border-[#f0f0f3]">
          <button
            onClick={() => {
              const flight = flights.find(f => f.id === selectedId)
              if (flight) onSelect(flight)
            }}
            disabled={!selectedId}
            className="w-full bg-[#3f54cc] text-white font-bold text-[16px] py-4 rounded-full
                       hover:bg-[#3448b8] active:bg-[#2d3d9f] transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </motion.div>
  )
}
