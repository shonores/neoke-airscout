
interface Props {
  onSignOut?: () => void
  showSignOut?: boolean
}

export function Header({ onSignOut, showSignOut }: Props) {
  return (
    <header className="flex items-center justify-between px-6 py-3 relative z-10">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-[#3f54cc] flex items-center justify-center overflow-hidden shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        </div>
        <span className="font-extrabold text-[14px] text-[#28272e]">AirScout</span>
      </div>

      {/* Demo notice */}
      <div className="bg-white/60 backdrop-blur-sm px-6 py-1.5 rounded-full hidden sm:block">
        <p className="text-[14px] text-[#28272e] leading-6 whitespace-nowrap">
          AirScout is a fictitious travel agency built by{' '}
          <span className="text-[#3f54cc] font-medium">Neoke</span> for testing purposes
        </p>
      </div>

      {/* Sign out */}
      {showSignOut && onSignOut ? (
        <button
          onClick={onSignOut}
          className="bg-white text-[#28272e] text-[14px] font-medium px-5 py-1.5 rounded-full
                     hover:bg-white/90 active:bg-white/80 transition-colors shadow-sm"
        >
          Sign out
        </button>
      ) : (
        <div className="w-24" />
      )}
    </header>
  )
}
