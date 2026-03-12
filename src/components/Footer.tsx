// Neoke wordmark from Figma
const NEOKE_WORDMARK = 'https://www.figma.com/api/mcp/asset/26b1f1e6-6451-4a27-bf2a-fcd2e7131c1a'

export function Footer() {
  return (
    <footer className="flex items-center justify-end gap-3 px-10 py-6 relative z-10">
      <img src={NEOKE_WORDMARK} alt="Neoke" className="h-5 opacity-70" />
      <p className="text-[14px] text-[#28272e]/60">Copyright © 2025 NeoKe B.V.</p>
    </footer>
  )
}
