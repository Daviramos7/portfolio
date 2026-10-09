import assert from 'node:assert/strict'
import test from 'node:test'
import { portfolioContent } from '../src/content/portfolio.ts'
import { validatePortfolioContent } from '../src/content/validate.ts'
import { buildLocation, resolveLocation } from '../src/app/navigation.ts'
import { createBrowserEnvironment } from '../src/app/browserEnvironment.ts'
import { createExperienceController } from '../src/app/experience.ts'
import { buildSceneContentIndex } from '../src/app/sceneIndex.ts'

function fixture(initial = 'https://drf.example/', saved = {}) {
  let url = new URL(initial)
  let events
  let connections = 0
  const writes = []
  const languages = []
  const environment = {
    readUrl: () => new URL(url),
    writeUrl: (next, method) => { url = new URL(next); writes.push(method) },
    readPreferences: () => saved,
    savePreferences: next => { saved = next },
    reducedMotion: () => false,
    documentVisible: () => true,
    quality: () => 'low',
    setDocumentLanguage: locale => languages.push(locale),
    watch: next => { events = next; connections++; return () => { connections-- } },
  }
  return {
    controller: createExperienceController(portfolioContent, environment),
    writes, languages,
    getConnections: () => connections,
    restore: next => { url = new URL(next); events.location() },
    motion: enabled => events.reducedMotion(enabled),
    visibility: visible => events.visibility(visible),
  }
}

test('catalogue preserves nine bilingual records and only sourced documentary metrics', () => {
  assert.doesNotThrow(() => validatePortfolioContent(portfolioContent))
  assert.equal(portfolioContent.projects.length, 9)
  assert.deepEqual(portfolioContent.metrics.map(metric => [metric.value, metric.state]), [[127119, 'documented'], [7803361234.91, 'documented']])
  const horta = portfolioContent.projects.find(project => project.id === 'horta-inteligente')
  assert.equal(horta.contentStatus, 'pending-evidence')
  assert.equal(horta.productStatus, null)
  assert.equal(horta.repositoryUrl, null)
  assert.deepEqual(horta.metricIds, [])
  assert.equal(portfolioContent.experiences[0].start, null)
  assert.equal(portfolioContent.experiences[0].isCurrent, null)
  assert.equal(portfolioContent.profile.cvUrl, null)
})

test('content boundary rejects broken references, metric ownership and non-finite values', () => {
  const broken = structuredClone(portfolioContent)
  broken.projects[0].evidenceIds = ['unknown']
  assert.throws(() => validatePortfolioContent(broken), /references/)
  const wrongOwner = structuredClone(portfolioContent)
  wrongOwner.projects[0].metricIds = [wrongOwner.metrics[0].id]
  assert.throws(() => validatePortfolioContent(wrongOwner), /ownership/)
  const invalidNumber = structuredClone(portfolioContent)
  invalidNumber.metrics[0].value = Infinity
  assert.throws(() => validatePortfolioContent(invalidNumber), /value/)
  const absentAsZero = structuredClone(portfolioContent)
  absentAsZero.metrics[0] = { ...absentAsZero.metrics[0], state: 'missing', value: 0, context: null }
  assert.throws(() => validatePortfolioContent(absentAsZero), /missing value/)
  const missingTranslation = structuredClone(portfolioContent)
  missingTranslation.projects[0].title.en = ''
  assert.throws(() => validatePortfolioContent(missingTranslation), /PT\/EN/)
})

test('URL preferences override storage; malformed and unrelated targets fall back safely', () => {
  const selection = resolveLocation(new URL('https://drf.example/?lang=en&mode=immersive#driver-profile/atleta-hibrido'), portfolioContent, { locale: 'pt', mode: 'recruiter' })
  assert.deepEqual(selection, { locale: 'en', mode: 'immersive', target: { zoneId: 'driver-profile', projectId: 'atleta-hibrido' } })
  for (const hash of ['#unknown', '#garage/unknown', '#garage/%E0%A4', '#telemetry/atleta-hibrido', '#garage/task-manager/extra']) {
    assert.deepEqual(resolveLocation(new URL(`https://drf.example/${hash}`), portfolioContent).target, { zoneId: 'garage', projectId: null })
  }
  assert.equal(resolveLocation(new URL('https://drf.example/?lang=invalid'), portfolioContent, { locale: 'en' }).locale, 'en')
})

test('URL serialization preserves unrelated query parameters and project selection', () => {
  const selected = { locale: 'en', mode: 'recruiter', target: { zoneId: 'garage', projectId: 'atleta-hibrido' } }
  const result = buildLocation(new URL('https://drf.example/?source=profile'), selected)
  assert.equal(result.searchParams.get('source'), 'profile')
  assert.deepEqual(resolveLocation(result, portfolioContent), selected)
})

test('navigation is immediate, latest wins and mode/locale retain the target', () => {
  const { controller, writes, languages } = fixture()
  const stop = controller.start()
  controller.actions.navigate({ zoneId: 'garage', projectId: 'task-manager' })
  const previousSeq = controller.getState().navigationSeq
  controller.actions.navigate({ zoneId: 'driver-profile', projectId: 'atleta-hibrido' })
  const latest = controller.getState()
  controller.onSceneEvent({ type: 'CAMERA_SETTLED', navigationSeq: previousSeq }, 0)
  assert.equal(controller.getState(), latest)
  controller.actions.setMode('recruiter')
  controller.actions.setLocale('en')
  assert.deepEqual(controller.getState().target, latest.target)
  assert.equal(controller.getState().audio, 'off')
  assert.equal(languages.at(-1), 'en')
  assert.deepEqual(writes, ['replace', 'push', 'push', 'push', 'push'])
  stop()
})

