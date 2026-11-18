import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowLeft, Minus, Plus, RotateCcw, RotateCw, X } from 'lucide-react'
import type { ExperienceState } from '../contracts/index.ts'
import { uiLabels } from './uiLabels.ts'
import { openShowcase, showcaseEvent, showcaseItem, showcaseItems } from '../scene/showcase/showcaseCatalog.ts'
import type { ShowcaseStatus, createShowcaseRenderer } from '../scene/showcase/showcaseRenderer.ts'

// Fila 25: "inspect item" overlay. One modal dialog with two views: the Coleção list (reachable from the menu even
// when an object is outside the phone framing) and the inspection of one object in its own small renderer.
type View = { mode: 'list' } | { mode: 'item'; id: string; fromList: boolean }
const seenKey = 'drf-showcase-seen'
const readSeen = () => { try { return new Set<string>(JSON.parse(localStorage.getItem(seenKey) ?? '[]')) } catch { return new Set<string>() } }

export function CollectionButton({ state, className }: { state: ExperienceState; className?: string }) {
  const t = uiLabels(state.locale)
  return <button type="button" className={className ?? 'drf-collection-switch'} onClick={() => openShowcase(null)} aria-haspopup="dialog">{t.collection}</button>
}

export function ShowcaseOverlay({ state }: { state: ExperienceState }) {
  const t = uiLabels(state.locale)
  const [view, setView] = useState<View | null>(null)
  const [status, setStatus] = useState<ShowcaseStatus>('loading')
  const [seen, setSeen] = useState(readSeen)
  const dialogRef = useRef<HTMLDivElement>(null), canvasRef = useRef<HTMLCanvasElement>(null)
  const openerRef = useRef<Element | null>(null)
  const viewerRef = useRef<ReturnType<typeof createShowcaseRenderer> | null>(null)

  const inspect = useCallback((id: string, fromList: boolean) => {
    setView({ mode: 'item', id, fromList })
    setSeen(previous => {
      if (previous.has(id)) return previous
      const next = new Set(previous).add(id)
      try { localStorage.setItem(seenKey, JSON.stringify([...next])) } catch { /* private mode: count stays in memory */ }
      return next
    })
  }, [])
  useEffect(() => {
    const open = (event: Event) => {
      const id = (event as CustomEvent<{ id: string | null }>).detail?.id ?? null
      if (!dialogRef.current) openerRef.current = document.activeElement
      if (id && showcaseItem(id)) inspect(id, false); else setView({ mode: 'list' })
    }
    window.addEventListener(showcaseEvent, open)
    return () => window.removeEventListener(showcaseEvent, open)
  }, [inspect])

  const close = useCallback(() => {
    setView(null)
    // Focus returns to what opened the overlay (menu button) or, after a click in the room, to the scene canvas.
    requestAnimationFrame(() => {
      const opener = openerRef.current as HTMLElement | null
      if (opener && opener.isConnected && opener !== document.body && typeof opener.focus === 'function') { opener.focus(); return }
      const canvas = document.querySelector<HTMLCanvasElement>('.drf-scene__canvas')
      if (canvas) { canvas.tabIndex = -1; canvas.focus({ preventScroll: true }) }
    })
  }, [])

  const itemId = view?.mode === 'item' ? view.id : null
  useEffect(() => {
    if (!itemId || !canvasRef.current) return
    const item = showcaseItem(itemId)
    if (!item) return
    // The renderer (and three.js) load on first use, from the same lazy chunk family as the scene.
    const canvas = canvasRef.current
    let viewer: ReturnType<typeof createShowcaseRenderer> | null = null, cancelled = false
    void import('../scene/showcase/showcaseRenderer.ts').then(({ createShowcaseRenderer }) => {
      if (cancelled) return
      // Each object gets a fresh <canvas> (key above): dispose() forces its context lost and a lost canvas cannot host
      // a new renderer. Without WebGL the overlay keeps the caption and says the object is unavailable.
      try { viewer = createShowcaseRenderer(canvas, { reducedMotion: state.reducedMotion, light: state.quality === 'low', onStatus: setStatus }) } catch { setStatus('fallback'); return }
      viewerRef.current = viewer; viewer.show(item)
    }).catch(() => { if (!cancelled) setStatus('fallback') })
    return () => { cancelled = true; viewer?.dispose(); viewerRef.current = null }
  }, [itemId, state.reducedMotion, state.quality])

  useEffect(() => { if (view) dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus() }, [view])

  if (!view) return null
  const item = view.mode === 'item' ? showcaseItem(view.id) : null
  const titleId = 'drf-showcase-title'

  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') { event.stopPropagation(); close(); return }
    if (view?.mode === 'item' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight') && event.target === canvasRef.current) {
      viewerRef.current?.nudge(event.key === 'ArrowLeft' ? -.3 : .3); event.preventDefault(); return
    }
    if (event.key !== 'Tab' || !dialogRef.current) return
    // Focus stays inside the modal.
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button, [tabindex="0"]')].filter(element => !element.hasAttribute('disabled'))
    if (!focusable.length) return
    const first = focusable[0], last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) { last.focus(); event.preventDefault() }
    else if (!event.shiftKey && document.activeElement === last) { first.focus(); event.preventDefault() }
  }

  return <div className="drf-showcase-backdrop" data-showcase-view={view.mode} onClick={event => { if (event.target === event.currentTarget) close() }}>
    <div ref={dialogRef} className="drf-showcase-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={keyDown}>
      <header className="drf-showcase-head">
        {view.mode === 'item' && view.fromList && <button type="button" className="drf-showcase-icon" onClick={() => setView({ mode: 'list' })} aria-label={t.backToCollection} title={t.backToCollection}><ArrowLeft size={18} aria-hidden="true" /></button>}
        <h2 id={titleId}>{item ? item.name[state.locale] : t.collectionTitle}</h2>
        {view.mode === 'list' && <span className="drf-showcase-count">{seen.size} / {showcaseItems.length} {t.seenCount}</span>}
        <button type="button" className="drf-showcase-icon" data-autofocus onClick={close} aria-label={t.closeShowcase} title={t.closeShowcase}><X size={18} aria-hidden="true" /></button>
      </header>
      {view.mode === 'list' ? <>
        <p className="drf-showcase-hint">{t.collectionHint}</p>
        <ul className="drf-collection-grid">
          {showcaseItems.map(entry => <li key={entry.id}>
            <button type="button" data-showcase-item={entry.id} onClick={() => inspect(entry.id, true)}>
              <img src={`${import.meta.env.BASE_URL}collection/${entry.id}.webp`} alt="" width="96" height="96" loading="lazy" decoding="async" />
              <span>{entry.name[state.locale]}</span>
              {seen.has(entry.id) && <small aria-hidden="true">✓</small>}
            </button>
          </li>)}
        </ul>
      </> : item && <>
        <div className="drf-showcase-stage" data-status={status}>
          <canvas key={`${item.id}-${state.quality}-${state.reducedMotion}`} ref={canvasRef} className="drf-showcase-canvas" tabIndex={0} aria-label={`${item.name[state.locale]}. ${t.showcaseHint}`} />
          {status !== 'ready' && <p className="drf-showcase-status" role="status">{status === 'loading' ? t.showcaseLoading : t.showcaseUnavailable}</p>}
        </div>
        <p className="drf-showcase-caption">{item.caption[state.locale]}</p>
        <div className="drf-showcase-tools">
          <span className="drf-showcase-hint">{t.showcaseHint}</span>
          <button type="button" className="drf-showcase-icon" onClick={() => viewerRef.current?.nudge(-.4)} aria-label={t.turnLeft} title={t.turnLeft}><RotateCcw size={16} aria-hidden="true" /></button>
          <button type="button" className="drf-showcase-icon" onClick={() => viewerRef.current?.nudge(.4)} aria-label={t.turnRight} title={t.turnRight}><RotateCw size={16} aria-hidden="true" /></button>
          <button type="button" className="drf-showcase-icon" onClick={() => viewerRef.current?.nudge(0, .8)} aria-label={t.zoomIn} title={t.zoomIn}><Plus size={16} aria-hidden="true" /></button>
          <button type="button" className="drf-showcase-icon" onClick={() => viewerRef.current?.nudge(0, 1.25)} aria-label={t.zoomOut} title={t.zoomOut}><Minus size={16} aria-hidden="true" /></button>
        </div>
      </>}
    </div>
  </div>
}
