/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AIRSCOUT_CE_URL?: string
  readonly VITE_AIRSCOUT_CE_API_KEY?: string
  /** IDN node template UUID — takes precedence over VITE_AIRSCOUT_CREDENTIAL_TYPE */
  readonly VITE_AIRSCOUT_TEMPLATE_ID?: string
  /** Preset credential type ID (e.g. sdjwt-epassport-copy) — used when TEMPLATE_ID is not set */
  readonly VITE_AIRSCOUT_CREDENTIAL_TYPE?: string
  /** Display name sent to CE as requesterService — defaults to "AirScout Airlines" */
  readonly VITE_AIRSCOUT_SERVICE_NAME?: string
  /** Display name sent to CE as recipientService — defaults to "HotelScout" */
  readonly VITE_HOTELSCOUT_SERVICE_NAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
