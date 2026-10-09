import type { Locale, Quality } from '../contracts/index.ts'
import { isLocale, isViewMode } from './navigation.ts'
import type { SavedPreferences } from './navigation.ts'

const preferencesKey = 'drf-engineering.preferences.v1'
export type EnvironmentEvents = Readonly<{
  location: () => void
  reducedMotion: (enabled: boolean) => void
  visibility: (visible: boolean) => void
}>
export type ExperienceEnvironment = Readonly<{
  readUrl: () => URL
  writeUrl: (url: URL, method: 'push' | 'replace') => void
  readPreferences: () => SavedPreferences
  savePreferences: (preferences: SavedPreferences) => void
  reducedMotion: () => boolean
  documentVisible: () => boolean
  quality: () => Quality
  setDocumentLanguage: (locale: Locale) => void
  watch: (events: EnvironmentEvents) => () => void
}>

export function createBrowserEnvironment(browser: Window | undefined = typeof window === 'undefined' ? undefined : window): ExperienceEnvironment {
  const motion = browser?.matchMedia?.('(prefers-reduced-motion: reduce)')
  return {
    readUrl: () => new URL(browser?.location.href ?? 'https://drf.invalid/'),
    writeUrl: (url, method) => {
      if (browser) browser.history[method === 'push' ? 'pushState' : 'replaceState'](browser.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    },
    readPreferences: () => {
      try {
        const parsed = JSON.parse(browser?.localStorage.getItem(preferencesKey) ?? '{}')
        return { locale: isLocale(parsed?.locale) ? parsed.locale : undefined, mode: isViewMode(parsed?.mode) ? parsed.mode : undefined }
      } catch { return {} }
    },
    savePreferences: preferences => {
      try { browser?.localStorage.setItem(preferencesKey, JSON.stringify(preferences)) } catch { /* Armazenamento é opcional. */ }
    },
    reducedMotion: () => motion?.matches ?? false,
    documentVisible: () => browser?.document.visibilityState !== 'hidden',
    quality: () => browser && browser.innerWidth <= 820 ? 'low' : 'balanced',
    setDocumentLanguage: locale => { if (browser) browser.document.documentElement.lang = locale },
    watch: events => {
      if (!browser) return () => {}
      const onMotion = (event: MediaQueryListEvent) => events.reducedMotion(event.matches)
      const onVisibility = () => events.visibility(browser.document.visibilityState !== 'hidden')
      browser.addEventListener('popstate', events.location)
      browser.addEventListener('hashchange', events.location)
      motion?.addEventListener('change', onMotion)
      browser.document.addEventListener('visibilitychange', onVisibility)
      return () => {
        browser.removeEventListener('popstate', events.location)
        browser.removeEventListener('hashchange', events.location)
        motion?.removeEventListener('change', onMotion)
        browser.document.removeEventListener('visibilitychange', onVisibility)
      }
    },
  }
}
