import { useRef, useState } from 'react'
import type { ReactNode } from 'react'

type Command = { label: string; icon: ReactNode; run: () => void; disabled?: boolean }

// Original grouped toolbar; native buttons, one Tab stop, directional focus.
export function InstrumentToolbar({ label, commands }: { label: string; commands: Command[] }) {
  const root = useRef<HTMLDivElement>(null)
  const [focusIndex, setFocusIndex] = useState(0)
  const activeIndex = commands[focusIndex]?.disabled ? commands.findIndex(command => !command.disabled) : focusIndex
  return <div ref={root} className="drf-instrument-toolbar" role="toolbar" aria-label={label} onKeyDown={event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const buttons = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length
    buttons[index]?.focus({ preventScroll: true })
  }}>
    {commands.map((command, index) => <button key={command.label} type="button" disabled={command.disabled} tabIndex={index === activeIndex ? 0 : -1} aria-label={command.label} title={command.label} onFocus={() => setFocusIndex(index)} onClick={command.run}>
      {command.icon}
    </button>)}
  </div>
}
