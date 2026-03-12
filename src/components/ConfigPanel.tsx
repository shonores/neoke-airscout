import { useState } from 'react'
import type { Config } from '../types'

interface Props {
  config: Config
  onChange: (c: Config) => void
}

const DEFAULT_CE_URL = 'https://neoke-consent-engine.fly.dev'

export function ConfigPanel({ config, onChange }: Props) {
  const [open, setOpen] = useState(false)

  const set = (key: keyof Config, value: string) =>
    onChange({ ...config, [key]: value })

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-[13px] text-[#6d6b7e] hover:text-[#3f54cc] transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 6 10"
        >
          <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{open ? 'Hide' : 'Show'} configuration</span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3 p-4 bg-[#f8f8fa] rounded-xl border border-[#d7d6dc]">
          <p className="text-[11px] font-semibold uppercase text-[#8e8e93] tracking-wide">
            Verifier Node
          </p>

          <label className="flex flex-col gap-1">
            <span className="text-[13px] text-[#6d6b7e]">Node ID</span>
            <input
              type="text"
              value={config.nodeId}
              onChange={e => set('nodeId', e.target.value)}
              placeholder="e.g. b2b-poc"
              className="bg-white border border-[#d7d6dc] rounded-lg px-3 py-2 text-[14px] text-[#28272e]
                         font-mono focus:outline-none focus:border-[#3f54cc] focus:ring-1 focus:ring-[#3f54cc]/20
                         placeholder-[#c7c7cc]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[13px] text-[#6d6b7e]">API Key</span>
            <input
              type="password"
              value={config.apiKey}
              onChange={e => set('apiKey', e.target.value)}
              placeholder="Node API key"
              className="bg-white border border-[#d7d6dc] rounded-lg px-3 py-2 text-[14px] text-[#28272e]
                         font-mono focus:outline-none focus:border-[#3f54cc] focus:ring-1 focus:ring-[#3f54cc]/20
                         placeholder-[#c7c7cc]"
            />
          </label>

          <p className="text-[11px] font-semibold uppercase text-[#8e8e93] tracking-wide mt-1">
            Consent Engine
          </p>

          <label className="flex flex-col gap-1">
            <span className="text-[13px] text-[#6d6b7e]">CE URL</span>
            <input
              type="text"
              value={config.ceUrl || DEFAULT_CE_URL}
              onChange={e => set('ceUrl', e.target.value)}
              placeholder={DEFAULT_CE_URL}
              className="bg-white border border-[#d7d6dc] rounded-lg px-3 py-2 text-[14px] text-[#28272e]
                         font-mono focus:outline-none focus:border-[#3f54cc] focus:ring-1 focus:ring-[#3f54cc]/20
                         placeholder-[#c7c7cc]"
            />
          </label>

          <p className="text-[11px] font-semibold uppercase text-[#8e8e93] tracking-wide mt-1">
            Demo Override
          </p>

          <label className="flex flex-col gap-1">
            <span className="text-[13px] text-[#6d6b7e]">
              Test Wallet DID{' '}
              <span className="text-[#c7c7cc]">(bypasses email discovery)</span>
            </span>
            <input
              type="text"
              value={config.demoDid}
              onChange={e => set('demoDid', e.target.value)}
              placeholder="did:web:someone.id-node.neoke.com"
              className="bg-white border border-[#d7d6dc] rounded-lg px-3 py-2 text-[14px] text-[#28272e]
                         font-mono focus:outline-none focus:border-[#3f54cc] focus:ring-1 focus:ring-[#3f54cc]/20
                         placeholder-[#c7c7cc]"
            />
          </label>
        </div>
      )}
    </div>
  )
}
