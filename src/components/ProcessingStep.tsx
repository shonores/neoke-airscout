import { motion } from 'framer-motion'
import type { AppState } from '../types'

const MESSAGES: Partial<Record<AppState, { title: string; subtitle: string }>> = {
  discovering: {
    title: 'Finding your wallet…',
    subtitle: 'Resolving your email to a decentralised identity',
  },
  requesting: {
    title: 'Preparing identity request…',
    subtitle: 'Creating a secure credential request for your Photo ID',
  },
  sending: {
    title: 'Sending to your wallet…',
    subtitle: 'Routing the request via the Neoke consent engine',
  },
}

interface Props {
  state: AppState
}

export function ProcessingStep({ state }: Props) {
  const msg = MESSAGES[state] ?? { title: 'Processing…', subtitle: 'Please wait' }

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
        <p className="text-[20px] font-bold text-[#28272e]">{msg.title}</p>
        <p className="text-[15px] text-[#6d6b7e] mt-1 leading-snug">{msg.subtitle}</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {(['discovering', 'requesting', 'sending'] as AppState[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                s === state
                  ? 'bg-[#3f54cc] scale-125'
                  : (['discovering', 'requesting', 'sending'] as AppState[]).indexOf(state) >
                    (['discovering', 'requesting', 'sending'] as AppState[]).indexOf(s)
                  ? 'bg-[#3f54cc]/40'
                  : 'bg-[#d7d6dc]'
              }`}
            />
            {i < 2 && <div className="w-4 h-px bg-[#d7d6dc]" />}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
