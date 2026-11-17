import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createDprGovernor, levelPolicy } from '../src/scene/dprGovernor.ts'
import { qualityProfile } from '../src/app/qualityLevel.ts'
import { createBrowserEnvironment, isQualityLevel } from '../src/app/browserEnvironment.ts'
import { createExperienceController } from '../src/app/experience.ts'
import { portfolioContent } from '../src/content/portfolio.ts'
import { reportsReduction, screenScale, sunShadowMapSize, textAnisotropyFor } from '../src/scene/qualityDetail.ts'

const feed = (g, ms, durationMs) => { let changed = 0; for (let t = 0; t < durationMs; t += ms) if (g.sample(ms)) changed++; return changed }
const target = () => ({ addEventListener: () => {}, removeEventListener: () => {} })
function browser({ width = 390, storage } = {}) {
  return {
    ...target(), innerWidth: width, location: { href: 'https://drf.example/' },
    history: { state: null, replaceState: () => {}, pushState: () => {} },
    matchMedia: () => ({ ...target(), matches: false }),
    document: { ...target(), visibilityState: 'visible', documentElement: { lang: '' } },
    get localStorage() { if (!storage) throw new Error('storage denied'); return storage },
  }
}
function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial))
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, String(value)) } }
}

test('Leve renders at DPR 1 and never adapts; Auto keeps the M16 policy', () => {
  const light = createDprGovernor(() => 3, 'low', 'light')
  assert.equal(light.dpr, 1)
  assert.equal(feed(light, 60, 5000), 0); assert.equal(light.state, 'full')
  assert.equal(createDprGovernor(() => 3, 'low', 'auto').dpr, 1.5)
  assert.equal(createDprGovernor(() => 3, 'balanced', 'auto').dpr, 1.5)
})

test('Alta caps at 2 and Máxima at the device ratio up to 3', () => {
  assert.equal(createDprGovernor(() => 3, 'low', 'high').dpr, 2)
  assert.equal(createDprGovernor(() => 1.25, 'low', 'high').dpr, 1.25, 'never above the device')
  assert.equal(createDprGovernor(() => 2.75, 'balanced', 'max').dpr, 2.75)
  assert.equal(createDprGovernor(() => 4, 'balanced', 'max').dpr, 3)
  assert.equal(levelPolicy.max.cap, 3)
})

test('Alta/Máxima keep the governor as a safety net, including on the balanced profile', () => {
  for (const level of ['high', 'max']) {
    const g = createDprGovernor(() => 3, 'balanced', level)
    feed(g, 16.7, 3000)
    assert.equal(g.state, 'full', `${level}: fast frames hold the ceiling`)
    assert.equal(feed(g, 40, 4000), 1, `${level}: sustained slow frames lower DPR once`)
    assert.equal(g.dpr, 1.5); assert.equal(g.state, 'degraded')
    feed(g, 16.7, 12000)
    assert.equal(g.dpr, levelPolicy[level].cap === 3 ? 3 : 2, `${level}: a long fast stretch restores it`)
  }
})

test('a new level starts over at its full ceiling', () => {
  const g = createDprGovernor(() => 3, 'balanced', 'max')
  feed(g, 40, 4000); feed(g, 16.7, 12000); feed(g, 40, 4000)
  assert.equal(g.state, 'latched'); assert.equal(g.dpr, 1.5)
  g.setLevel('high'); assert.equal(g.state, 'full'); assert.equal(g.dpr, 2)
  g.setLevel('light'); assert.equal(g.dpr, 1)
})

test('profile per level: Leve is light, Máxima full, Auto/Alta follow the viewport', () => {
  assert.equal(qualityProfile('light', 'balanced'), 'low')
  assert.equal(qualityProfile('max', 'low'), 'balanced')
  assert.equal(qualityProfile('high', 'low'), 'low')
  assert.equal(qualityProfile('auto', 'balanced'), 'balanced')
})

test('level detail: screen texels, text anisotropy, shadow map and reduction notice', () => {
  assert.deepEqual(screenScale, { auto: 1, light: 1, high: 1.5, max: 2 })
  assert.equal(textAnisotropyFor('light', 16), 1)
  assert.equal(textAnisotropyFor('auto', 16), 8)
  assert.equal(textAnisotropyFor('high', 4), 4)
  assert.equal(textAnisotropyFor('max', 16), 16)
  assert.equal(sunShadowMapSize.max, 2048)
  assert.deepEqual(['auto', 'light', 'high', 'max'].filter(reportsReduction), ['high', 'max'])
})

test('choice is saved in the browser and restored on the next visit', () => {
  const storage = memoryStorage()
  const first = createExperienceController(portfolioContent, createBrowserEnvironment(browser({ storage })))
  assert.equal(first.getState().qualityLevel, 'auto')
  first.actions.setQualityLevel('max')
  assert.equal(first.getState().qualityLevel, 'max'); assert.equal(first.getState().quality, 'balanced')
  assert.equal(storage.data.get('drf-engineering.quality.v1'), 'max')
  const second = createExperienceController(portfolioContent, createBrowserEnvironment(browser({ storage })))
  assert.equal(second.getState().qualityLevel, 'max')
  first.actions.setQualityLevel('turbo')
  assert.equal(first.getState().qualityLevel, 'max', 'unknown levels are ignored')
})

test('without storage (or with junk in it) the level falls back to Auto', () => {
  const blocked = createBrowserEnvironment(browser())
  assert.equal(blocked.readQualityLevel(), 'auto')
  assert.doesNotThrow(() => blocked.saveQualityLevel('high'))
  const controller = createExperienceController(portfolioContent, blocked)
  controller.actions.setQualityLevel('light')
  assert.equal(controller.getState().qualityLevel, 'light', 'still applies for the session')
  assert.equal(createBrowserEnvironment(browser({ storage: memoryStorage({ 'drf-engineering.quality.v1': 'ultra' }) })).readQualityLevel(), 'auto')
  assert.equal(isQualityLevel('high'), true); assert.equal(isQualityLevel(null), false)
})

test('the scene reports a reduction and a new choice clears it; reduced motion is untouched', () => {
  const controller = createExperienceController(portfolioContent, createBrowserEnvironment(browser({ storage: memoryStorage() })))
  const reduced = controller.getState().reducedMotion
  controller.actions.setQualityLevel('high')
  controller.onSceneEvent({ type: 'QUALITY_REDUCED', reduced: true }, controller.getSceneAttempt())
  assert.equal(controller.getState().qualityReduced, true)
  controller.actions.setQualityLevel('max')
  assert.equal(controller.getState().qualityReduced, false)
  assert.equal(controller.getState().reducedMotion, reduced)
})

test('selector is in the menu, PT/EN, with the battery warning on Máxima', () => {
  const ui = readFileSync(new URL('../src/features/EnvironmentControls.tsx', import.meta.url), 'utf8')
  const labels = readFileSync(new URL('../src/features/uiLabels.ts', import.meta.url), 'utf8')
  assert.match(ui, /name="drf-quality"/)
  assert.match(ui, /drf-quality-inline/, 'compact HUD menu has it too')
  for (const text of ['Leve', 'Alta', 'Máxima', 'Light', 'High', 'Maximum', 'bateria', 'battery']) assert.ok(labels.includes(text), text)
})
