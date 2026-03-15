import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { AppState, Config, Flight, PassengerData, SearchQuery, VerifyResponse } from './types'
import { verify } from './api/verify'
import { issueCredential } from './api/issue'
import { AIRSCOUT_SERVICE_NAME, AIRSCOUT_NODE_ID } from './serviceConfig'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { SearchStep } from './components/SearchStep'
import { FlightResultsStep } from './components/FlightResultsStep'
import { PassengerInfoStep } from './components/PassengerInfoStep'
import { BookingConfirmedStep } from './components/BookingConfirmedStep'
import { CheckInStep } from './components/CheckInStep'
import { CheckedInStep } from './components/CheckedInStep'
import { ErrorState } from './components/ErrorState'
import { WalletLoginModal } from './components/WalletLoginModal'

const AIRSCOUT_LOGO_URI =
  "data:image/svg+xml,%3Csvg%20width%3D%2264%22%20height%3D%2264%22%20viewBox%3D%220%200%2064%2064%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%233f54cc%22%2F%3E%3Cpath%20d%3D%22M44%2020L20%2032l6%203%202%209%205-5%208%203%203-22z%22%20fill%3D%22white%22%2F%3E%3C%2Fsvg%3E"

const BAKED_CE_URL     = import.meta.env['VITE_AIRSCOUT_CE_URL']     ?? ''
const BAKED_CE_API_KEY = import.meta.env['VITE_AIRSCOUT_CE_API_KEY'] ?? ''
const BAKED_CREDENTIAL_TYPE =
  import.meta.env['VITE_AIRSCOUT_TEMPLATE_ID']
    ? `template:${import.meta.env['VITE_AIRSCOUT_TEMPLATE_ID']}`
    : (import.meta.env['VITE_AIRSCOUT_CREDENTIAL_TYPE'] ?? 'sdjwt-epassport-copy')

const DEFAULT_CONFIG: Config = {
  ceUrl:    BAKED_CE_URL    || 'https://neoke-consent-engine.fly.dev',
  ceApiKey: BAKED_CE_API_KEY,
}

// Hero images per screen sourced from Figma design exports
const HERO: Record<string, { plane: string; clouds: string }> = {
  search: {
    plane:  'https://www.figma.com/api/mcp/asset/676f5340-14d5-4a11-b20a-5e35092c1f23',
    clouds: 'https://www.figma.com/api/mcp/asset/44ec430c-722d-442c-b38f-1eb1cf9e66ce',
  },
  results: {
    plane:  'https://www.figma.com/api/mcp/asset/7275585d-2e4e-4a98-96cc-6f08af3587f6',
    clouds: 'https://www.figma.com/api/mcp/asset/2201a4fc-3b76-42b3-8d87-c94485a5210e',
  },
  passenger_info: {
    plane:  'https://www.figma.com/api/mcp/asset/ea4a458d-aedd-4cc4-8b0e-817900eef3fd',
    clouds: 'https://www.figma.com/api/mcp/asset/b27d17d2-837c-4391-9780-06f390be4471',
  },
  booking_confirmed: {
    plane:  'https://www.figma.com/api/mcp/asset/a064b7ad-34e1-47ca-9c42-1aa4904e9535',
    clouds: 'https://www.figma.com/api/mcp/asset/573253f4-163b-4358-83a2-f5c0114165ef',
  },
}

function getHero(state: AppState) {
  return HERO[state] ?? HERO.search
}

function extractPassengerFromClaims(claims: Record<string, unknown>): Partial<PassengerData> {
  const flat: Record<string, unknown> = { ...claims }
  if (typeof claims.electronicPassport === 'object' && claims.electronicPassport) {
    Object.assign(flat, claims.electronicPassport as object)
  }
  const s = (v: unknown) => (v ? String(v) : '')
  return {
    firstName:   s(flat.given_name   ?? flat.firstName  ?? flat.givenName),
    lastName:    s(flat.family_name  ?? flat.lastName   ?? flat.familyName ?? flat.surname),
    email:       s(flat.email        ?? flat.email_address ?? flat.emailAddress),
    birthDate:   s(flat.birth_date   ?? flat.birthDate  ?? flat.date_of_birth)  || undefined,
    nationality: s(flat.nationality  ?? flat.issuing_country ?? flat.issuingCountry) || undefined,
  }
}

