import type { ExperienceState, Locale, NavigationTarget, PortfolioContent, ViewMode } from '../contracts/index.ts'

export type NavigationSelection = Pick<ExperienceState, 'locale' | 'mode' | 'target'>
export type SavedPreferences = Readonly<{ locale?: Locale; mode?: ViewMode }>
export const defaultTarget: NavigationTarget = { zoneId: 'garage', projectId: null }
export const isLocale = (value: unknown): value is Locale => value === 'pt' || value === 'en'
export const isViewMode = (value: unknown): value is ViewMode => value === 'immersive' || value === 'recruiter'
export const sameTarget = (a: NavigationTarget, b: NavigationTarget) => a.zoneId === b.zoneId && a.projectId === b.projectId

export function normalizeTarget(target: NavigationTarget, content: PortfolioContent): NavigationTarget {
  if (!content.zones.some(zone => zone.id === target.zoneId)) return defaultTarget
  if (target.projectId !== null) {
    const project = content.projects.find(project => project.id === target.projectId)
    if (!project?.relatedZones.includes(target.zoneId)) return defaultTarget
  }
  return { zoneId: target.zoneId, projectId: target.projectId }
}

export function resolveLocation(url: URL, content: PortfolioContent, saved: SavedPreferences = {}): NavigationSelection {
  const locale = url.searchParams.get('lang')
  const mode = url.searchParams.get('mode')
  let target = defaultTarget
  try {
    const segments = url.hash.slice(1).split('/').map(decodeURIComponent)
    const zone = content.zones.find(zone => zone.id === segments[0])
    if (zone && segments.length <= 2 && (segments.length === 1 || segments[1])) {
      target = normalizeTarget({ zoneId: zone.id, projectId: segments[1] ?? null }, content)
    }
  } catch { /* Hash malformado mantém Garage, sem bloquear a aplicação. */ }
  return {
    locale: isLocale(locale) ? locale : isLocale(saved.locale) ? saved.locale : 'pt',
    mode: isViewMode(mode) ? mode : isViewMode(saved.mode) ? saved.mode : 'immersive',
    target,
  }
}

export function buildLocation(url: URL, selection: NavigationSelection): URL {
  const next = new URL(url)
  next.searchParams.set('lang', selection.locale)
  next.searchParams.set('mode', selection.mode)
  next.hash = selection.target.projectId === null
    ? selection.target.zoneId
    : `${selection.target.zoneId}/${encodeURIComponent(selection.target.projectId)}`
  return next
}
