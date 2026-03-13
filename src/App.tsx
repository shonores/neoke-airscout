import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { AppState, Config, Flight, PassengerData, SearchQuery } from './types'
import { verify } from './api/verify'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { SearchStep } from './components/SearchStep'
import { FlightResultsStep } from './components/FlightResultsStep'
import { PassengerInfoStep } from './components/PassengerInfoStep'
import { ProcessingStep } from './components/ProcessingStep'
import { BookingConfirmedStep } from './components/BookingConfirmedStep'
import { CheckInStep } from './components/CheckInStep'
import { CheckedInStep } from './components/CheckedInStep'
import { ErrorState } from './components/ErrorState'

// Baked-in credentials — set via Vercel env vars (VITE_ prefix exposes to browser bundle).
const BAKED_CE_URL = import.meta.env['VITE_AIRSCOUT_CE_URL'] ?? ''
const BAKED_CE_API_KEY = import.meta.env['VITE_AIRSCOUT_CE_API_KEY'] ?? ''
// VITE_AIRSCOUT_TEMPLATE_ID takes precedence over VITE_AIRSCOUT_CREDENTIAL_TYPE.
const BAKED_CREDENTIAL_TYPE =
  import.meta.env['VITE_AIRSCOUT_TEMPLATE_ID']
    ? `template:${import.meta.env['VITE_AIRSCOUT_TEMPLATE_ID']}`
    : (import.meta.env['VITE_AIRSCOUT_CREDENTIAL_TYPE'] ?? 'sdjwt-epassport-copy')

const DEFAULT_CONFIG: Config = {
  ceUrl: BAKED_CE_URL || 'https://neoke-consent-engine.fly.dev',
  ceApiKey: BAKED_CE_API_KEY,
}

// Hero images per screen — sourced from Figma design exports
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

/** Extract passenger fields from wallet claims — handles flat and nested (electronicPassport) shapes. */
function extractPassengerFromClaims(claims: Record<string, unknown>): Partial<PassengerData> {
  const flat: Record<string, unknown> = { ...claims }
  if (typeof claims.electronicPassport === 'object' && claims.electronicPassport) {
    Object.assign(flat, claims.electronicPassport as object)
  }
  return {
    firstName: String(flat.given_name ?? flat.firstName ?? flat.givenName ?? ''),
    lastName:  String(flat.family_name ?? flat.lastName ?? flat.familyName ?? flat.surname ?? ''),
    email:     String(flat.email ?? flat.email_address ?? flat.emailAddress ?? ''),
    birthDate: String(flat.birth_date ?? flat.birthDate ?? flat.date_of_birth ?? '') || undefined,
  }
}

export default function App() {
  const [config] = useState<Config>(DEFAULT_CONFIG)
  const [appState, setAppState] = useState<AppState>('search')
  const [searchQuery, setSearchQuery] = useState<SearchQuery | null>(null)
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [passengerData, setPassengerData] = useState<PassengerData | null>(null)
  const [error, setError] = useState('')

  const handleReset = () => {
    setAppState('search')
    setSearchQuery(null)
    setSelectedFlight(null)
    setPassengerData(null)
    setError('')
  }

  // Step 1: Search → Results
  const handleSearch = (query: SearchQuery) => {
    setSearchQuery(query)
    setAppState('results')
  }

  // Step 2: Results → Passenger info
  const handleFlightSelect = (flight: Flight) => {
    setSelectedFlight(flight)
    setAppState('passenger_info')
  }

  // Step 3a: Manual passenger info → Booking confirmed
  const handlePassengerContinue = (data: PassengerData) => {
    setPassengerData(data)
    setAppState('booking_confirmed')
  }

  // Step 3b: Wallet fill — CE verify call #1 (booking)
  const handleWalletFill = async (email: string) => {
    if (!email.trim()) return
    setAppState('booking_verifying')

    const { result, error: err } = await verify(config.ceUrl, config.ceApiKey, email, BAKED_CREDENTIAL_TYPE)

    if (err || !result) {
      setError(err ?? 'No response from consent engine')
      setAppState('error')
      return
    }

    if (result.action === 'auto_executed' || result.action === 'approved') {
      const extracted = extractPassengerFromClaims(result.claims ?? {})
      setPassengerData({
        firstName: extracted.firstName || '',
        lastName:  extracted.lastName  || '',
        email:     extracted.email     || email,
        birthDate: extracted.birthDate,
      })
      setAppState('booking_confirmed')
      return
    }

    if (result.action === 'rejected') {
      setError(`Wallet request rejected: ${result.reason ?? 'no reason given'}`)
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

  // Step 5: Check in now — CE verify call #2 (check-in), minimum 3s animation
  const handleCheckIn = async () => {
    const email = passengerData?.email ?? ''
    setAppState('checkin_verifying')

    const startTime = Date.now()
    const { result, error: err } = await verify(config.ceUrl, config.ceApiKey, email, BAKED_CREDENTIAL_TYPE)

    // Ensure at least 3 seconds of the check-in animation plays
    const elapsed = Date.now() - startTime
    if (elapsed < 3000) {
      await new Promise(r => setTimeout(r, 3000 - elapsed))
    }

    if (err || !result) {
      setError(err ?? 'No response from consent engine')
      setAppState('error')
      return
    }

    if (result.action === 'auto_executed' || result.action === 'approved') {
      setAppState('checked_in')
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

  const hero = getHero(appState)
  const showSignOut = appState === 'booking_confirmed' || appState === 'checked_in'

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #b4cfe8 0%, #a9c5eb 40%, #a5c1e5 100%)' }}
    >
      {/* Hero images — right side, desktop only */}
      <div className="absolute right-0 top-0 w-[55%] h-full pointer-events-none select-none hidden lg:block">
        <img
          src={hero.clouds}
          alt=""
          className="absolute bottom-[20%] right-[-5%] w-[85%] object-contain opacity-90"
        />
        <img
          src={hero.plane}
          alt=""
          className="absolute top-[10%] right-[-2%] w-[90%] object-contain drop-shadow-2xl"
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <Header onSignOut={handleReset} showSignOut={showSignOut} />

        <main className="flex-1 flex items-start lg:items-center px-6 pt-8 lg:pt-0 pb-16">
          <div className="w-full flex flex-col">
            <AnimatePresence mode="wait">
              {appState === 'search' && (
                <SearchStep key="search" onSearch={handleSearch} />
              )}

              {appState === 'results' && (
                <FlightResultsStep
                  key="results"
                  onBack={() => setAppState('search')}
                  onSelect={handleFlightSelect}
                />
              )}

              {appState === 'passenger_info' && (
                <PassengerInfoStep
                  key="passenger"
                  onBack={() => setAppState('results')}
                  onContinue={handlePassengerContinue}
                  onFillWithWallet={handleWalletFill}
                />
              )}

              {appState === 'booking_verifying' && (
                <ProcessingStep key="booking-verifying" />
              )}

              {appState === 'booking_confirmed' && selectedFlight && passengerData && (
                <BookingConfirmedStep
                  key="booking-confirmed"
                  flight={selectedFlight}
                  passenger={passengerData}
                  travelDate={searchQuery?.date ?? ''}
                  onCheckIn={handleCheckIn}
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
    </div>
  )
}
