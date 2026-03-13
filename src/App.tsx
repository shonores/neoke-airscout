import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { AppState, Config } from './types'
import { verify } from './api/verify'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { EmailStep } from './components/EmailStep'
import { ProcessingStep } from './components/ProcessingStep'
import { PassengerProfile } from './components/PassengerProfile'
import { ErrorState } from './components/ErrorState'

// Hero images from Figma (valid ~7 days from design export)
const IMG_PLANE = 'https://www.figma.com/api/mcp/asset/4dede6d6-9dfd-4b67-9707-0532c5ed5c53'
const IMG_CLOUDS = 'https://www.figma.com/api/mcp/asset/bad61330-ff62-4121-9238-ee64c53088f7'

// Baked-in credentials — set via Vercel env vars (VITE_ prefix exposes to browser bundle).
// ConfigPanel is hidden when both are present.
const BAKED_CE_URL = import.meta.env['VITE_AIRSCOUT_CE_URL'] ?? ''
const BAKED_CE_API_KEY = import.meta.env['VITE_AIRSCOUT_CE_API_KEY'] ?? ''
const isBaked = Boolean(BAKED_CE_URL && BAKED_CE_API_KEY)

const DEFAULT_CONFIG: Config = {
  ceUrl: BAKED_CE_URL || 'https://neoke-consent-engine.fly.dev',
  ceApiKey: BAKED_CE_API_KEY,
}

export default function App() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [appState, setAppState] = useState<AppState>('home')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [credentialData, setCredentialData] = useState<Record<string, unknown> | null>(null)

  const handleSubmit = async (submittedEmail: string) => {
    setEmail(submittedEmail)
    setError('')
    setAppState('verifying')

    const { result, error: err } = await verify(
      config.ceUrl,
      config.ceApiKey,
      submittedEmail,
      'mdoc-photoid-full',
    )

    if (err || !result) {
      setError(err ?? 'No response from consent engine')
      setAppState('error')
      return
    }

    if (result.action === 'auto_executed' || result.action === 'approved') {
      setCredentialData(result.claims ?? {})
      setAppState('success')
      return
    }

    if (result.action === 'rejected') {
      setError(`Request rejected by wallet: ${result.reason ?? 'no reason given'}`)
      setAppState('error')
      return
    }

    if (result.action === 'timeout') {
      setError('No response from wallet within the allowed time. Please try again.')
      setAppState('error')
      return
    }

    setError(`Unexpected response: ${result.action}`)
    setAppState('error')
  }

  const handleReset = () => {
    setAppState('home')
    setEmail('')
    setError('')
    setCredentialData(null)
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #b4cfe8 0%, #a9c5eb 40%, #a5c1e5 100%)' }}>
      {/* Hero plane + clouds (right side) */}
      <div className="absolute right-0 top-0 w-[55%] h-full pointer-events-none select-none hidden lg:block">
        <img
          src={IMG_CLOUDS}
          alt=""
          className="absolute bottom-[20%] right-[-5%] w-[85%] object-contain opacity-90"
        />
        <img
          src={IMG_PLANE}
          alt="AirScout plane"
          className="absolute top-[10%] right-[-2%] w-[90%] object-contain drop-shadow-2xl"
        />
      </div>

      {/* Page layout */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header onSignOut={handleReset} showSignOut={appState === 'success'} />

        <main className="flex-1 flex items-start lg:items-center px-6 pt-8 lg:pt-0 pb-12">
          <div className="w-full lg:max-w-[560px] flex flex-col gap-8">
            {/* Hero headline */}
            <div>
              <h1 className="text-[52px] sm:text-[56px] font-black text-[#28272e] leading-tight">
                AirScout
              </h1>
              <p className="text-[18px] font-semibold text-[#28272e]/80 mt-1">
                Experience the Art of Effortless Travel
              </p>
            </div>

            {/* State content */}
            <AnimatePresence mode="wait">
              {appState === 'home' && (
                <EmailStep
                  key="email"
                  config={config}
                  onConfigChange={setConfig}
                  onSubmit={handleSubmit}
                  hideConfig={isBaked}
                />
              )}

              {appState === 'verifying' && (
                <ProcessingStep key="processing" />
              )}

              {appState === 'success' && credentialData && (
                <PassengerProfile
                  key="success"
                  email={email}
                  data={credentialData}
                  onSignOut={handleReset}
                />
              )}

              {appState === 'error' && (
                <ErrorState
                  key="error"
                  message={error}
                  onRetry={handleReset}
                />
              )}
            </AnimatePresence>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
