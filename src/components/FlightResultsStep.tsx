import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Flight } from '../types'

const MOCK_FLIGHTS: Flight[] = [
  { id: '1', fromCode: 'CMN', from: 'Casablanca', toCode: 'FEZ', to: 'Fez',           departTime: '10:30', arrivalTime: '11:35', duration: '1h 05m',  stops: 'Direct',  price: 78  },
  { id: '2', fromCode: 'JFK', from: 'New York',   toCode: 'LHR', to: 'London',        departTime: '14:45', arrivalTime: '07:20', duration: '6h 35m',  stops: '1 Stop',  price: 320 },
  { id: '3', fromCode: 'SFO', from: 'San Francisco', toCode: 'NRT', to: 'Tokyo',      departTime: '09:15', arrivalTime: '17:45', duration: '11h 30m', stops: '1 Stop',  price: 540 },
  { id: '4', fromCode: 'DXB', from: 'Dubai',      toCode: 'SYD', to: 'Sydney',        departTime: '06:00', arrivalTime: '23:30', duration: '14h 30m', stops: '2 Stops', price: 720 },
  { id: '5', fromCode: 'LAX', from: 'Los Angeles', toCode: 'CDG', to: 'Paris',        departTime: '11:00', arrivalTime: '17:15', duration: '6h 15m',  stops: '1 Stop',  price: 420 },
]

interface Props {
  onBack: () => void
  onSelect: (flight: Flight) => void
}

export function FlightResultsStep({ onBack, onSelect }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-[540px]"
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
        <h2 className="text-[28px] font-black text-[#28272e]">Select your flight</h2>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden">
        {MOCK_FLIGHTS.map((flight, idx) => (
          <button
            key={flight.id}
            onClick={() => setSelectedId(flight.id)}
            className={[
              'w-full text-left px-6 py-4 flex items-center gap-4 transition-colors',
              idx !== 0 ? 'border-t border-[#f0f0f3]' : '',
              selectedId === flight.id ? 'bg-[#eaeefc]' : 'hover:bg-[#f7f8ff]',
            ].join(' ')}
          >
            {/* Route info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-black text-[#28272e]">{flight.fromCode}</span>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span className="text-[16px] font-black text-[#28272e]">{flight.toCode}</span>
                {flight.stops === 'Direct' && (
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Direct</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
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

            {/* Price */}
            <div className="text-right shrink-0">
              <span className="text-[20px] font-black text-[#3f54cc]">€{flight.price}</span>
            </div>

            {/* Selection indicator */}
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
              const flight = MOCK_FLIGHTS.find(f => f.id === selectedId)
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
