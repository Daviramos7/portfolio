import { useEffect, useImperativeHandle } from 'react'
import type { Ref } from 'react'
import type { SceneHandle, SceneProps } from '../contracts/index.ts'

// Ponto reservado ao 3D Developer. Não cria canvas nem anuncia cena pronta.
export function SceneRoot({ onEvent, ref }: SceneProps & { ref?: Ref<SceneHandle> }) {
  useImperativeHandle(ref, () => ({
    requestAudioFromGesture: async () => 'unavailable',
    muteAudio: () => {},
  }), [])
  useEffect(() => { onEvent({ type: 'SCENE_STATUS', status: 'idle' }) }, [onEvent])
  return <div data-scene-placeholder aria-hidden="true" />
}
