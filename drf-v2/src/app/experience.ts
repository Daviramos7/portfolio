import type { ExperienceState, PortfolioContent, SceneEvent, SceneHandle, UIActions } from '../contracts/index.ts'
import type { ExperienceEnvironment } from './browserEnvironment.ts'
import { isQualityLevel } from './browserEnvironment.ts'
import { qualityProfile } from './qualityLevel.ts'
import { buildLocation, isLocale, isViewMode, normalizeTarget, resolveLocation, sameTarget } from './navigation.ts'
import type { NavigationSelection } from './navigation.ts'

export function createExperienceController(content: PortfolioContent, environment: ExperienceEnvironment) {
  const initialQuality = environment.readQualityLevel?.() ?? 'auto'
  let state: ExperienceState = {
    ...resolveLocation(environment.readUrl(), content, environment.readPreferences()),
    navigationSeq: 0,
    renderStatus: 'idle',
    audio: 'off',
    audioVolume: 0.25,
    reducedMotion: environment.reducedMotion(),
    systemReducedMotion: environment.reducedMotion(),
    motionPreference: 'system',
    ambientEnabled: true,
    panelOpen: false,
    documentVisible: environment.documentVisible(),
    qualityLevel: initialQuality,
    quality: qualityProfile(initialQuality, environment.quality()),
    qualityReduced: false,
  }
  let sceneHandle: SceneHandle | null = null
  let sceneAttempt = 0
  let audioRequest = 0
  let disconnect: (() => void) | null = null
  const listeners = new Set<() => void>()

  function update(patch: Partial<ExperienceState>) {
    if (!(Object.keys(patch) as (keyof ExperienceState)[]).some(key => patch[key] !== state[key])) return
    state = { ...state, ...patch }
    for (const listener of listeners) listener()
  }
  function mute() {
    audioRequest++
    sceneHandle?.muteAudio()
  }
  function syncLocation(method: 'push' | 'replace') {
    environment.writeUrl(buildLocation(environment.readUrl(), state), method)
    environment.savePreferences({ locale: state.locale, mode: state.mode })
    environment.setDocumentLanguage(state.locale)
  }
  function select(selection: NavigationSelection, history: 'push' | 'replace') {
    const target = normalizeTarget(selection.target, content)
    const targetChanged = !sameTarget(state.target, target)
    const modeChanged = state.mode !== selection.mode
    if (!targetChanged && !modeChanged && state.locale === selection.locale) return
    if (modeChanged) {
      mute()
      sceneAttempt++
    }
    update({
      locale: selection.locale,
      mode: selection.mode,
      target: targetChanged ? target : state.target,
      navigationSeq: state.navigationSeq + (targetChanged || modeChanged ? 1 : 0),
      ...(targetChanged || modeChanged ? { panelOpen: false } : {}),
      ...(modeChanged ? { audio: 'off', renderStatus: 'idle' } : {}),
    })
    syncLocation(history)
  }

  const actions: UIActions = {
    setMotionPreference: preference => {
      if (!['system', 'cinematic', 'reduced'].includes(preference)) return
      update({ motionPreference: preference, reducedMotion: preference === 'system' ? state.systemReducedMotion : preference === 'reduced' })
    },
    setQualityLevel: level => {
      if (!isQualityLevel(level)) return
      environment.saveQualityLevel?.(level)
      update({ qualityLevel: level, quality: qualityProfile(level, environment.quality()), qualityReduced: false })
    },
    navigate: target => select({ ...state, target }, 'push'),
    setLocale: locale => { if (isLocale(locale)) select({ ...state, locale }, 'push') },
    setMode: mode => { if (isViewMode(mode)) select({ ...state, mode }, 'push') },
    setAudioEnabled: async enabled => {
      mute()
      const request = audioRequest
      if (!enabled || state.mode !== 'immersive') { update({ audio: 'off' }); return }
      if (!sceneHandle || state.renderStatus !== 'ready') { update({ audio: 'unavailable' }); return }
      const handle = sceneHandle
      update({ audio: 'requested' })
      try {
        // Chamado antes do primeiro await: preserva o gesto de desbloqueio do navegador.
        const result = await handle.requestAudioFromGesture()
        if (request === audioRequest) update({ audio: result })
        else if (handle !== sceneHandle || state.audio === 'off' || state.audio === 'unavailable') handle.muteAudio()
      } catch {
        if (request === audioRequest) { mute(); update({ audio: 'unavailable' }) }
      }
    },
    setAmbientEnabled: ambientEnabled => update({ ambientEnabled }),
    setAudioVolume: volume => {
      if (!Number.isFinite(volume)) return
      const audioVolume = Math.min(1, Math.max(0, volume))
      sceneHandle?.setAudioVolume?.(audioVolume)
      update({ audioVolume })
    },
    setPanelOpen: panelOpen => update({ panelOpen }),
    retryScene: () => {
      if (state.mode !== 'immersive') return
      mute()
      sceneAttempt++
      update({ renderStatus: 'loading', audio: 'off', navigationSeq: state.navigationSeq + 1 })
    },
  }

  return {
    actions,
    getState: () => state,
    getSceneAttempt: () => sceneAttempt,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    attachScene: (handle: SceneHandle | null) => {
      if (sceneHandle === handle) return
      mute()
      sceneHandle = handle
      sceneHandle?.setAudioVolume?.(state.audioVolume)
      update({ audio: 'off' })
    },
    onSceneEvent: (event: SceneEvent, attempt: number) => {
      if (attempt !== sceneAttempt || state.mode !== 'immersive') return
      switch (event.type) {
        case 'SELECT_TARGET': actions.navigate(event.target); break
        case 'SCENE_STATUS':
          if (event.status !== 'ready') mute()
          update({ renderStatus: event.status, ...(event.status !== 'ready' ? { audio: 'off' } : {}) })
          break
        case 'CAMERA_SETTLED':
          // Cena possui o assentamento da câmera; conclusões antigas nunca renavegam.
          if (event.navigationSeq !== state.navigationSeq) return
          break
        case 'AUDIO_STATUS':
          if (event.status === 'on' || event.status === 'requested') {
            if (state.audio !== 'requested' && state.audio !== 'on') return
          } else mute()
          update({ audio: event.status })
          break
        case 'QUALITY_REQUEST': update({ quality: event.quality }); break
        case 'QUALITY_REDUCED': update({ qualityReduced: event.reduced }); break
      }
    },
    start: () => {
      disconnect?.()
      const systemReducedMotion = environment.reducedMotion()
      update({ systemReducedMotion, reducedMotion: state.motionPreference === 'system' ? systemReducedMotion : state.motionPreference === 'reduced', documentVisible: environment.documentVisible() })
      syncLocation('replace')
      disconnect = environment.watch({
        location: () => select(resolveLocation(environment.readUrl(), content, environment.readPreferences()), 'replace'),
        reducedMotion: systemReducedMotion => update({ systemReducedMotion, reducedMotion: state.motionPreference === 'system' ? systemReducedMotion : state.motionPreference === 'reduced' }),
        visibility: documentVisible => update({ documentVisible }),
      })
      return () => {
        disconnect?.()
        disconnect = null
        mute()
        update({ audio: 'off' })
      }
    },
  }
}
