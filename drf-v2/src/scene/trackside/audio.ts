import type { CarPass, ExperienceState } from '../../contracts/index.ts'

export const audioAssets = [
  { id: 'ventilation', src: '/scene/audio/ventilation.mp3', seconds: 16, gain: .022 },
  { id: 'workshop', src: '/scene/audio/workshop.mp3', seconds: 24, gain: .018 },
  { id: 'pass', src: '/scene/audio/car-pass.mp3', seconds: 8, gain: .42 },
] as const

type Options = {
  createContext?: () => AudioContext
  fetchAsset?: typeof fetch
  onUnavailable?: () => void
  random?: () => number
}
type Voice = { source: AudioBufferSourceNode; gain: GainNode; panner?: PannerNode; layer?: number; start?: number; end?: number; peak?: number }
export function audioRoomEligible(state: ExperienceState | null) {
  return !!state && state.mode === 'immersive' && state.documentVisible && state.renderStatus === 'ready'
}
export function safeAudioVolume(volume: number) { return Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0 }
export function passAudioWindow(clipSeconds: number, durationMs: number) {
  const seconds = Math.max(0, Math.min(clipSeconds, durationMs / 1000))
  return { seconds, offset: Math.max(0, (clipSeconds - seconds) / 2) }
}

// All sources are licensed field recordings. No oscillator or generated noise.
// Creation, asset requests and resume happen only after explicit user consent.
export function createTrackAudio(options: Options = {}) {
  let context: AudioContext | null = null, master: GainNode | null = null
  let abort: AbortController | null = null, pending: Promise<'on' | 'unavailable'> | null = null
  let state: ExperienceState | null = null, consent = false, disposed = false, serial = 0, volume = .25
  let buffers: AudioBuffer[] = [], room: Voice[] = [], engine: Voice | null = null, passId: string | null = null
  let passStarts = 0, blockedPassId: string | null = null
  let seed = 0x445246, workshopAfter = 0
  const random = options.random ?? (() => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 })
  const between = (a: number, b: number) => a + (b - a) * Math.max(0, Math.min(1, random()))
  const roomCounts = [0, 0]
  function stopRoom() { room.forEach(stop); room = [] }
  const stop = (voice: Voice) => {
    voice.source.onended = null
    try { voice.source.stop() } catch { /* already ended */ }
    voice.source.disconnect(); voice.gain.disconnect(); voice.panner?.disconnect()
  }
  function cancelPass() { if (engine) stop(engine); engine = null; passId = null }
  function release() {
    cancelPass(); stopRoom(); buffers = []
    master?.disconnect(); master = null
    const old = context; context = null
    if (old && old.state !== 'closed') void old.close().catch(() => {})
  }
  function muteAudio() {
    consent = false; serial++; abort?.abort(); abort = null; pending = null
    // Mute is immediate, including requests still decoding. No fade can leak a tail.
    if (master && context) { master.gain.cancelScheduledValues(context.currentTime); master.gain.setValueAtTime(0, context.currentTime) }
    release()
  }
  function unavailable() { muteAudio(); if (!disposed) options.onUnavailable?.() }
  function ramp(param: AudioParam, value: number, seconds: number) {
    if (!context) return
    param.cancelScheduledValues(context.currentTime)
    param.setValueAtTime(param.value, context.currentTime)
    param.linearRampToValueAtTime(value, context.currentTime + seconds)
  }
  function scheduleRoom(layer: number, initial = false) {
    if (!consent || !context || !master || !audioRoomEligible(state) || volume === 0 || room.some(v => v.layer === layer)) return
    const buffer = buffers[layer]
    if (!buffer) return
    // Native one-shots, including their future start, use the AudioContext clock.
    // onended is only a wake-up: no wall-clock timer or independent car clock.
    const seconds = Math.min(buffer.duration, layer === 0 ? between(8, 12) : between(3, 6))
    const pause = layer === 0 ? (initial ? .1 : between(3, 7)) : between(22, 42)
    const start = Math.max(context.currentTime + pause, layer === 1 ? workshopAfter : 0)
    const offset = between(0, Math.max(0, buffer.duration - seconds))
    const source = context.createBufferSource(), gain = context.createGain()
    const peak = audioAssets[layer].gain * between(.7, 1), fade = Math.min(seconds / 2, layer === 0 ? 2 : .65)
    source.buffer = buffer; source.loop = false
    gain.gain.value = 0
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(peak, start + fade)
    gain.gain.setValueAtTime(peak, start + seconds - fade)
    gain.gain.linearRampToValueAtTime(0, start + seconds)
    source.connect(gain); gain.connect(master)
    const voice: Voice = { source, gain, layer, start, end: start + seconds, peak }
    room.push(voice); roomCounts[layer]++
    source.onended = () => {
      if (!room.includes(voice)) return
      room = room.filter(v => v !== voice); stop(voice)
      scheduleRoom(layer)
    }
    source.start(start, offset, seconds)
  }
  function roomSources() {
    if (buffers.length !== audioAssets.length) return
    scheduleRoom(0, true); scheduleRoom(1, true)
  }
  function update(next: ExperienceState) {
    state = next; setAudioVolume(next.audioVolume)
    if (!consent || !context || !master) return
    if (!audioRoomEligible(state)) {
      cancelPass(); stopRoom(); master.gain.cancelScheduledValues(context.currentTime); master.gain.setValueAtTime(0, context.currentTime)
      if (context.state === 'running') { const current = context; void current.suspend().catch(() => { if (context === current) unavailable() }) }
      return
    }
    if (volume === 0) {
      master.gain.cancelScheduledValues(context.currentTime); master.gain.setValueAtTime(0, context.currentTime)
      return
    }
    if (context.state === 'suspended') {
      const current = context
      void current.resume().then(() => {
        if (context === current && consent && master && audioRoomEligible(state)) ramp(master.gain, volume, .2)
      }).catch(() => { if (context === current) unavailable() })
    }
    else ramp(master.gain, volume, .2)
    roomSources()
    if (state.panelOpen || !state.ambientEnabled) cancelPass()
  }
  function setAudioVolume(value: number) {
    const next = safeAudioVolume(value)
    if (next === volume) return
    volume = next
    if (volume === 0) { cancelPass(); stopRoom() }
    else roomSources()
    if (consent && master && context && audioRoomEligible(state)) {
      if (volume === 0) { master.gain.cancelScheduledValues(context.currentTime); master.gain.setValueAtTime(0, context.currentTime) }
      else ramp(master.gain, volume, .06)
    }
  }
  function requestAudioFromGesture(): Promise<'on' | 'unavailable'> {
    if (disposed) return Promise.resolve('unavailable')
    if (pending) return pending
    if (consent && context?.state === 'running' && buffers.length === audioAssets.length) return Promise.resolve('on')
    const request = ++serial
    try {
      context = options.createContext?.() ?? new AudioContext()
      master = context.createGain(); master.gain.value = 0; master.connect(context.destination)
      abort = new AbortController()
      const ctx = context, signal = abort.signal
      // Call resume synchronously in the originating click, before network awaits.
      const resumed = ctx.resume()
      pending = (async () => {
        try {
          const loaded = await Promise.all(audioAssets.map(async asset => {
            const response = await (options.fetchAsset ?? fetch)(asset.src, { signal })
            if (!response.ok) throw new Error('Audio asset unavailable')
            const decoded = await ctx.decodeAudioData(await response.arrayBuffer())
            if (!decoded.length || decoded.duration <= 0) throw new Error('Empty audio')
            // Retain bounded clips, not two full minutes of decoded PCM per layer.
            const length = Math.min(decoded.length, Math.round(asset.seconds * decoded.sampleRate))
            const buffer = ctx.createBuffer(decoded.numberOfChannels, length, decoded.sampleRate)
            for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
              buffer.copyToChannel(decoded.getChannelData(channel).subarray(0, length), channel)
              // Original PCM stays intact; every excerpt has its own native gain envelope.
            }
            return buffer
          }))
          await resumed
          if (disposed || request !== serial) return 'unavailable'
          if (ctx.state !== 'running') { muteAudio(); return 'unavailable' }
          buffers = loaded; consent = true; pending = null; roomSources()
          if (state) update(state)
          return 'on'
        } catch {
          if (request === serial) muteAudio()
          return 'unavailable'
        }
      })()
      // Observe resume rejection immediately, even if fetch is slower.
      void resumed.catch(() => { if (request === serial) abort?.abort() })
      return pending
    } catch { muteAudio(); return Promise.resolve('unavailable') }
  }
  function updatePass(event: CarPass | null, progress: number, started: boolean,
    position: readonly number[], listener: readonly number[], forward: readonly number[]) {
    if (!event) { cancelPass(); blockedPassId = null; return }
    if (!consent || !context || !master || volume === 0 || state?.audio !== 'on' || !audioRoomEligible(state) || state.panelOpen || !state.ambientEnabled) {
      blockedPassId = event.id; cancelPass(); return
    }
    if (started && blockedPassId !== event.id && buffers[2]) {
      cancelPass()
      // A workshop event cannot compete with the approaching car, even if queued.
      room.filter(v => v.layer === 1).forEach(stop); room = room.filter(v => v.layer !== 1)
      workshopAfter = context.currentTime + event.durationMs / 1000 + between(22, 42)
      scheduleRoom(1)
      const source = context.createBufferSource(), gain = context.createGain(), panner = context.createPanner()
      source.buffer = buffers[2]; source.playbackRate.value = 1
      const window = passAudioWindow(buffers[2].duration, event.durationMs)
      const margin = Math.min(.18, window.offset)
      window.offset += between(-margin, margin)
      panner.panningModel = 'HRTF'; panner.distanceModel = 'inverse'; panner.refDistance = 6; panner.rolloffFactor = .7
      gain.gain.value = 0; source.connect(gain); gain.connect(panner); panner.connect(master)
      engine = { source, gain, panner, peak: audioAssets[2].gain * between(.75, .95) }; passId = event.id; passStarts++
      source.start(context.currentTime, window.offset, window.seconds)
      source.onended = () => { if (engine?.source === source) cancelPass() }
    }
    if (passId !== event.id || !engine) return
    const { panner, gain } = engine
    // Same scheduler progress and world pose as the visible car. No second timer.
    gain.gain.setTargetAtTime(engine.peak! * Math.sin(Math.PI * Math.max(0, Math.min(1, progress))) ** 2, context.currentTime, .035)
    panner!.positionX.value = position[0]; panner!.positionY.value = position[1]; panner!.positionZ.value = position[2]
    const ear = context.listener
    ear.positionX.value = listener[0]; ear.positionY.value = listener[1]; ear.positionZ.value = listener[2]
    ear.forwardX.value = forward[0]; ear.forwardY.value = forward[1]; ear.forwardZ.value = forward[2]
    ear.upX.value = 0; ear.upY.value = 1; ear.upZ.value = 0
  }
  return {
    requestAudioFromGesture, muteAudio, setAudioVolume, update, updatePass, cancelPass,
    get diagnostics() { return { context: context?.state ?? 'none', consent, assets: buffers.length, roomSources: room.length,
      passId, blockedPassId, passStarts, audioState: state?.audio ?? 'off', roomEligible: audioRoomEligible(state),
      volume, masterGain: master?.gain.value ?? 0, roomCounts: [...roomCounts],
      roomSchedule: room.map(v => ({ layer: v.layer, start: v.start, end: v.end })),
      retainedBytes: buffers.reduce((n, b) => n + b.length * b.numberOfChannels * 4, 0) } },
    dispose() { if (!disposed) { disposed = true; muteAudio() } },
  }
}
