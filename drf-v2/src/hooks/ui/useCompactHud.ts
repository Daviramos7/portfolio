import { useSyncExternalStore } from 'react'

// M16 fila 15: HUD enxuto só em telas de celular (≤ 480 px). Desktop e tablet seguem o layout de antes.
const query = () => window.matchMedia('(max-width: 480px)')
const subscribe = (notify: () => void) => {
  const media = query()
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

export function useCompactHud() {
  return useSyncExternalStore(subscribe, () => query().matches, () => false)
}