test('back/forward and hash subscriptions restore selection without adding history entries', () => {
  const { controller, restore, writes } = fixture()
  const stop = controller.start()
  controller.actions.navigate({ zoneId: 'garage', projectId: 'task-manager' })
  restore('https://drf.example/?lang=en&mode=recruiter#pit-wall')
  assert.equal(controller.getState().target.zoneId, 'pit-wall')
  assert.equal(controller.getState().locale, 'en')
  assert.equal(controller.getState().mode, 'recruiter')
  const snapshot = controller.getState()
  restore('https://drf.example/?lang=en&mode=recruiter#pit-wall')
  assert.equal(controller.getState(), snapshot)
  assert.deepEqual(writes, ['replace', 'push', 'replace'])
  stop()
})

test('retry and mode changes reject callbacks from obsolete scene instances', () => {
  const { controller } = fixture()
  controller.onSceneEvent({ type: 'SCENE_STATUS', status: 'error' }, 0)
  controller.actions.retryScene()
  controller.onSceneEvent({ type: 'SCENE_STATUS', status: 'ready' }, 0)
  assert.equal(controller.getState().renderStatus, 'loading')
  controller.onSceneEvent({ type: 'SCENE_STATUS', status: 'ready' }, 1)
  assert.equal(controller.getState().renderStatus, 'ready')
  controller.actions.setMode('recruiter')
  controller.onSceneEvent({ type: 'SELECT_TARGET', target: { zoneId: 'telemetry', projectId: null } }, 1)
  assert.equal(controller.getState().target.zoneId, 'garage')
})

test('audio needs explicit consent and calls the handle synchronously in the user gesture', async () => {
  const { controller } = fixture()
  let calls = 0
  controller.attachScene({ requestAudioFromGesture: async () => { calls++; return 'on' }, muteAudio: () => {} })
  controller.onSceneEvent({ type: 'SCENE_STATUS', status: 'ready' }, 0)
  controller.onSceneEvent({ type: 'AUDIO_STATUS', status: 'requested' }, 0)
  controller.onSceneEvent({ type: 'AUDIO_STATUS', status: 'on' }, 0)
  assert.equal(controller.getState().audio, 'off')
  const request = controller.actions.setAudioEnabled(true)
  assert.equal(calls, 1)
  assert.equal(controller.getState().audio, 'requested')
  await request
  assert.equal(controller.getState().audio, 'on')
  controller.actions.setMode('recruiter')
  assert.equal(controller.getState().audio, 'off')
})

test('muting while an unlock is pending cannot re-enable audio on completion', async () => {
  const { controller } = fixture()
  let resolve
  let mutes = 0
  controller.attachScene({ requestAudioFromGesture: () => new Promise(done => { resolve = done }), muteAudio: () => { mutes++ } })
  controller.onSceneEvent({ type: 'SCENE_STATUS', status: 'ready' }, 0)
  const pending = controller.actions.setAudioEnabled(true)
  await controller.actions.setAudioEnabled(false)
  const muted = mutes
  resolve('on')
  await pending
  assert.equal(controller.getState().audio, 'off')
  assert.ok(mutes > muted)
})

test('audio failures remain contained and motion/visibility updates do not renavigate', async () => {
  const { controller, motion, visibility } = fixture()
  const stop = controller.start()
  controller.attachScene({ requestAudioFromGesture: async () => { throw new Error('blocked') }, muteAudio: () => {} })
  controller.onSceneEvent({ type: 'SCENE_STATUS', status: 'ready' }, 0)
  await controller.actions.setAudioEnabled(true)
  assert.equal(controller.getState().audio, 'unavailable')
  const seq = controller.getState().navigationSeq
  motion(true)
  visibility(false)
  assert.equal(controller.getState().reducedMotion, true)
  assert.equal(controller.getState().documentVisible, false)
  assert.equal(controller.getState().navigationSeq, seq)
  stop()
})

test('browser adapter tolerates blocked storage and disconnects all listeners', () => {
  const registered = new Set()
  const target = name => ({ addEventListener: type => registered.add(`${name}:${type}`), removeEventListener: type => registered.delete(`${name}:${type}`) })
  const browser = {
    ...target('window'), innerWidth: 390, location: { href: 'https://drf.example/?lang=en#garage' },
    history: { state: null, replaceState: () => {}, pushState: () => {} },
    matchMedia: () => ({ ...target('motion'), matches: true }),
    document: { ...target('document'), visibilityState: 'visible', documentElement: { lang: '' } },
    get localStorage() { throw new Error('storage denied') },
  }
  const environment = createBrowserEnvironment(browser)
  assert.deepEqual(environment.readPreferences(), {})
  assert.doesNotThrow(() => environment.savePreferences({ locale: 'en' }))
  const controller = createExperienceController(portfolioContent, environment)
  const stop = controller.start()
  assert.equal(controller.getState().locale, 'en')
  assert.equal(controller.getState().quality, 'low')
  assert.equal(controller.getState().reducedMotion, true)
  assert.equal(registered.size, 4)
  stop()
  assert.equal(registered.size, 0)
})

test('connection cleanup is repeatable for StrictMode', () => {
  const { controller, getConnections } = fixture()
  controller.start()()
  const stop = controller.start()
  assert.equal(getConnections(), 1)
  stop()
  assert.equal(getConnections(), 0)
})

test('scene projection links Atleta to Driver Profile without exposing business data', () => {
  const index = buildSceneContentIndex(portfolioContent)
  assert.ok(index.some(entry => entry.projectId === 'atleta-hibrido' && entry.zoneId === 'driver-profile'))
  assert.equal(index.filter(entry => entry.projectId === null).length, 5)
  assert.ok(index.every(entry => !('metrics' in entry) && !('summary' in entry) && !('evidence' in entry)))
})
