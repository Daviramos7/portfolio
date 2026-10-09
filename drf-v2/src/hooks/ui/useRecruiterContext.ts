import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { NavigationTarget, PortfolioShellProps, ViewMode } from '../../contracts/index.ts'

type ReadingPosition = { y: number; focusId: string | null }
const targetId = (target: NavigationTarget) => target.projectId ? `drf-project-${target.projectId}` : `drf-zone-${target.zoneId}`
const readTarget = (id: string) => {
  const heading = document.getElementById(id)
  heading?.focus({ preventScroll: true })
  heading?.scrollIntoView({ block: 'start', behavior: 'instant' })
}

// Only document reading context lives here. Navigation and URL stay with the controller.
export function useRecruiterContext({ state, actions }: Pick<PortfolioShellProps, 'state' | 'actions'>) {
  const positions = useRef(new Map<string, ReadingPosition>())
  const previous = useRef<{ recruiter: boolean; key: string; target: string } | null>(null)
  const recruiter = state.mode === 'recruiter'
  const target = targetId(state.target)
  const key = `${state.locale}/${target}`
  const capture = useCallback(() => {
    if (recruiter) positions.current.set(key, { y: window.scrollY, focusId: document.activeElement?.id || null })
  }, [key, recruiter])

  useEffect(() => {
    if (!recruiter) return
    const onScroll = () => capture()
    document.addEventListener('focusin', onScroll)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      document.removeEventListener('focusin', onScroll)
      window.removeEventListener('scroll', onScroll)
    }
  }, [capture, recruiter])

  useLayoutEffect(() => {
    const before = previous.current
    previous.current = { recruiter, key, target }
    if (!recruiter) return
    // A mode round trip restores the same document. A locale change keeps its reading position.
    const saved = !before?.recruiter ? positions.current.get(key)
      : before.target === target ? positions.current.get(before.key) : undefined
    const frame = requestAnimationFrame(() => {
      if (saved) {
        window.scrollTo({ top: saved.y, behavior: 'instant' })
        const focus = (saved.focusId && document.getElementById(saved.focusId)) || document.getElementById(target)
        focus?.focus({ preventScroll: true })
      } else readTarget(target)
      capture()
    })
    return () => cancelAnimationFrame(frame)
  }, [capture, key, recruiter, target])

  const setMode = useCallback((mode: ViewMode) => {
    capture()
    actions.setMode(mode)
  }, [actions, capture])
  const navigate = useCallback((next: NavigationTarget) => {
    capture()
    actions.navigate(next)
    // Same-target navigation is still an explicit request to return to its heading.
    if (recruiter && targetId(next) === target) requestAnimationFrame(() => readTarget(targetId(next)))
  }, [actions, capture, recruiter, target])
  return { setMode, navigate }
}
