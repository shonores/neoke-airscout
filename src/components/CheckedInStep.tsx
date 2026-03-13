import { motion } from 'framer-motion'
import type { Flight, PassengerData } from '../types'

const UPSELLS = [
  {
    id: 'hotel',
    emoji: '🏨',
    title: 'Have you booked a hotel?',
    desc: 'Save up to 30% on hotels near your destination with AirScout Stays.',
    cta: 'Browse hotels',
    color: '#3f54cc',
  },
  {
    id: 'car',
    emoji: '🚗',
    title: 'Need a car at your destination?',
    desc: 'Rent the perfect car and pick it up right at the airport — no queues.',
    cta: 'Find a car',
    color: '#0f766e',
  },
  {
    id: 'lounge',
    emoji: '✈️',
    title: 'Upgrade your airport experience',
    desc: 'Access premium lounges and fast-track security with AirScout Pass.',
    cta: 'Explore perks',
    color: '#7c3aed',
  },
]

// Aisle seat assignments by flight id
const AISLE_SEATS = ['14C', '7C', '22C', '3C', '18C']

interface Props {
  flight: Flight
  passenger: PassengerData
  onReset: () => void
}

export function CheckedInStep({ flight, passenger, onReset }: Props) {
  const fullName = [passenger.firstName, passenger.lastName].filter(Boolean).join(' ') || 'Passenger'
  const seat = AISLE_SEATS[(parseInt(flight.id, 10) - 1) % AISLE_SEATS.length]

  return (
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

      {/* Upsells */}
      {UPSELLS.map((u, i) => (
        <motion.div
          key={u.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 * i + 0.25, duration: 0.35 }}
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
  )
}
