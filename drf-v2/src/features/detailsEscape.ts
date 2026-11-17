import type { KeyboardEvent } from 'react'

// Esc fecha a gaveta (<details>) e devolve o foco ao <summary>, sem fechar a leitura por baixo.
export function closeDetailsOnEscape(event: KeyboardEvent<HTMLDetailsElement>) {
  if (event.key !== 'Escape' || !event.currentTarget.open) return
  event.preventDefault()
  event.stopPropagation()
  event.currentTarget.open = false
  event.currentTarget.querySelector('summary')?.focus({ preventScroll: true })
}
