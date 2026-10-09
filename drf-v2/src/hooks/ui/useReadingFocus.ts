import { useCallback, useEffect, useRef } from 'react'
import type { PortfolioShellProps } from '../../contracts/index.ts'

// Inline reading regions leave Tab free to reach the navigation; no modal trap.
export function useReadingFocus({ state, actions }: Pick<PortfolioShellProps, 'state' | 'actions'>) {
  const openerRef = useRef<HTMLElement | null>(null)
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const recruiter = state.mode === 'recruiter'

  useEffect(() => {
    actions.setPanelOpen(recruiter || state.target.projectId !== null)
  }, [actions, recruiter, state.target.projectId, state.target.zoneId])

  useEffect(() => {
    if (recruiter) {
      const target = state.target.projectId ? document.getElementById(`drf-project-${state.target.projectId}`) : document.getElementById(`drf-zone-${state.target.zoneId}`)
      target?.focus({ preventScroll: true })
      target?.scrollIntoView({ block: 'start' })
    } else if (state.panelOpen) {
      headingRef.current?.focus({ preventScroll: true })
      headingRef.current?.scrollIntoView({ block: 'start' })
    }
  }, [recruiter, state.panelOpen, state.target.projectId, state.target.zoneId])

  const close = useCallback(() => {
    actions.setPanelOpen(false)
    requestAnimationFrame(() => {
      const projectTrigger = state.target.projectId ? document.getElementById(`drf-select-${state.target.projectId}`) : null
      const fallback = projectTrigger ?? document.getElementById('drf-open-reading') ?? document.querySelector<HTMLElement>('.drf-zone-nav [aria-current]')
      const target = openerRef.current?.isConnected ? openerRef.current : fallback
      target?.focus()
    })
  }, [actions, state.target.projectId])

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
