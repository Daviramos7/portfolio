# Missão 14 — diagnóstico da cena (sem implementação)

Base552f962, branch feat/drf-engineering-3d, tree inicialmente limpa. Câmera,
framing/controller, Canvas/projetos, contratos, conteúdo, UI e áudio preservados.
Somente este relatório será commitado. Não há revisão de currículo.

## Evidências e método

Raiz externa ao Git: `.agent-grid/screenshots/mission-14/scene-before/` no
checkout portfolio. `qa.json` contém15 casos: cinco estações ×1440×900,
390×844 e320×844. Chrome instalado headless, WebGL real, media preference
nativa true em todos; captura estática `*-native.png` antes de escolher
Cinemático pela UI, sem mudar/emular preferência OS. Áudio permanece off.
`*-cinematic.png` registra as cinco vistas/detalhes. `*-pass-0.25/0.5/0.75.png`
registra entrada, cruzamento e saída; consultar progresso efetivo no JSON,
pois screenshot/CDP têm latência, não representam exatamente o valor pedido.

Vídeos `garage-1440.webm`, `garage-390.webm`, `garage-320.webm` e os12 das
outras estações: gravação CONTÍNUA real via canvas.captureStream(30) +
MediaRecorder VP9 do próprio Chrome,2,5Mbit/s solicitado. Sem montagem de
frames, animação offline ou software instalado. Contêm o canvas, não o HUD;
as PNGs simultâneas incluem HUD/Ficha e comprovam oclusão integrada. Cada
registro cobre antes/início/fim da passagem (~2,69–2,78s). A contagem
em `video.samples` é RAF de observação, não frames codificados/FPS percebido.
Os15 arquivos têm81–633kB. `video-verify.json` e `video-decoded-*-{0.6,1.5,2.5}.png`
comprovam reprodução/decodificação nos três tamanhos, imagens não pretas e
momentos distintos. Sem captura de monitor físico/telefone físico/escuta.

Harness `m14-*.mjs` preservado junto às provas, foraGit. Build DEV temporário
em AppData/Temp reutiliza gatilho existente `canvas.drfDebugTrackside.trigger()`;
não instrumentou produto nem modificou gates. É evidência determinística,
não medição da espera natural. Build temporário passou; zero exceções/console
errors nos15 casos e nos6 checks adicionais PT/EN. Não rerodei smoke/core/lint
integrados: esta etapa altera somente documentação.

## Passagem: causas e projeção

Rota atual x=-11,5→6,5m, y=1,145m, z=-12,7m com arco máximo0,5m para trás.
Duração contratual privada2,2–2,6s; evento observado ~2,47s,18m/~2,47s≈7,3m/s
(~26km/h em unidades virtuais, não velocidade real medida). TrackPass muda
posição/yaw do grupo; NÃO gira rodas. Corpo mantém leitura quase lateral,
sem rolamento e com pouca mudança de profundidade: deslizamento, não entrada
energética. O GLB carregou em todos os casos; não era fallback parado.

`projection.json`: projeção analítica do AABB do GLB usando pose/quaternion,
progress e timestamps reais gravados, não segmentação de pixels visíveis.
Centro fora do frustum não recebe tamanho/velocidade representativos; nunca
interpretar projeções singulares dessas vistas como velocidade de tela.

| Hero | Distância média no trecho25–75% | AABB médio px | Centro projetado px/s |
| --- | ---: | ---: | ---: |
|1440|21,2m|309×82|403|
|390|23,9m|159×42|207|
|320|23,9m|129×34|168|

Três momentos atuais do hero320: progresso efetivo .29/.52/.78; centro
(361,382)/(258,380)/(161,378)px; AABB144×37/126×34/116×30px. Entrada fora da
borda direita, meio ainda sobre a Ficha (começa aproximadamentey376), saída
menor. Desktop equivalente: centros(1249,352)/(1012,347)/(794,342), larguras
356/301/266px. Não é ausência de movimento: escala/distância, trajetória
lateral, rodas estáticas e janela útil explicam a percepção ruim.

