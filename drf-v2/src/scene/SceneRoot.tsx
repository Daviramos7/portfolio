import { useEffect, useImperativeHandle, useRef } from 'react'
import type { Ref } from 'react'
import type { SceneHandle, SceneProps } from '../contracts/index.ts'
import { createGarageRenderer } from './garageRenderer.ts'
import type { GarageRenderer } from './garageRenderer.ts'
import './scene.css'
import { personalDetailDescriptions } from './garage/personalDetails.ts'

export function SceneRoot({ state, contentIndex, onEvent, ref }: SceneProps & { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GarageRenderer | null>(null)
  useImperativeHandle(ref, () => ({
    requestAudioFromGesture: () => engineRef.current?.requestAudioFromGesture() ?? Promise.resolve('unavailable'),
    muteAudio: () => engineRef.current?.muteAudio(),
    setAudioVolume: volume => engineRef.current?.setAudioVolume?.(volume),
  }), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || state.mode !== 'immersive') return
    const engine = createGarageRenderer(canvas, onEvent)
    engineRef.current = engine
    return () => {
      engineRef.current = null
      engine.dispose()
    }
  }, [onEvent, state.mode])

  useEffect(() => { engineRef.current?.update(state, contentIndex) }, [state, contentIndex, onEvent])

  // Keyboard/touch navigation stays in ordinary HTML, independently of WebGL.
  const zones = contentIndex.filter(entry => entry.projectId === null)
  const unavailable = state.renderStatus === 'unavailable' || state.renderStatus === 'error'
  if (state.mode !== 'immersive') return null
  return (
    <div className="drf-scene" data-scene-root data-scene-status={state.renderStatus}
      data-scene-zone={state.target.zoneId} data-panel-open={state.panelOpen} hidden={state.mode !== 'immersive'}>
      <div className="drf-scene__viewport" hidden={unavailable}>
        <canvas ref={canvasRef} className="drf-scene__canvas" aria-hidden="true" />
      </div>
      <nav className="drf-scene__zones" aria-label={state.locale === 'pt' ? 'Zonas da garagem' : 'Garage zones'}>
        {zones.map((entry, index) => (
          <button key={entry.zoneId} type="button" data-scene-hotspot={entry.zoneId}
            aria-label={entry.label[state.locale]}
            aria-describedby={'drf-discovery-'+entry.zoneId}
            aria-current={state.target.zoneId === entry.zoneId ? 'location' : undefined}
            onClick={() => onEvent({ type: 'SELECT_TARGET', target: { zoneId: entry.zoneId, projectId: null } })}>
            <span className="drf-scene__zone-number" aria-hidden="true">0{index + 1}</span>
            <span className="drf-scene__hotspot-label" aria-hidden="true">
              <strong>{entry.label[state.locale]}</strong>
              <span className="drf-scene__discovery-hint">{personalDetailDescriptions[entry.zoneId][state.locale]}</span>
            </span>
          </button>
        ))}
      </nav>
      <div className="sr-only">{zones.map(entry=><p key={entry.zoneId} id={'drf-discovery-'+entry.zoneId}>{personalDetailDescriptions[entry.zoneId][state.locale]}</p>)}</div>
    </div>
  )
}
