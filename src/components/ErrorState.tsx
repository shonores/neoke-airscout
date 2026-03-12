import { motion } from 'framer-motion'

interface Props {
  message: string
  onRetry: () => void
}

const REASON_HINTS: Record<string, string> = {
  no_matched_credentials: "The wallet doesn't hold a Photo ID credential of the required type.",
  node_respond_failed: 'The wallet node encountered an error when responding.',
}

export function ErrorState({ message, onRetry }: Props) {
  const hint = Object.entries(REASON_HINTS).find(([key]) => message.includes(key))?.[1]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-white rounded-xl shadow-[0px_2px_5px_rgba(36,35,41,0.03),0px_9px_9px_rgba(36,35,41,0.03),0px_21px_13px_rgba(36,35,41,0.02)]
                 p-8 w-full max-w-[480px] flex flex-col gap-5"
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <div>
        <p className="text-[18px] font-bold text-[#28272e]">Something went wrong</p>
        <p className="text-[14px] text-[#6d6b7e] mt-1 leading-snug font-mono break-all">
          {message}
        </p>
        {hint && (
          <p className="text-[14px] text-[#6d6b7e] mt-2 leading-snug">{hint}</p>
        )}
      </div>

      <button
        onClick={onRetry}
        className="bg-[#3f54cc] text-white text-[15px] font-medium px-6 py-3 rounded-full
                   hover:bg-[#3449b8] active:bg-[#2d3fa8] transition-colors
                   shadow-lg shadow-[#3f54cc]/20 self-start"
      >
        Try again
      </button>
    </motion.div>
  )
}
