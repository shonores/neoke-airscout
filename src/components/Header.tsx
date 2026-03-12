// AirScout logo from Figma assets (valid ~7 days)
const AIRSCOUT_LOGO = 'https://www.figma.com/api/mcp/asset/26b1f1e6-6451-4a27-bf2a-fcd2e7131c1a'

interface Props {
  onSignOut?: () => void
  showSignOut?: boolean
}

export function Header({ onSignOut, showSignOut }: Props) {
  return (
    <header className="flex items-center justify-between px-6 py-3 relative z-10">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center overflow-hidden shrink-0">
          <img src={AIRSCOUT_LOGO} alt="AirScout logo" className="w-full h-full object-contain" />
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