| Estação | Leitura real nas provas |
| --- | --- |
|Garagem|Desktop distingue carro, entrada recorta na borda.390/320: Ficha cobre rodas/base no cruzamento; vídeo canvas semHUD mostra essa diferença claramente.|
|Telemetria|Monitor ocupa centro; carro aparece cortado na faixa direita. Centro teórico931/407/331px/s, mas não silhueta inteira.|
|Pit Wall|Centro da rota fora do frustum no trecho central; abertura só faixa lateral esquerda, monitor/estojo ocupam a vista.|
|Perfil|Vista voltada para parede interna; carro não é descoberto pela passagem nessa pose.|
|Estratégia|Vista voltada para bancada/parede interna; rota externa não aparece nessa pose.|

Não prometer veículo completo em cinco vistas congeladas: Perfil/Estratégia
não olham para a abertura. Também não declarar mobile resolvido sem HUD.

## Estojo, controle e outros detalhes

`case-close.png` é clip nativo de screenshot, sem zoom/câmera nova. Corpo
RoundedBox depth .46 → frente z=.230; faixas Box depth .014 centradas em .223
→ frente também .230. Faces coplanares reproduzem serrilhado/interferência
preta sobre vermelho/branco (z-fighting), inclusive no mobile. Faixas usam
materiais paint/white/black, NÃO atlas. Atlas512×512 é SRGB e só usado em
placa/cartão/360/constância; não atribuir este bug a UV/colorSpace. Tampa usa
metal com roughness/normal procedural, sem albedo baixado. Separar fisicamente
faixas da face ou usar uma única frente autoral, sem polygonOffset como disfarce.

`gamepad-close.png`: volume existe, mas perfil é extrusão de espessura constante,
bevel facetado; duas tampas circulares, três botões e pequeno tile360. Falta
D-pad, gatilhos/ombros e volumes ergonômicos diferenciados; a assimetria dos
sticks não basta. Forma genérica de placa branca, não defeito de textura.
Reutilizar shell e melhorar pegas/face/controles autorais, sem modelo/logo oficial.

REC/PE inteiro no hero, porém miniatura no mobile; cartão reconhecível mas
inscrição pequena; handgrip tem forma legível mas constância ilegível mobile.
Estão nas cinco poses reais registradas, passivos; aria não prova descoberta
visual. Não ampliar cinco objetos juntos nem inventar interação/rotina pessoal.

## Canvas: preservar

`stack-{1440,390,320}-{pt,en}.png` e `stack-qa.json`: opção pública mais longa
selecionada via UI. Nome/STACK/status completos no bitmap com fator1,
título38px/corpo27px nas entradas registradas; em EN320 PySpark/ETL quebra em
linha adicional, sem descarte. Legibilidade projetada é pequena e Ficha ocupa
parte da vista, mas não há evidência de regressão de layout/fontes a corrigir
nesta etapa. Placas inferiores só têm nomes por design atual; não são stacks
omitidos pelo rasterizador. Congelar tipografia/projetos conforme direção.

## Proposta pequena para autorização posterior

P0: reutilizar GLB atual, modificar SOMENTE rota/pista/composição apoiada para
janela integrada320/390, testar três momentos com HUD antes de aumentar
velocidade. Curva com aproximação/afastamento reais e rolamento das quatro
rodas pelo mesmo relógio, sem câmera nova. Duração só depois da janela útil;
encurtar sozinho agrava entrada/saída. Preservar áudio (UIworker), gates e modelo;
sem novo asset/download/dep. Custo: transformação de quatro nós/veículo, não
novos triângulos/texturas; revisão privada antes de alegar melhor passagem.

P1: eliminar coplanaridade das faixas e modelar controle com pegas/face/D-pad/
gatilhos autorais, reaproveitando materiais. Blender5.2.0 LTS local --version
confirmado; pipeline batch autoral existente viável para reaproveitar malha,
sem instalar/configurar sistema. Não reconstruir carro nem converter por rótuloGLB.
Escolher ajuste específico após revisão de pixels; custo bounded sem alvo
artificial de polígonos. Nada implementado nesta etapa; aguardar Lead.

## P0 implementado — passagem e rolamento

Reutilizado o GLB existente (166608 bytes, 13710 triângulos), sem novos assets,
texturas ou dependências. Rota curva assimétrica com aproximação profunda,
cruzamento em três quartos e afastamento; escala1.2 e pista apoiada em deck
com acesso lateral inclinado. Endpoints: (-16.8,1.55,-27.6) e
(11.2,1.55,-14.6); duração natural2.2–2.6s. Câmera, framing, UI, áudio,
projetos e Easter permanecem intactos.

