import { lazy, Suspense, useEffect } from 'react'
import type { SceneProps } from './contracts/index.ts'
import { portfolioContent } from './content/portfolio.ts'
import { validatePortfolioContent } from './content/validate.ts'
import { useExperience } from './app/useExperience.ts'
import { SceneBoundary } from './app/SceneBoundary.tsx'
import { PortfolioShell } from './features/PortfolioShell.tsx'
import './App.css'

validatePortfolioContent(portfolioContent)
const SceneRoot = lazy(() => import('./scene/SceneRoot.tsx').then(module => ({ default: module.SceneRoot })))

function SceneLoading({ onEvent, state }: Pick<SceneProps, 'onEvent' | 'state'>) {
  useEffect(() => { onEvent({ type: 'SCENE_STATUS', status: 'loading' }) }, [onEvent])
  return <p role="status">{state.locale === 'pt' ? 'Preparando experiência visual…' : 'Preparing visual experience…'}</p>
}

function App() {
  const { state, actions, contentIndex, onSceneEvent, sceneAttempt, attachScene } = useExperience(portfolioContent)
  const unavailable = state.renderStatus === 'error' || state.renderStatus === 'unavailable'
  const fallback = (
    <div role="status">
      <p>{state.locale === 'pt' ? 'Experiência visual indisponível. A navegação permanece disponível.' : 'Visual experience unavailable. Navigation remains available.'}</p>
      <button className="foundation-retry" type="button" onClick={actions.retryScene}>
        {state.locale === 'pt' ? 'Tentar novamente' : 'Try again'}
      </button>
    </div>
  )
  return (
    <main className="foundation" data-phase="foundation">
      <PortfolioShell content={portfolioContent} state={state} actions={actions} />
      {state.mode === 'immersive' && (
        <section className="foundation-scene" aria-label={state.locale === 'pt' ? 'Experiência visual' : 'Visual experience'}>
          {unavailable && fallback}
          <SceneBoundary key={sceneAttempt} fallback={unavailable ? null : fallback} onError={() => onSceneEvent({ type: 'SCENE_STATUS', status: 'error' })}>
            <Suspense fallback={<SceneLoading state={state} onEvent={onSceneEvent} />}>
              <SceneRoot ref={attachScene} state={state} contentIndex={contentIndex} onEvent={onSceneEvent} />
            </Suspense>
          </SceneBoundary>
        </section>
      )}
    </main>
  )
}

export default App
