import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import type { PortfolioContent, SceneEvent } from '../contracts/index.ts'
import { createBrowserEnvironment } from './browserEnvironment.ts'
import { createExperienceController } from './experience.ts'
import { buildSceneContentIndex } from './sceneIndex.ts'

export function useExperience(content: PortfolioContent) {
  const controller = useMemo(() => createExperienceController(content, createBrowserEnvironment()), [content])
  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState)
  const sceneAttempt = controller.getSceneAttempt()
  const onSceneEvent = useCallback((event: SceneEvent) => controller.onSceneEvent(event, sceneAttempt), [controller, sceneAttempt])
  const contentIndex = useMemo(() => buildSceneContentIndex(content), [content])
  useEffect(() => controller.start(), [controller])
  return { state, actions: controller.actions, contentIndex, onSceneEvent, sceneAttempt, attachScene: controller.attachScene }
}
