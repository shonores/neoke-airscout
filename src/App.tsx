import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { AppState, Config, ConsentResponse } from './types'
import { ceOutcome } from './types'
import { createGetToken, clearTokenCache } from './api/auth'
import { createPhotoIdRequest, pollSessionResult } from './api/vpRequest'
import { sendToWallet } from './api/consent'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { EmailStep } from './components/EmailStep'
import { ProcessingStep } from './components/ProcessingStep'
import { ConsentPendingStep } from './components/ConsentPendingStep'
import { PassengerProfile } from './components/PassengerProfile'
import { ErrorState } from './components/ErrorState'

// Hero images from Figma (valid ~7 days from design export)
const IMG_PLANE = 'https://www.figma.com/api/mcp/asset/4dede6d6-9dfd-4b67-9707-0532c5ed5c53'
const IMG_CLOUDS = 'https://www.figma.com/api/mcp/asset/bad61330-ff62-4121-9238-ee64c53088f7'

// AirScout verifier credentials — set via Vercel env vars (VITE_ prefix exposes
// them to the browser bundle). The ConfigPanel lets you override at runtime.
const DEFAULT_CONFIG: Config = {
  nodeId: import.meta.env['VITE_AIRSCOUT_NODE_ID'] ?? '',
  apiKey: import.meta.env['VITE_AIRSCOUT_API_KEY'] ?? '',
  ceUrl: import.meta.env['VITE_AIRSCOUT_CE_URL'] ?? 'https://neoke-consent-engine.fly.dev',
  demoDid: '',
}

export default function App() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [appState, setAppState] = useState<AppState>('home')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  // Pending consent state
  const [queueItemId, setQueueItemId] = useState('')
  const [sessionId, setSessionId] = useState('')

  // Success state
  const [credentialData, setCredentialData] = useState<unknown>(null)

  const getToken = useCallback(() => createGetToken(config)(), [config])

  const handleSubmit = async (submittedEmail: string) => {
    setEmail(submittedEmail)
    setError('')

    // ── Step 1: Discover DID from email ──────────────────────────────────────
    setAppState('discovering')

    let did: string
    if (config.demoDid.trim()) {
      // Demo override: skip network lookup
      did = config.demoDid.trim()
    } else {
      try {
        const res = await fetch('/api/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: submittedEmail }),
        })
        const body = await res.json() as { did?: string; error?: string }
        if (!res.ok || !body.did) {
          setError(body.error ?? 'No wallet found for this email address. Use the "Test Wallet DID" override in settings to test.')
          setAppState('error')
          return
        }
        did = body.did
      } catch (e) {
        setError(`Discovery request failed: ${String(e)}`)
        setAppState('error')
        return
      }
    }

    // ── Step 2: Create VP request on the node ───────────────────────────────
    setAppState('requesting')

    const callbackUrl = `${window.location.origin}/api/callback`
    const { result: vpResult, error: vpError } = await createPhotoIdRequest(
      config.nodeId,
      getToken,
      callbackUrl,
    )

    if (vpError || !vpResult?.rawLink) {
      setError(vpError ?? 'Failed to create VP request — no rawLink returned')
      setAppState('error')
      return
    }

    // ── Step 3: Send rawLink to Consent Engine ───────────────────────────────
    setAppState('sending')

    const { result: ceResult, error: ceError } = await sendToWallet(
      config.ceUrl,
      did,
      vpResult.rawLink,
    )

    if (ceError || !ceResult) {
      setError(ceError ?? 'Consent Engine returned no response')
      setAppState('error')
      return
    }

    // ── Step 4: Handle CE response ───────────────────────────────────────────
    const outcome = ceOutcome(ceResult)

    if (outcome === 'auto_executed') {
      // Standing consent — CE immediately called /respond on the node on behalf
      // of the wallet. Poll the session endpoint (not the CE redirectUri) until
      // the node reports a terminal status. Auth: Bearer token from node API key.
      if (vpResult.sessionId) {
        const { data, error: fetchErr } = await pollSessionResult(config.nodeId, getToken, vpResult.sessionId)
        if (fetchErr) {
          setError(fetchErr)
          setAppState('error')
          return
        }
        setCredentialData(data)
      } else {
        // No sessionId — unlikely but fall back to the CE response body
        setCredentialData(ceResult)
      }
      setAppState('success')
      return
    }

    if (outcome === 'queued') {
      const qi = ceResult.queuedItem
      if (!qi?.id) {
        setError('CE returned "queued" but no queuedItem.id')
        setAppState('error')
        return
      }
      setQueueItemId(qi.id)
      setSessionId(vpResult.sessionId ?? '')
      setAppState('pending')
      return
    }

    if (outcome === 'rejected') {
      const reason = ceResult.reason ?? 'rejected'
      setError(`Request rejected by wallet: ${reason}`)
      setAppState('error')
      return
    }

    // Unknown outcome — treat as error
    setError(`Unknown CE outcome: "${outcome}"`)
    setAppState('error')
  }

  const handleConsentResolved = (data: unknown) => {
    setCredentialData(data)
    setAppState('success')
  }

  const handleConsentRejected = (reason: string) => {
    setError(reason)
    setAppState('error')
  }

  const handleSignOut = () => {
    clearTokenCache()
    setAppState('home')
    setEmail('')
    setError('')
    setCredentialData(null)
    setQueueItemId('')
    setSessionId('')
  }

  const isProcessing = appState === 'discovering' || appState === 'requesting' || appState === 'sending'

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
        <Header onSignOut={handleSignOut} showSignOut={appState === 'success'} />

        {/* Main content */}
        <main className="flex-1 flex items-start lg:items-center px-6 pt-8 lg:pt-0 pb-12">
          {/* Left column: hero text + form */}
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
                />
              )}

              {isProcessing && (
                <ProcessingStep key="processing" state={appState} />
              )}

              {appState === 'pending' && (
                <ConsentPendingStep
                  key="pending"
                  nodeId={config.nodeId}
                  getToken={getToken}
                  ceUrl={config.ceUrl}
                  queueItemId={queueItemId}
                  sessionId={sessionId}
                  onResolved={handleConsentResolved}
                  onRejected={handleConsentRejected}
                  onCancel={handleSignOut}
                />
              )}

              {appState === 'success' && credentialData && (
                <PassengerProfile
                  key="success"
                  email={email}
                  data={credentialData}
                  onSignOut={handleSignOut}
                />
              )}

              {appState === 'error' && (
                <ErrorState
                  key="error"
                  message={error}
                  onRetry={handleSignOut}
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
