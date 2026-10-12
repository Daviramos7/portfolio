# Missão 15 — continuidade exterior

Base8d93bbf, branch feat/drf-engineering-3d. Escopo: TrackOpening.ts,
preparation.ts, teste exterior e este relatório. TrackPass/GLB/rolamento,
curva XZ/duração, câmera/framing/controlador, UI, áudio, Easter/fontes e
conteúdo não foram alterados. Sem downloads, dependências ou assets novos.

## Causa medida antes da edição

Piso interno real: y=-.007. Deck anterior topo1.545; asfalto1.55; os quatro
pneus GLB, escala1.2, têm mínimo local0 e contato mundial1.55. Diferença
para o interior:1.557m, não mero artefato de perspectiva. A face do deck
começava em z=-7.75 e formava um degrau visível pela abertura. A rampa lateral
não estabelecia continuidade frontal com a garagem. Grelha interna em
z=-5.85 tem topo.03 (37mm acima do piso), não é essa plataforma exterior.

Câmera hero preservada: altura1.85 desktop/2.15 mobile; antes apenas.30/.60m
acima da pista artificial. Canopy exterior y4.2 e formas de horizonte com
1–2.8m não mudaram. A pista elevada escondia parte da base desses volumes,
reduzindo leitura de profundidade. Coordenadas de geometria/rodas/soleira,
projeções e objetos antes/depois em scene-after/coordinates.json.

## Correção restrita

Asfalto e rota/pneus em y=-.007, igual ao piso interno. Apron contínuo até a
abertura em y=-.012: desnível5mm para drenagem, não plataforma. Asfalto inicia
em z=-8.5, borda real do piso interno, sem sobreposição de acabamentos
coplanares. Slabs com espessura abaixo do solo, sem deck elevado/rampa lateral.
Faixa de tinta2mm; curb30mm. Separator com base-.007/topo.413, fencing lateral
reancorado à nova cota. Canopy/horizonte existentes preservados. Os endpoints
mudam somente Y: (-16.8,-.007,-27.6) e (11.2,-.007,-14.6). Não foi alterada a
velocidade, escala, orientação ou sincronização das rodas.

## Capturas e vídeos reais

Raiz externa ao Git no checkout principal:
`.agent-grid/screenshots/mission-15/scene-before/` e `scene-after/`.
Hero: garage-{1440,390,320}-{direction}-cinematic.png. Projetos:
project-{1440,390,320}.png, mesma seleção pública/pose final nativa estática.
Passagem: garage-{width}-{direction}-pass-{progress}.png, cinco momentos.
Antes capturado na base integrada antes da edição; after na correção final.

Vídeos completos em ambas as direções, todas as três larguras:
garage-{width}-{left-to-right,right-to-left}.webm (canvas) e
garage-{width}-{direction}-viewport.webm (HUD incluído). Chrome instalado
headless, profiles isolados, áudio OFF; reduced nativo true, Cinemático
selecionado pela UI para cada gravação, sem mudar OS/media preference.
Trigger DEV existente fixo2400ms; produção não foi instrumentada.
MediaRecorder VP9 de canvas.captureStream e screencast CDP contínuo ao vivo
codificado no browser; timestamps em qa.json, sem animação offline/interpolação.
video-verify.json confirma24 vídeos (12 antes/12 depois) com decoding nativo
em início/meio/fim e dimensões corretas, sem frame preto. Duração dos arquivos
after2.507–2.772s inclui captura antes/depois do evento; não é nova duração
do scheduler. PNGs integrados e frames decoded-* inspecionados separadamente.

## Limites visuais explícitos

Elevação removida; o asfalto escuro ainda aparece como faixa em perspectiva
baixa/recortada pela abertura. Não alegar overhaul visual ou aceite humano.
Carro corretamente à cota do solo fica mais encoberto pelo hero no desktop e
pela ficha mobile. Contato teórico central projetado (não pixels segmentados):
1440 y325.3→417.5;390 y359.6→407.9;320 y371.3→410.6. Em390 há partes
reconhecíveis, mas em320 grande parte do veículo fica atrás da ficha e não há
prova de silhueta completa legível nessa composição. Passagem mobile NÃO está
resolvida. Não elevar novamente a pista ou alterar câmera/UI para escondê-lo.
Pose de projeto olha para os displays, sem prometer visão exterior.

Teste existente de viewport/abertura continua passando por geometria real,
mas não considera hero/HUD: não usá-lo como prova de visibilidade integrada.
PNG/vídeo são a evidência da oclusão. Eventual solução de composição exige
nova direção do Lead; nenhuma outra implementação iniciada.

## Validação e custos

Lint/build e72 testes node:test passaram; lista obtida por
rg -l node:test tests -g '*.test.mjs', sem wildcard de harnesses browser.
Teste novo compara piso interno real, road/apron, ausência de overlap,
raycasts de solo pela abertura, base do separator e os quatro pneus reais
em101 amostras por direção com rolamento (tolerância12mm para tread facetado
e queda5mm do apron; sem física). Gates/cancelamento/reversão/disposal e
frustum existentes preservados. Smoke preview5174:13 grupos, console/network
sem erros, fallback/contextloss/retry/reduced/mobile/PTEN; production-smoke/.

Draw calls máximos observados na passagem: desktop105 e mobile89 antes/depois.
Triângulos: desktop81060→81046, mobile77276→77262; remoção14tri, sem aumento.
Snapshot geometria73→72 desktop/52→51 mobile; texturas29/24 inalteradas.
DPR1 nos registros e política/MSAA preservados. GLB166608 bytes/13710tri
inalterado. SceneRoot final668.05kB/gzip176.32kB; alerta chunk>500kB permanece.
Sem comparação de FPS, GPU física, telefone real ou escuta humana. Logs,
harnesses privados e medições preservados fora do Git junto às evidências.
Preview próprio encerrado na entrega; aguardar revisão do Lead.
