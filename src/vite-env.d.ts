/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AIRSCOUT_NODE_ID?: string
  readonly VITE_AIRSCOUT_API_KEY?: string
  readonly VITE_AIRSCOUT_CE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
