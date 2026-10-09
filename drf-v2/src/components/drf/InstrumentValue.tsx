import type { CSSProperties } from 'react'

// Original digit reveal: every digit is the final documented value, never a
// synthetic intermediate measurement. The accessible value is announced once.
export function InstrumentValue({ value }: { value: string }) {
  return <span className="drf-instrument-value">
    <span className="drf-sr-only">{value}</span>
    <span aria-hidden="true" className="drf-digit-line" key={value}>
      {Array.from(value).map((digit, index) => <span key={index} className="drf-digit-window"><span style={{ '--digit-order': index } as CSSProperties}>{digit}</span></span>)}
    </span>
  </span>
}