Batching separado do corpo e dos quatro pivôs wheel-* do GLB. Rolamento
absoluto pelo comprimento de arco percorrido e raio de cada roda, sem
acumulação por frame; orientação original restaurada no cancelamento/fim.
Lease continua proprietário dos recursos originais; buffers de instâncias
pertencem ao registro da cena. Teste verifica quatro pivôs, geometria
compartilhada, rolamento, reversão e disposal exatamente uma vez.

DEVtrigger agora usa 2400ms e esquerda→direita quando a direção é omitida.
Override privado valida direção/duração, rejeita evento ativo e valores
inválidos, limpa no reset e após consumo. O sorteio natural continua sendo
consumido na mesma ordem. Gatilho permanece dentro de import.meta.env.DEV;
build de produção não contém drfDebugTrackside.

### Evidências e método

Raiz durável externa ao Git:
`.agent-grid/screenshots/mission-14/scene-after/` no checkout principal.
`qa.json`, `projection.json`, `gates.json` e `video-verify.json` preservam
clock/progress, câmera, contagens e verificação de decoding. Os vídeos
`garage-{1440,390,320}-{left-to-right,right-to-left}.webm` usam
canvas.captureStream/MediaRecorder; os correspondentes `-viewport.webm`
codificam screencast CDP contínuo com HUD e timestamps reais. Não são
montagens de poses ou animação offline. Início/meio/fim foram decodificados
no Chrome; duração dos vídeos canvas2.636–2.815s, viewport2.584–2.694s.

Chrome instalado headless, reduced nativo true, opção Cinemático escolhida
pela UI, áudio OFF. Gravações anteriores à correção final DEV usaram direção
fixa e duração sorteada2.2–2.6s (atividade observada aproximadamente
2436–2569ms); não foram repetidas por alteração exclusiva do gatilho.
Baseline próprio canvas-only em `scene-before/`; Lead preservou baseline
viewport completo com HUD nas três larguras, permitindo comparação integrada.

PNGs integrados `garage-{width}-{direction}-pass-{progress}.png` e frames
`decoded-garage-320-{direction}-viewport-{3,4,5}.png` mostram veículo inteiro
na janela útil em ambas as direções. Entrada/saída ainda podem cortar o
veículo. Primeiro candidato parcialmente encoberto pela placa REC foi
preservado em `candidate-left-occlusion/` e corrigido pela composição da rota.

### Medidas, QA e limites

Projeção do centro entre25–75% (não segmentação de pixels nem FPS): antes
1440/390/320 =403/207/168px/s; depois aproximadamente663/333/270px/s.
AABB projetado conservador central antes309×82/159×42/129×34px, depois
aproximadamente463×114/230×56/187×46px. AABB inclui cantos vazios durante
yaw; silhueta real mobile ocupa aproximadamente110–140×30–40px, avaliação
visual sem segmentação automática. Não afirmar visibilidade integral durante
toda a passagem: janela completa mobile é breve (teste geométrico exige
ao menos200ms), com múltiplos frames reais. Driver/Strategy olham para fora
da rota; Telemetry/Pit continuam tendo oclusões contextuais por monitores.

Contagens registradas: desktop idle91calls/67348tri, passagem105/81060;
mobile idle75/63564, passagem89/77276. Aumento de6calls somente no evento,
triângulos inalterados. Snapshot geometria/texturas73/29 desktop e60/24
mobile; sem mapas adicionais. DPR registrado1, política e MSAA preservados.
Build final SceneRoot665.05kB/gzip175.25kB; aviso existente de chunk>500kB.
Não foram medidos FPS percebido, GPU física ou telefone real.

Lint/build e65 testes core passaram após a correção DEV; seleção explícita
exclui os cinco harnesses *-ui.test.mjs (primeira tentativa indiscriminada
falhou por portas incorretas e não conta como aprovação). Smoke de produção
13 grupos passou antes do ajuste exclusivamente DEV, console/network sem
erros; evidências em `production-smoke/`. Gates dirigidos confirmaram
ambientOFF/reduced, navegação rápida, cancelamento e contextloss/retry com
GLB recarregado. Recursos após retry não cresceram; contagem menor depende
do aquecimento de uploads, não prova isoladamente ausência de todo vazamento.
Teste unitário cobre ownership/dispose. Sem aprovação subjetiva premium ou
escuta humana. P1 estojo/controle permanece pendente; encerrar neste marco.
