// Silence is intentional until an authored/licensed sound passes listening review.
// No AudioContext, oscillator, sample request or automatic consent is created.
export function createTrackAudio() {
  return {
    requestAudioFromGesture: async (): Promise<'unavailable'> => 'unavailable',
    muteAudio: () => {},
    setAudioVolume: (volume: number) => { void volume },
    dispose: () => {},
  }
}
