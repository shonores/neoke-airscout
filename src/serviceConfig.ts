/**
 * Service identity constants for AirScout and its partner services.
 * Values are read from VITE_ env vars so they can be configured per deployment
 * without touching source code.
 */

export const AIRSCOUT_SERVICE_NAME: string =
  import.meta.env['VITE_AIRSCOUT_SERVICE_NAME'] ?? 'AirScout Airlines'

export const AIRSCOUT_NODE_ID: string =
  import.meta.env['VITE_AIRSCOUT_NODE_ID'] ?? 'airscout'

export const HOTELSCOUT_SERVICE_NAME: string =
  import.meta.env['VITE_HOTELSCOUT_SERVICE_NAME'] ?? 'HotelScout'
