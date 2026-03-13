/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AIRSCOUT_CE_URL?: string
  readonly VITE_AIRSCOUT_CE_API_KEY?: string
  /** IDN node template UUID — takes precedence over VITE_AIRSCOUT_CREDENTIAL_TYPE */
  readonly VITE_AIRSCOUT_TEMPLATE_ID?: string
  /** Preset credential type ID (e.g. sdjwt-epassport-copy) — used when TEMPLATE_ID is not set */
  readonly VITE_AIRSCOUT_CREDENTIAL_TYPE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
