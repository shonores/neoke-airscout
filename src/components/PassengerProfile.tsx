import { motion } from 'framer-motion'

function formatFieldName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

// CE /v1/verify returns a flat { fieldName: value } map — use it directly.
function extractClaims(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object') return {}
  return data as Record<string, unknown>
}

const PRIORITY_FIELDS = ['given_name', 'family_name', 'birth_date', 'document_number', 'issuing_country', 'issue_date', 'expiry_date']
const FIELD_LABELS: Record<string, string> = {
  given_name: 'Given name',
  family_name: 'Family name',
  birth_date: 'Date of birth',
  document_number: 'Document number',
  issuing_country: 'Issuing country',
  issue_date: 'Issue date',
  expiry_date: 'Expiry date',
}

interface Props {
  email: string
  data: unknown
  onSignOut: () => void
}

export function PassengerProfile({ email, data, onSignOut }: Props) {
  const claims = extractClaims(data)
  const signatureValid = undefined
  const deviceAuthVerified = undefined

  const givenName = claims['given_name'] ? String(claims['given_name']) : ''
  const familyName = claims['family_name'] ? String(claims['family_name']) : ''
  const fullName = [givenName, familyName].filter(Boolean).join(' ') || 'Passenger'

  // Ordered fields
  const orderedFields = [
    ...PRIORITY_FIELDS.filter(k => k in claims),
    ...Object.keys(claims).filter(k => !PRIORITY_FIELDS.includes(k)),
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-white rounded-xl shadow-[0px_2px_5px_rgba(36,35,41,0.03),0px_9px_9px_rgba(36,35,41,0.03),0px_21px_13px_rgba(36,35,41,0.02)]
                 w-full max-w-[560px] overflow-hidden"
    >
      {/* Top banner */}
      <div className="bg-[#3f54cc] px-8 py-6 flex items-center justify-between">
        <div>
          <p className="text-white/70 text-[13px] font-medium uppercase tracking-wide">Welcome aboard</p>
          <p className="text-white text-[26px] font-extrabold leading-tight mt-0.5">{fullName}</p>
          <p className="text-white/60 text-[13px] mt-1">{email}</p>
        </div>
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      </div>

      {/* Verification badges */}
      <div className="flex gap-2 px-8 pt-4">
        {signatureValid === true && (
          <span className="flex items-center gap-1 text-[12px] text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Signature verified
          </span>
        )}
        {deviceAuthVerified === true && (
          <span className="flex items-center gap-1 text-[12px] text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Device auth verified
          </span>
        )}
        <span className="flex items-center gap-1 text-[12px] text-[#3f54cc] bg-[#eef0fb] border border-[#c7cdf5] px-2.5 py-1 rounded-full">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          mDOC Photo ID
        </span>
      </div>

      {/* Credential fields */}
      <div className="px-8 py-5">
        <p className="text-[11px] font-semibold uppercase text-[#8e8e93] tracking-wide mb-4">
          Disclosed claims
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {orderedFields.map(key => (
            <div key={key}>
              <p className="text-[12px] text-[#8e8e93] uppercase tracking-wide mb-0.5">
                {FIELD_LABELS[key] ?? formatFieldName(key)}
              </p>
              <p className="text-[15px] font-semibold text-[#28272e]">
                {formatValue(claims[key])}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-8 pb-6 flex gap-3 border-t border-[#f0f0f2] pt-5">
        <button
          onClick={onSignOut}
          className="flex-1 border border-[#d7d6dc] text-[#28272e] text-[15px] font-medium py-3 rounded-full
                     hover:bg-[#f8f8fa] active:bg-[#f0f0f2] transition-colors"
        >
          Sign out
        </button>
        <button
          className="flex-1 bg-[#3f54cc] text-white text-[15px] font-medium py-3 rounded-full
                     hover:bg-[#3449b8] active:bg-[#2d3fa8] transition-colors
                     shadow-lg shadow-[#3f54cc]/20"
        >
          Continue to boarding
        </button>
      </div>
    </motion.div>
  )
}
