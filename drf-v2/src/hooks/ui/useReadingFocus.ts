import { useCallback, useEffect, useRef } from 'react'
import type { PortfolioShellProps } from '../../contracts/index.ts'

// Inline reading regions leave Tab free to reach the navigation; no modal trap.
export function useReadingFocus({ state, actions }: Pick<PortfolioShellProps, 'state' | 'actions'>) {
  const openerRef = useRef<HTMLElement | null>(null)
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const recruiter = state.mode === 'recruiter'
  const wasRecruiterRef = useRef(recruiter)

  useEffect(() => {
    if (wasRecruiterRef.current && !recruiter) document.getElementById('drf-inspect')?.focus({ preventScroll: true })
    wasRecruiterRef.current = recruiter
  }, [recruiter])

  useEffect(() => {
    // Selection is a showcase intent, not an implicit request to open reading.
    // The controller owns navigation; only recruiter is always a reading mode.
    if (recruiter) actions.setPanelOpen(true)
  }, [actions, recruiter, state.target.projectId, state.target.zoneId])

  useEffect(() => {
    if (recruiter) {
      const target = state.target.projectId ? document.getElementById(`drf-project-${state.target.projectId}`) : document.getElementById(`drf-zone-${state.target.zoneId}`)
      target?.focus({ preventScroll: true })
      target?.scrollIntoView({ block: 'start' })
    }
  }, [recruiter, state.target.projectId, state.target.zoneId])

  useEffect(() => {
    if (!recruiter && state.panelOpen) headingRef.current?.focus({ preventScroll: true })
  }, [recruiter, state.panelOpen])

  const close = useCallback(() => {
    actions.setPanelOpen(false)
    requestAnimationFrame(() => {
      const fallback = document.getElementById('drf-inspect') ?? document.querySelector<HTMLElement>('.drf-zone-nav [aria-current]')
      const target = openerRef.current?.isConnected ? openerRef.current : fallback
      target?.focus({ preventScroll: true })
    })
  }, [actions])

  useEffect(() => {
    if (!state.panelOpen || recruiter) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [close, recruiter, state.panelOpen])

  return { openerRef, headingRef, close }
}
