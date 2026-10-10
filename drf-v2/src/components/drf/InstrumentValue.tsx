import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

// Original digit reveal: every digit is the final documented value, never a
// synthetic intermediate measurement. The accessible value is announced once.
export function InstrumentValue({ value, reducedMotion = true, replay = 0 }: { value: string; reducedMotion?: boolean; replay?: number }) {
  const element = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  useEffect(() => {
    if (reducedMotion || !element.current) return
    const observer = new IntersectionObserver(entries => setVisible(entries[0]?.isIntersecting ?? false))
    observer.observe(element.current)
    const visibility = () => setPageVisible(!document.hidden)
    visibility()
    document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [reducedMotion])
  return <span ref={element} className="drf-instrument-value" data-animate={!reducedMotion} data-visible={visible && pageVisible}>
    <span className="drf-sr-only">{value}</span>
    <span aria-hidden="true" className="drf-number-line" key={`${value}/${replay}`}>
      {Array.from(value).map((digit, index) => <span key={index} className="drf-number-window"><span className="drf-number-glyph" style={{ '--digit-order': index } as CSSProperties}>{digit}</span></span>)}
    </span>
  </span>
}
