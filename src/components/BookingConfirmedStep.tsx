import { motion } from 'framer-motion'
import type { Flight, PassengerData } from '../types'

interface Props {
  flight: Flight
  passenger: PassengerData
  travelDate: string
  onCheckIn: () => void
  onReset: () => void
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Sunday 26 April'
  const d = new Date(dateStr + 'T12:00:00')
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function BookingConfirmedStep({ flight, passenger, travelDate, onCheckIn, onReset }: Props) {
  const fullName = [passenger.firstName, passenger.lastName].filter(Boolean).join(' ') || 'Passenger'
  const formattedDate = formatDate(travelDate)
  const routeLabel = `${flight.from || flight.fromCode} to ${flight.to || flight.toCode}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-[460px]"
    >
      <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] p-8 flex flex-col items-center text-center">
        {/* Checkmark icon */}
        <div className="w-20 h-20 rounded-full bg-[#eaeefc] flex items-center justify-center mb-6">
          <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#3f54cc" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <h2 className="text-[28px] font-black text-[#28272e] leading-tight mb-2">
          Your flight is confirmed!
        </h2>
        <p className="text-[15px] text-[#6d6b7e] mb-7">
          We'll see you at the airport. Have a great trip!
        </p>

        {/* Booking summary */}
        <div className="w-full bg-[#f7f8ff] rounded-2xl p-5 mb-7 text-left">
          <div className="flex flex-col gap-0">
            <div className="flex justify-between items-center py-3">
              <span className="text-[12px] font-bold text-[#6d6b7e] uppercase tracking-wider">Name</span>
              <span className="text-[15px] font-bold text-[#28272e]">{fullName}</span>
            </div>
            <div className="border-t border-[#eceaf2]" />
            <div className="flex justify-between items-center py-3">
              <span className="text-[12px] font-bold text-[#6d6b7e] uppercase tracking-wider">Date</span>
              <span className="text-[15px] font-bold text-[#28272e]">{formattedDate}</span>
            </div>
            <div className="border-t border-[#eceaf2]" />
            <div className="flex justify-between items-center py-3">
              <span className="text-[12px] font-bold text-[#6d6b7e] uppercase tracking-wider">Flight</span>
              <span className="text-[15px] font-bold text-[#28272e]">{routeLabel}</span>
            </div>
          </div>
        </div>

        {/* Check-in section */}
        <div className="w-full">
          <p className="text-[17px] font-black text-[#28272e] mb-1">
            Online check-in is now available
          </p>
          <p className="text-[14px] text-[#6d6b7e] leading-snug mb-5">
            Skip the airport queue. We'll use your wallet to verify your identity automatically.
          </p>
          <button
            onClick={onCheckIn}
            className="w-full bg-[#3f54cc] text-white font-bold text-[16px] py-4 rounded-full
                       hover:bg-[#3448b8] active:bg-[#2d3d9f] transition-colors"
          >
            Check in now
          </button>
          <button
            onClick={onReset}
            className="mt-3 text-[14px] text-[#9ca3af] hover:text-[#3f54cc] transition-colors w-full py-1"
          >
            Back to home
          </button>
        </div>
      </div>
    </motion.div>
  )
}
