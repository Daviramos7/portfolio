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

function SceneLoading({ onEvent }: Pick<SceneProps, 'onEvent'>) {
  useEffect(() => { onEvent({ type: 'SCENE_STATUS', status: 'loading' }) }, [onEvent])
  return null
}

function App() {
  const { state, actions, contentIndex, onSceneEvent, sceneAttempt, attachScene } = useExperience(portfolioContent)
  return (
    <main className="drf-app" data-phase="integrated">
      <PortfolioShell content={portfolioContent} state={state} actions={actions}>
        {state.mode === 'immersive' && (
          <section className="drf-visual" aria-label={state.locale === 'pt' ? 'Experiência visual' : 'Visual experience'}>
            <SceneBoundary key={sceneAttempt} fallback={null} onError={() => onSceneEvent({ type: 'SCENE_STATUS', status: 'error' })}>
              <Suspense fallback={<SceneLoading onEvent={onSceneEvent} />}>
                <SceneRoot ref={attachScene} state={state} contentIndex={contentIndex} onEvent={onSceneEvent} />
              </Suspense>
            </SceneBoundary>
          </section>
        )}
      </PortfolioShell>
    </main>
  )
}

export default App
