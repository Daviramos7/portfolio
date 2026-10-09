// Original, deliberately quiet tonal synthesis; no samples or independent event timers.
export function createTrackAudio(onFailure: () => void) {
  let context: AudioContext | null = null, master: GainNode | null = null, fan: GainNode | null = null
  let motor: GainNode | null = null, oscillator: OscillatorNode | null = null, panner: PannerNode | null = null
  const sources: OscillatorNode[] = []
  let connected = false
  let enabled = false, disposed = false, request = 0, volume = .25, allowed = false, audiblePass = false
  function muteAudio() {
    request++; enabled = false; audiblePass = false
    if (context && master) { master.gain.cancelScheduledValues(context.currentTime); master.gain.value = 0; master.gain.setValueAtTime(0, context.currentTime); if (connected) { master.disconnect(); connected = false } void context.suspend().catch(() => {}) }
  }
  function dispose() { if (disposed) return; disposed = true; muteAudio(); sources.forEach(s => { try { s.stop() } catch { /* partial initialization */ } s.disconnect() }); sources.length = 0; void context?.close().catch(() => {}); context = null }
  function gain(node: GainNode | null, value: number) { if (context && node) node.gain.setTargetAtTime(value, context.currentTime, .035) }
  return {
    async requestAudioFromGesture(): Promise<'on' | 'unavailable'> {
      if (disposed) return 'unavailable'
      const token = ++request
      try {
        if (!context) {
          context = new AudioContext(); master = context.createGain(); master.gain.value = 0; master.connect(context.destination); connected = true
          fan = context.createGain(); fan.gain.value = .018; fan.connect(master)
          const air = context.createOscillator(); air.type = 'sine'; air.frequency.value = 55; air.connect(fan); sources.push(air)
          motor = context.createGain(); motor.gain.value = 0; panner = context.createPanner(); panner.panningModel = 'equalpower'; panner.refDistance = 8; panner.maxDistance = 80; motor.connect(panner); panner.connect(master)
          const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 550; filter.connect(motor)
          oscillator = context.createOscillator(); oscillator.type = 'triangle'; oscillator.frequency.value = 90; oscillator.connect(filter); sources.push(oscillator)
          sources.forEach(source => source.start())
        }
        await context.resume()
        if (disposed || token !== request) { if (!enabled) void context?.suspend().catch(() => {}); return 'unavailable' }
        if (!connected && master) { master.connect(context.destination); connected = true }
        enabled = true; gain(master, allowed ? volume : 0); return 'on'
      } catch { dispose(); return 'unavailable' }
    },
    muteAudio,
    setAudioVolume(value: number) { if (Number.isFinite(value)) { volume = Math.max(0, Math.min(1, value)); if (enabled) gain(master, allowed ? volume : 0) } },
    setGate(value: boolean) { if (allowed === value) return; allowed = value; gain(master, enabled && allowed ? volume : 0); if (!value) { audiblePass = false; gain(motor, 0) } },
    beginPass(consented: boolean) { audiblePass = enabled && allowed && consented },
    updatePass(progress: number | null, direction: string = 'left-to-right') {
      if (!context || !enabled) return
      try {
        const envelope = progress === null ? 0 : Math.sin(Math.PI * progress) ** 2
        gain(motor, audiblePass ? envelope * .09 : 0)
        if (progress !== null && oscillator && panner) {
          oscillator.frequency.setTargetAtTime(115 - progress * 40, context.currentTime, .04)
          panner.positionX.setTargetAtTime((direction === 'left-to-right' ? 1 : -1) * (progress * 44 - 22), context.currentTime, .04)
          panner.positionZ.setValueAtTime(-11, context.currentTime)
        }
        if (progress === null) audiblePass = false
      } catch { muteAudio(); onFailure() }
    },
    updateListener(position: readonly number[], forward: readonly number[]) {
      if (!context || !enabled) return
      try {
      const listener = context.listener, now = context.currentTime
      listener.positionX.setValueAtTime(position[0], now); listener.positionY.setValueAtTime(position[1], now); listener.positionZ.setValueAtTime(position[2], now)
      listener.forwardX.setValueAtTime(forward[0], now); listener.forwardY.setValueAtTime(forward[1], now); listener.forwardZ.setValueAtTime(forward[2], now)
      listener.upX.setValueAtTime(0, now); listener.upY.setValueAtTime(1, now); listener.upZ.setValueAtTime(0, now)
      } catch { muteAudio(); onFailure() }
    },
    dispose,
  }
}
