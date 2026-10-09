# Contratos de integração — versão 1

Tipos materializados na Missão 03; fonte canônica em `src/contracts/index.ts`, mantida pelo Lead. Exportações e pontos de entrada estão no [handoff](PLANO.md#handoff-da-missão-03). Mudança incompatível exige revisão dos consumidores antes de editar. Não adicionar bibliotecas de estado, eventos, física ou áudio para cumprir estes contratos.

## Conteúdo compartilhado

```ts
type Locale = 'pt' | 'en'
type Localized = Readonly<Record<Locale, string>>
type ZoneId = 'garage' | 'telemetry' | 'pit-wall'
  | 'driver-profile' | 'strategy-room'
type ProjectId = string // slug estável registrado no catálogo

type Evidence = Readonly<{
  id: string
  label: Localized
  publicUrl: string | null // apenas URL revisada, pública e segura
  revision: string | null
  checkedAt: string // YYYY-MM-DD da revisão documental
}>

type Metric = Readonly<{
  id: string
  projectId: ProjectId
  label: Localized
  unit: string
  period: Localized
  evidenceIds: readonly string[]
} & (
  | { state: 'documented' | 'reproduced' | 'estimated';
      value: number; context: Localized }
  | { state: 'missing'; value: null; context: null }
)>

type ContentMedia = Readonly<{
  id: string
  src: string // asset revisado da V2
  alt: Localized
  provenance: 'real' | 'sanitized' | 'synthetic' | 'original-art'
  credit: Localized
  licenseRef: string
}>

type Project = Readonly<{
  id: ProjectId
  title: Localized
  summary: Localized
  problem: Localized | null
  contribution: Localized | null
  decisions: readonly Localized[]
  technologies: readonly string[]
  contentStatus: 'reviewed' | 'pending-evidence'
  productStatus: Localized | null // não inferir a partir de contentStatus
  limitations: readonly Localized[]
  evidenceIds: readonly string[]
  mediaIds: readonly string[]
  metricIds: readonly string[]
  repositoryUrl: string | null
  demoUrl: string | null
  relatedZones: readonly ZoneId[]
}>

type Experience = Readonly<{
  id: string
  organization: Localized
  role: Localized
  start: string | null // YYYY-MM; só com evidência
  end: string | null
  isCurrent: boolean | null // null significa não confirmado
  summary: Localized
  evidenceIds: readonly string[]
}>

type PortfolioContent = Readonly<{
  schemaVersion: 1
  profile: { name: string; summary: Localized; location: Localized;
    education: readonly Localized[]; interests: readonly Localized[];
    cvUrl: string | null; contactLinks: readonly {
      id: string; label: Localized; url: string
    }[] }
  zones: readonly { id: ZoneId; label: Localized; summary: Localized }[]
  projects: readonly Project[]
  experiences: readonly Experience[]
  metrics: readonly Metric[]
  media: readonly ContentMedia[]
  evidence: readonly Evidence[]
}>
```

- UI e Recruiter Mode recebem o mesmo `PortfolioContent`. Cena recebe somente IDs, rótulos e assets necessários, derivados pelo adaptador do Lead; nunca busca dados de negócio ou acessa Supabase/APIs dos projetos.
- Invariantes: IDs únicos, referências existentes, ambos os idiomas preenchidos, URLs revisadas e métricas finitas. Métrica não ausente exige evidência/contexto; estimativa é identificada e justificada. Dados sintéticos são demonstração de interface, nunca resultado real de projeto. Formatar valores com locale e unidade, sem arredondamento que altere o significado.
- Experiência sem data continua legível como item sem período confirmado. `isCurrent` não é deduzido de `end: null`. Não mostrar tamanho de equipe, responsabilidade individual ou resultados sem fonte.
- Horta: `pending-evidence`, `productStatus: null`, `metricIds: []`, links `null` até verificação; resumo limitado ao que o usuário informou, com ressalva traduzida. Atleta é um único registro relacionado a Garage e Driver Profile.
- Fontes internas, caminhos locais de auditoria, credenciais e informação confidencial ficam fora do payload público. Assets licenciados/sanitizados são conferidos antes de referenciados.

## Estado, navegação e interface da cena

```ts
type ViewMode = 'immersive' | 'recruiter'
type RenderStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error'
type AudioStatus = 'off' | 'requested' | 'on' | 'unavailable'
type Quality = 'low' | 'balanced' // sem qualidade máxima na primeira entrega
type NavigationTarget = Readonly<{
  zoneId: ZoneId
  projectId: ProjectId | null
}>
type ExperienceState = Readonly<{
  locale: Locale
  mode: ViewMode
  target: NavigationTarget
  navigationSeq: number
  renderStatus: RenderStatus
  audio: AudioStatus
  audioVolume: number // 0..1, padrão 0.25, apenas durante a sessão
  reducedMotion: boolean
  ambientEnabled: boolean
  panelOpen: boolean
  documentVisible: boolean
  quality: Quality
}>
type SceneEvent =
  | { type: 'SELECT_TARGET'; target: NavigationTarget }
  | { type: 'SCENE_STATUS'; status: RenderStatus }
  | { type: 'CAMERA_SETTLED'; navigationSeq: number }
  | { type: 'AUDIO_STATUS'; status: AudioStatus }
  | { type: 'QUALITY_REQUEST'; quality: Quality }
type SceneProps = Readonly<{
  state: ExperienceState
  contentIndex: readonly { zoneId: ZoneId; projectId: ProjectId | null;
    label: Localized; media: readonly ContentMedia[] }[]
  onEvent: (event: SceneEvent) => void
}>
type SceneHandle = {
  requestAudioFromGesture: () => Promise<'on' | 'unavailable'>
  muteAudio: () => void
  setAudioVolume?: (volume: number) => void // opcional para cena sem áudio
}
type UIActions = Readonly<{
  navigate: (target: NavigationTarget) => void
  setLocale: (locale: Locale) => void
  setMode: (mode: ViewMode) => void
  setAudioEnabled: (enabled: boolean) => Promise<void>
  setAudioVolume: (volume: number) => void // clamp; não liga áudio
  setAmbientEnabled: (enabled: boolean) => void
  setPanelOpen: (open: boolean) => void
  retryScene: () => void
}>
type PortfolioShellProps = Readonly<{
  content: PortfolioContent
  state: ExperienceState
  actions: UIActions
}>
```

**Lead é o único dono de `ExperienceState`.** UI emite intenções por `UIActions`. Cena exporta `SceneRoot` com `SceneProps` e `SceneHandle`; informa eventos, sem alterar diretamente estado, URL ou DOM dos painéis. UI exporta `PortfolioShell` com `PortfolioShellProps`. Nenhum produtor replica o catálogo ou importa componentes do outro.

Fluxo: intenção UI/hotspot → Lead valida IDs → atualiza target/URL e incrementa `navigationSeq` → UI apresenta conteúdo → cena movimenta a câmera. A última navegação vence: cancelar transição anterior; ignorar conclusões de sequência antiga. `CAMERA_SETTLED` não provoca nova navegação. Não animar posição de câmera com GSAP e `useFrame` simultaneamente.

URL inicial: `?lang=pt&mode=immersive#garage`; projeto: `#garage/atleta-hibrido`. IDs de zona/projeto independem de idioma. Lead trata links diretos, voltar/avançar e entradas inválidas (voltar a Garage). Preferências válidas seguem URL → armazenamento local → padrão PT/immersive; bloquear armazenamento não pode impedir navegação. Áudio sempre começa off, sem restaurar ativação automática. Não usar outra biblioteca de roteamento no primeiro corte.

Teclado usa links/botões HTML equivalentes aos hotspots. Cena não captura Tab, não exige drag e não rouba foco. Ao abrir painel, UI move foco ao título/controle adequado; Escape fecha e devolve foco ao acionador quando existir. Back/forward e troca de modo preservam seleção; informar mudanças essenciais sem anunciar cada quadro ou evento ambiente.

Carregamento 3D é lazy e isolado por Suspense/ErrorBoundary do Lead. Cena reporta erro/perda de contexto e libera recursos; app oferece conteúdo em HTML, aviso e tentativa manual. Recruiter não monta canvas nem agenda CAR_PASS; retorno à experiência recria cena na seleção vigente. Reduced motion permanece um modo distinto de WebGL indisponível.

Cena usa R3F/Three para quadros, objetos e câmera; UI usa CSS/Framer Motion para transições de interface. GSAP só quando houver necessidade demonstrada, com alvo exclusivo e cleanup. Não atualizar React a cada quadro. Liberação, cancelamento e subscriptions devem tolerar montagem/desmontagem do StrictMode.

Com reduced motion, câmera vai diretamente ao enquadramento solicitado, sem percurso cinematográfico; UI elimina deslocamentos/transições não essenciais. Mudança de preferência em tempo real cancela animações/CAR_PASS e restaura objetos. Entrar em recruiter redefine áudio para off; voltar ao immersive não restaura som automaticamente. Mute chama `muteAudio` imediatamente, antes de aguardar qualquer atualização assíncrona.

## Trackside CAR_PASS

```ts
type CarPass = Readonly<{
  type: 'CAR_PASS'
  id: string
  startMs: number // relógio monotônico do scheduler da cena
  durationMs: number
  vehicleId: string // carro fictício com asset original/licenciado
  direction: 'left-to-right' | 'right-to-left'
  seed: number
}>
```

3D Developer possui scheduler, curvas visuais, materiais, vibração e áudio. `CarPass` é interno à cena; não é métrica de projeto nem evento global do DOM. Configuração e função de progresso devem ser testáveis com relógio/seed injetados, sem controles de debug expostos em produção.

1. Scheduler usa relógio monotônico comum e emite no máximo um evento ativo. Parâmetros iniciais ajustáveis de design: intervalo 25–45 s após término anterior, duração 3–5 s; primeira passagem após o intervalo inicial, nunca atrasando a entrada. Seed permite repetir o mesmo cenário no QA.
2. Todos os efeitos derivam de `p = clamp((nowMs - startMs) / durationMs, 0, 1)`. Posição segue trajeto fora da garagem, visível pela abertura; envelope suave próximo da abertura coordena realce especular/reflexo e intensidade dos objetos. Proibir timers independentes para cada efeito.
3. Vibração de poucos objetos leves usa oscilação amortecida analítica, de amplitude pequena, ancorada na transformação original. Ao terminar/cancelar, restaurar transformações/materiais. Sem Rapier/Cannon, câmera tremendo, texto vibrando ou pulsos luminosos abruptos.
4. Áudio espacial opcional usa Web Audio/PannerNode, posição do carro e listener da câmera; mapear o início ao relógio do AudioContext, sem reiniciar som a cada quadro. `requestAudioFromGesture` é chamado imediatamente pelo clique do usuário, para desbloqueio; app aplica o resultado ao estado. Falha/asset ausente retorna unavailable, preservando a experiência silenciosa. Não carregar áudio antes do opt-in. Áudio ligado no meio de uma passagem só vale para a próxima.
5. Novo evento exige cena pronta, modo immersive, ambiente habilitado, aba visível, painel fechado e câmera assentada. Efeitos visuais exigem movimento permitido; em reduced motion só agendar a variante exclusivamente sonora se áudio estiver on. Transição de câmera ou abertura de painel cancela evento ativo e restaura objetos; aba oculta/recruiter/unmount também cancela e interrompe áudio. Retorno reinicia intervalo, sem recuperar eventos perdidos.
6. `reducedMotion` suprime CAR_PASS visual, reflexos animados e vibração, mantendo pista estática. Áudio opt-in pode funcionar em passagem exclusivamente sonora, sem deslocamento animado do listener/câmera; usa o mesmo gate de visibilidade/leitura e nunca liga movimento. Controle de ambiente pode desligar todos os eventos.
7. Qualidade low mantém carro simplificado e resposta de material barata, sem render targets dinâmicos ou pós-processamento. Se o desempenho exigir, app reduz qualidade e pode desligar ambiente; conteúdo e navegação permanecem.

## Assets e performance

Modelos originais/procedurais primeiro; GLB/texturas externos somente após licença/proveniência revisadas. Texturas pequenas, sombras limitadas, materiais compartilhados e sem pós-processamento obrigatório. Cena pausa rendering ocioso quando possível; animações/eventos solicitam quadros apenas enquanto ativos. Usar assets locais e evitar importação abrangente de helpers sem necessidade.

Metas iniciais de aceite, não resultados medidos: JavaScript inicial ≤250 KiB gzip (3D lazy separado), primeiro conjunto de assets 3D ≤3 MiB transferidos, DPR low ≤1 e balanced ≤1,5. Medir antes de adicionar efeitos. Alvo 30 fps mobile/60 fps desktop em percurso definido; registrar dispositivo, viewport, navegador e mediana/p95 de frame time. Se o alvo falhar, reduzir qualidade/custo; revisão de orçamento é decisão do Lead registrada no plano, nunca promessa silenciosa.
