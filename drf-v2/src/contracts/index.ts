export type Locale = 'pt' | 'en'
export type Localized = Readonly<Record<Locale, string>>
export type ZoneId = 'garage' | 'telemetry' | 'pit-wall' | 'driver-profile' | 'strategy-room'
export type ProjectId = string

export type Evidence = Readonly<{
  id: string
  label: Localized
  publicUrl: string | null
  revision: string | null
  checkedAt: string
}>

export type Metric = Readonly<{
  id: string
  projectId: ProjectId
  label: Localized
  unit: string
  period: Localized
  evidenceIds: readonly string[]
} & (
  | { state: 'documented' | 'reproduced' | 'estimated'; value: number; context: Localized }
  | { state: 'missing'; value: null; context: null }
)>

export type ContentMedia = Readonly<{
  id: string
  src: string
  alt: Localized
  provenance: 'real' | 'sanitized' | 'synthetic' | 'original-art'
  credit: Localized
  licenseRef: string
}>

export type Project = Readonly<{
  id: ProjectId
  title: Localized
  summary: Localized
  problem: Localized | null
  contribution: Localized | null
  decisions: readonly Localized[]
  technologies: readonly string[]
  contentStatus: 'reviewed' | 'pending-evidence'
  productStatus: Localized | null
  limitations: readonly Localized[]
  evidenceIds: readonly string[]
  mediaIds: readonly string[]
  metricIds: readonly string[]
  repositoryUrl: string | null
  demoUrl: string | null
  relatedZones: readonly ZoneId[]
}>

export type Experience = Readonly<{
  id: string
  organization: Localized
  role: Localized
  start: string | null
  end: string | null
  isCurrent: boolean | null
  summary: Localized
  evidenceIds: readonly string[]
}>

export type PortfolioContent = Readonly<{
  schemaVersion: 1
  profile: Readonly<{
    name: string
    summary: Localized
    location: Localized
    education: readonly Localized[]
    interests: readonly Localized[]
    cvUrl: string | null
    contactLinks: readonly Readonly<{ id: string; label: Localized; url: string }>[]
  }>
  zones: readonly Readonly<{ id: ZoneId; label: Localized; summary: Localized }>[]
  projects: readonly Project[]
  experiences: readonly Experience[]
  metrics: readonly Metric[]
  media: readonly ContentMedia[]
  evidence: readonly Evidence[]
}>

export type ViewMode = 'immersive' | 'recruiter'
export type RenderStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error'
export type AudioStatus = 'off' | 'requested' | 'on' | 'unavailable'
export type Quality = 'low' | 'balanced'
export type NavigationTarget = Readonly<{ zoneId: ZoneId; projectId: ProjectId | null }>
export type ExperienceState = Readonly<{
  locale: Locale
  mode: ViewMode
  target: NavigationTarget
  navigationSeq: number
  renderStatus: RenderStatus
  audio: AudioStatus
  reducedMotion: boolean
  ambientEnabled: boolean
  panelOpen: boolean
  documentVisible: boolean
  quality: Quality
}>

export type SceneEvent =
  | { type: 'SELECT_TARGET'; target: NavigationTarget }
  | { type: 'SCENE_STATUS'; status: RenderStatus }
  | { type: 'CAMERA_SETTLED'; navigationSeq: number }
  | { type: 'AUDIO_STATUS'; status: AudioStatus }
  | { type: 'QUALITY_REQUEST'; quality: Quality }

export type SceneProps = Readonly<{
  state: ExperienceState
  contentIndex: readonly Readonly<{
    zoneId: ZoneId
    projectId: ProjectId | null
    label: Localized
    media: readonly ContentMedia[]
  }>[]
  onEvent: (event: SceneEvent) => void
}>
export type SceneHandle = {
  requestAudioFromGesture: () => Promise<'on' | 'unavailable'>
  muteAudio: () => void
}
export type UIActions = Readonly<{
  navigate: (target: NavigationTarget) => void
  setLocale: (locale: Locale) => void
  setMode: (mode: ViewMode) => void
  setAudioEnabled: (enabled: boolean) => Promise<void>
  setAmbientEnabled: (enabled: boolean) => void
  setPanelOpen: (open: boolean) => void
  retryScene: () => void
}>
export type PortfolioShellProps = Readonly<{
  content: PortfolioContent
  state: ExperienceState
  actions: UIActions
}>

// Evento interno da cena: não integra o catálogo nem um bus global de DOM.
export type CarPass = Readonly<{
  type: 'CAR_PASS'
  id: string
  startMs: number
  durationMs: number
  vehicleId: string
  direction: 'left-to-right' | 'right-to-left'
  seed: number
}>
