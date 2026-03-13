export type AppState =
  | 'search'
  | 'results'
  | 'passenger_info'
  | 'booking_confirmed'
  | 'checkin_verifying'
  | 'checked_in'
  | 'error'

export interface Config {
  ceUrl: string
  ceApiKey: string
}

export interface VerifyResponse {
  action: 'auto_executed' | 'approved' | 'rejected' | 'timeout' | 'error'
  claims?: Record<string, unknown>
  reason?: string
  requestId?: string
  nodeId?: string
}

export interface Flight {
  id: string
  fromCode: string
  from: string
  toCode: string
  to: string
  departTime: string
  arrivalTime: string
  duration: string
  stops: string
  price: number
}

export interface PassengerData {
  firstName: string
  lastName: string
  email: string
  birthDate?: string
  nationality?: string
}

export interface SearchQuery {
  from: string
  to: string
  date: string
}