export default function App() {
  const [config] = useState<Config>(DEFAULT_CONFIG)

  // App state machine
  const [appState,       setAppState]       = useState<AppState>('search')
  const [searchQuery,    setSearchQuery]    = useState<SearchQuery | null>(null)
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [passengerData,  setPassengerData]  = useState<PassengerData | null>(null)
  const [error,          setError]          = useState('')

  // Wallet login session (from header login button)
  const [isLoggedIn,       setIsLoggedIn]       = useState(false)
  const [walletLoginData,  setWalletLoginData]  = useState<Partial<PassengerData> | null>(null)
  const [walletNodeId,     setWalletNodeId]     = useState<string | undefined>(undefined)
  const [showLoginModal,   setShowLoginModal]   = useState(false)

  // Bound verify calls — context-specific opts for booking vs check-in
  const runVerifyForBooking = (email: string): Promise<{ result?: VerifyResponse; error?: string }> =>
    verify(config.ceUrl, config.ceApiKey, email, BAKED_CREDENTIAL_TYPE, {
      verifierName: AIRSCOUT_SERVICE_NAME,
      logoUri: AIRSCOUT_LOGO_URI,
      transactionData: ['Prefill your booking details from your travel document'],
    })

  const runVerifyForCheckIn = (email: string): Promise<{ result?: VerifyResponse; error?: string }> =>
    verify(config.ceUrl, config.ceApiKey, email, BAKED_CREDENTIAL_TYPE, {
      verifierName: AIRSCOUT_SERVICE_NAME,
      logoUri: AIRSCOUT_LOGO_URI,
      transactionData: ['Get you ready to travel — verify your identity to proceed to check-in'],
    })

  const handleReset = () => {
    setAppState('search')
    setSearchQuery(null)
    setSelectedFlight(null)
    setPassengerData(null)
    setError('')
    setIsLoggedIn(false)
    setWalletLoginData(null)
    setWalletNodeId(undefined)
  }

  // --- Header wallet login ---
  const handleHeaderLoginSuccess = (claims: Record<string, unknown>, email: string, nodeId?: string) => {
    const extracted = extractPassengerFromClaims(claims)
    const data: Partial<PassengerData> = { ...extracted, email: extracted.email || email }
    setWalletLoginData(data)
    setWalletNodeId(nodeId)
    setIsLoggedIn(true)
    setShowLoginModal(false)
  }

  // --- Step 1: Search → Results ---
  const handleSearch = (query: SearchQuery) => {
    setSearchQuery(query)
    setAppState('results')
  }

  // --- Step 2: Flight selected → Passenger info ---
  const handleFlightSelect = (flight: Flight) => {
    setSelectedFlight(flight)
    setAppState('passenger_info')
  }

  // --- Step 3: Manual continue → Booking confirmed ---
  const handlePassengerContinue = (data: PassengerData) => {
    setPassengerData(data)
    setAppState('booking_confirmed')
  }

  // --- Step 4/5: Auto check-in (CE verify call #2) with 3s minimum animation ---
  const handleCheckIn = async () => {
    const email = passengerData?.email ?? walletLoginData?.email ?? ''
    setAppState('checkin_verifying')

    const startTime = Date.now()
    const { result, error: err } = await runVerifyForCheckIn(email)

    const elapsed = Date.now() - startTime
    if (elapsed < 3000) await new Promise(r => setTimeout(r, 3000 - elapsed))

    if (err || !result) {
      setError(err ?? 'No response from consent engine')
      setAppState('error')
      return
    }

    if (result.action === 'auto_executed' || result.action === 'approved') {
      setAppState('checked_in')
      // Issue boarding pass credential to the passenger's wallet (fire-and-forget)
      // Prefer the verified nodeId from the CE result — avoids a second directory lookup.
      // Fall back to email if nodeId isn't in the result.
      const issueTarget = walletNodeId
        ? { nodeId: walletNodeId }
        : result.nodeId ? { nodeId: result.nodeId }
        : passengerData?.email ? { email: passengerData.email } : null
      if (selectedFlight && issueTarget && passengerData) {
        issueCredential(
          config.ceUrl,
          config.ceApiKey,
          issueTarget,
          'BoardingPass',
          {
            passengerName: `${passengerData.firstName} ${passengerData.lastName}`,
            flightNumber: selectedFlight.id,
            origin: selectedFlight.fromCode,
            destination: selectedFlight.toCode,
            departureTime: selectedFlight.departTime,
            arrivalTime: selectedFlight.arrivalTime,
            ...(passengerData.nationality ? { nationality: passengerData.nationality } : {}),
          },
          AIRSCOUT_NODE_ID,
          AIRSCOUT_SERVICE_NAME,
        ).catch(() => { /* boarding pass issuance is best-effort */ })
      }
      return
    }

    if (result.action === 'rejected') {
      setError(`Check-in request rejected: ${result.reason ?? 'no reason given'}`)
      setAppState('error')
      return
    }

    setError('Unable to complete check-in. Please try again.')
    setAppState('error')
  }

  const hero          = getHero(appState)
  const showWalletLogin = !['booking_confirmed', 'checkin_verifying', 'checked_in'].includes(appState)
  const showSignOut     = appState === 'booking_confirmed' || appState === 'checked_in'
  const loggedInName    = [walletLoginData?.firstName, walletLoginData?.lastName].filter(Boolean).join(' ')

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #b4cfe8 0%, #a9c5eb 40%, #a5c1e5 100%)' }}
    >
      {/* Hero images — right side, desktop only */}
      <div className="absolute right-0 top-0 w-[55%] h-full pointer-events-none select-none hidden lg:block">
        <img src={hero.clouds} alt=""
          className="absolute bottom-[20%] right-[-5%] w-[85%] object-contain opacity-90" />
        <img src={hero.plane} alt=""
          className="absolute top-[10%] right-[-2%] w-[90%] object-contain drop-shadow-2xl" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <Header
          showWalletLogin={showWalletLogin}
          isLoggedIn={isLoggedIn}
          loggedInName={loggedInName || undefined}
          onWalletLoginClick={() => setShowLoginModal(true)}
          onLogout={handleReset}
          showSignOut={showSignOut}
          onSignOut={handleReset}
        />

        {/* Main content — constrained to left portion on desktop, centered within that area */}
        <main className="flex-1 flex items-start lg:items-center px-6 lg:pl-12 lg:pr-[52%] pt-8 lg:pt-0 pb-16">
          <div className="w-full flex flex-col lg:items-center">
            <AnimatePresence mode="wait">

              {appState === 'search' && (
                <SearchStep key="search" onSearch={handleSearch} />
              )}

              {appState === 'results' && searchQuery && (
                <FlightResultsStep
                  key="results"
                  searchQuery={searchQuery}
                  onBack={() => setAppState('search')}
                  onSelect={handleFlightSelect}
                />
              )}

              {appState === 'passenger_info' && (
                <PassengerInfoStep
                  key={isLoggedIn ? 'passenger-loggedin' : 'passenger'}
                  initialData={walletLoginData ?? undefined}
                  onBack={() => setAppState('results')}
                  onContinue={handlePassengerContinue}
                  onRequestWalletVerify={runVerifyForBooking}
                />
              )}

              {appState === 'booking_confirmed' && selectedFlight && passengerData && (
                <BookingConfirmedStep
                  key="booking-confirmed"
                  flight={selectedFlight}
                  passenger={passengerData}
                  travelDate={searchQuery?.date ?? ''}
                  onAutoCheckIn={handleCheckIn}
                  onReset={handleReset}
                />
              )}

              {appState === 'checkin_verifying' && (
                <CheckInStep key="checkin-verifying" />
              )}

              {appState === 'checked_in' && selectedFlight && passengerData && (
                <CheckedInStep
                  key="checked-in"
                  flight={selectedFlight}
                  passenger={passengerData}
                  travelDate={searchQuery?.date ?? ''}
                  onReset={handleReset}
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

      {/* Header wallet login modal */}
      {showLoginModal && (
        <WalletLoginModal
          onVerify={runVerifyForBooking}
          onSuccess={handleHeaderLoginSuccess}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  )
}
