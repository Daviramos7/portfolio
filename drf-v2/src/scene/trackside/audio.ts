import type { CarPass, ExperienceState } from '../../contracts/index.ts'

export const audioAssets = [
  { id: 'ventilation', src: '/scene/audio/ventilation.mp3', seconds: 16, gain: .075 },
  { id: 'workshop', src: '/scene/audio/workshop.mp3', seconds: 24, gain: .06 },
  { id: 'pass', src: '/scene/audio/car-pass.mp3', seconds: 8, gain: .42 },
] as const

type Options = {
  createContext?: () => AudioContext
  fetchAsset?: typeof fetch
  onUnavailable?: () => void
}
type Voice = { source: AudioBufferSourceNode; gain: GainNode; panner?: PannerNode }
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
  const stop = (voice: Voice) => {
    voice.source.onended = null
    try { voice.source.stop() } catch { /* already ended */ }
    voice.source.disconnect(); voice.gain.disconnect(); voice.panner?.disconnect()
  }
  function cancelPass() { if (engine) stop(engine); engine = null; passId = null }
  function release() {
    cancelPass(); room.forEach(stop); room = []; buffers = []
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
  function roomSources() {
    if (!context || !master || room.length || buffers.length !== audioAssets.length) return
    room = buffers.slice(0, 2).map((buffer, i) => {
      const source = context!.createBufferSource(), gain = context!.createGain()
      source.buffer = buffer; source.loop = true; gain.gain.value = audioAssets[i].gain
      source.connect(gain); gain.connect(master!); source.start()
      return { source, gain }
    })
  }
  function update(next: ExperienceState) {
    state = next; setAudioVolume(next.audioVolume)
    if (!consent || !context || !master) return
    if (!audioRoomEligible(state)) {
      cancelPass(); master.gain.cancelScheduledValues(context.currentTime); master.gain.setValueAtTime(0, context.currentTime)
      if (context.state === 'running') { const current = context; void current.suspend().catch(() => { if (context === current) unavailable() }) }
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
    if (consent && master && audioRoomEligible(state)) ramp(master.gain, volume, .06)
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
              if (asset.id !== 'pass') {
                const data = buffer.getChannelData(channel), fade = Math.min(Math.round(buffer.sampleRate * .3), Math.floor(length / 2))
                for (let j = 0; j < fade; j++) { data[j] *= j / fade; data[length - 1 - j] *= j / fade }
              }
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
    if (!consent || !context || !master || state?.audio !== 'on' || !audioRoomEligible(state) || state.panelOpen || !state.ambientEnabled) {
      blockedPassId = event.id; cancelPass(); return
    }
    if (started && blockedPassId !== event.id && buffers[2]) {
      cancelPass()
      const source = context.createBufferSource(), gain = context.createGain(), panner = context.createPanner()
      source.buffer = buffers[2]; source.playbackRate.value = 1
      const window = passAudioWindow(buffers[2].duration, event.durationMs)
      panner.panningModel = 'HRTF'; panner.distanceModel = 'inverse'; panner.refDistance = 6; panner.rolloffFactor = .7
      gain.gain.value = 0; source.connect(gain); gain.connect(panner); panner.connect(master)
      engine = { source, gain, panner }; passId = event.id; passStarts++
      source.start(context.currentTime, window.offset, window.seconds)
      source.onended = () => { if (engine?.source === source) cancelPass() }
    }
    if (passId !== event.id || !engine) return
    const { panner, gain } = engine
    // Same scheduler progress and world pose as the visible car. No second timer.
    gain.gain.setTargetAtTime(audioAssets[2].gain * Math.sin(Math.PI * progress) ** 2, context.currentTime, .035)
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
      volume, masterGain: master?.gain.value ?? 0, retainedBytes: buffers.reduce((n, b) => n + b.length * b.numberOfChannels * 4, 0) } },
    dispose() { if (!disposed) { disposed = true; muteAudio() } },
  }
}
