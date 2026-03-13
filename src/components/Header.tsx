interface Props {
  // Before booking — wallet login
  showWalletLogin?: boolean
  isLoggedIn?: boolean
  loggedInName?: string
  onWalletLoginClick?: () => void
  onLogout?: () => void
  // After booking — sign out
  showSignOut?: boolean
  onSignOut?: () => void
}

export function Header({
  showWalletLogin,
  isLoggedIn,
  loggedInName,
  onWalletLoginClick,
  onLogout,
  showSignOut,
  onSignOut,
}: Props) {
  return (
    <header className="flex items-center justify-between px-6 py-3 relative z-10">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-[#3f54cc] flex items-center justify-center overflow-hidden shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Right side — wallet login or sign out */}
      <div className="flex items-center gap-2">
        {showSignOut && onSignOut ? (
          <button
            onClick={onSignOut}
            className="bg-white text-[#28272e] text-[14px] font-medium px-5 py-1.5 rounded-full
                       hover:bg-white/90 active:bg-white/80 transition-colors shadow-sm"
          >
            Sign out
          </button>
        ) : showWalletLogin ? (
          isLoggedIn ? (
            /* Logged-in chip */
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="w-6 h-6 rounded-full bg-[#3f54cc] flex items-center justify-center">
                  <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="white" strokeWidth={2} strokeLinecap="round" fill="none" />
                    <circle cx="12" cy="7" r="4" stroke="white" strokeWidth={2} fill="none" />
                  </svg>
                </div>
                <span className="text-[13px] font-semibold text-[#28272e]">{loggedInName || 'Logged in'}</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-[13px] text-[#6d6b7e] hover:text-[#3f54cc] transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          ) : (
            /* Login button */
            <button
              onClick={onWalletLoginClick}
              className="flex items-center gap-1.5 bg-white text-[#3f54cc] text-[14px] font-bold px-4 py-1.5 rounded-full
                         hover:bg-[#eaeefc] active:bg-[#d8dff8] transition-colors shadow-sm"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                <line x1="12" y1="12" x2="12" y2="16" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>
              Login
            </button>
          )
        ) : (
          <div className="w-20" />
        )}
      </div>
    </header>
  )
}
