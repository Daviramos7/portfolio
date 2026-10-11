# Assets da cena DRF

### Missão10 — follow-up final de materiais

Reutilizados, sem alteração de pixels/resolução, paintedMap/paintedNormal e
metalMap/metalNormal autorais 256×256 existentes. Parede pintada clara, estrutura
escura, bancada/metal escovado, polímero fosco e pintura vermelha receberam
parâmetros distintos. Pintura passou a reutilizar normal/roughness pintados com
normalScale baixo. Nenhum mapa/material adicional, download ou nova geometria;
registro/dispose existente preservado. SHA256 de `garage/resources.ts`:
`72458fe6afb53a902156649769acb0e12dad2453fbf396fd0f45a013016f0b3f`.

## Missão10 — 10/10/2026

Remodelagem autoral em Three: aero traseiro compacto, borda de cockpit, volante,
inlet, rodas com braços curvos/chanfrados e aro usinado, bancada de montagem e
veículo externo fechado. Nenhum modelo, imagem, marca, sample ou download novo.
Licença: termos do repositório para código autoral; CC0 externo não aplicável.
Assets binários adicionais: 0 bytes. Mapas existentes 256/512 e cinco superfícies
1024×512 preservados/reutilizados. Indicadores DEMO nas cinco telas são pequenas
geometrias, sem novos mapas ou uploads Canvas por quadro; o único nó público de
Pit Wall recebe destaque de escala, sem adicionar experiências. Todos usam o
registro de recursos/dispose e o relógio/gates já existentes. Áudio silencioso.

SHA256 dos geradores desta entrega (bytes dos fontes no worktree):
- `car/DRF01.ts`: `14623cde49bc363316be58a9987eb1ec99bb7a79d2dbd1a71b310b91516cc3a9`
- `car/wheels.ts`: `ac66171d78028b6fe0492350604044d8ff7b8bc1e3f38f663f2f53fe6e40bbaf`
- `garage/programmeScreen.ts`: `85af843fc3c663daa0bafab508fccdfca16fa2fd8940a968f2d7a18373b66f99`

QA/referências: `docs/production/MISSAO-10-3D.md`; nenhuma evidência privada
ou log novo é distribuído nesta pasta pública. As notas seguintes são históricas.

## Missão09 P1 — 10/10/2026

Novos acabamentos e diagramas são autorais, gerados em Canvas/Three pelo worker
Codex para DRF Engineering. Nenhum download, asset CC0 de terceiros, sample,
executável, dependência, marca ou carro protegido foi incorporado nesta fase.
Gerador: `src/scene/garage/resources.ts`; quatro campos determinísticos 256×256
(twill de carbono, escovação direcional, borracha moldada e pintura industrial),
normais derivadas e roughness compartilhadas pelos materiais. O piso C2 foi
preservado. Pintura do carro usa clearcoat controlado; armários usam polímero.

`src/scene/garage/programmeScreen.ts` gera cinco CanvasTexture 1024×512 com
diagramas originais. Textos são strings Localized públicas do SceneIndex do Lead,
sem catálogo/API importados pela cena. Fonte local do sistema; sem fonte remota.
Cada textura redesenha somente na mudança da apresentação/idioma/projeto.
Animação visual limitada ao ventilador e ao marcador DEMO da telemetria, no
relógio comum e com gates; demais telas são estáticas. Texturas, materiais e
geometrias passam pelo registro existente de dispose. A faixa clara do veículo
de pista é geometria autoral, sem textura ou logo externo.

CAR_PASS está funcional desde D/P0; os parágrafos históricos abaixo que dizem
“futuro/inativo” pertencem às rodadas anteriores. Áudio atual permanece silencioso
e unavailable; fontes de áudio licenciadas/qualidade de escuta seguem pendentes.
Licença externa/URL/hash de download: não aplicáveis, pois não houve download.
QA, capturas e medições desta fase ficam em `docs/production/RESCUE-3D.md`,
sem logs ou caminhos privados nos assets distribuídos.

Marco C de 09/10/2026: ver [NIGHT-C.md](NIGHT-C.md) para a revisão de materiais,
correção de oclusão, enquadramentos de programas e medidas atuais. As medidas
de 08/10 abaixo pertencem à rodada visual anterior.

Todos os modelos, sinais e materiais desta entrega são procedurais, escritos em
`src/scene/` para DRF Engineering por Codex, a pedido de Davi Ramos Ferreira.
Não há GLB, imagem, fonte remota, som, marca ou modelo de terceiros incorporado.
O DRF-01 e a equipe são fictícios; a geometria é original e provisória.
As texturas dos sinais são geradas localmente com Canvas 2D e fonte do sistema.
Piso, carbono, metal e borracha usam mapas procedurais próprios de 256×256,
com ruído determinístico. O environment é um estúdio geométrico próprio,
capturado uma vez por PMREM; nenhum HDR de terceiros é utilizado.
A ponte é uma abstração geométrica própria da referência local de Recife.
Uso e edição concedidos ao projeto DRF Engineering, sem restrições adicionais
introduzidas por esta entrega; nenhuma licença externa de asset é necessária.

Funcional: garagem, carro, pista estática, cinco câmeras, navegação HTML e políticas
de WebGL/qualidade/movimento. Preparação Trackside: rota, vehicleId, progresso e
envelope puros, gate de estado, âncoras e restauração de transformações. Não há
scheduler CAR_PASS, carro em passagem, reflexo dinâmico, vibração ou áudio ativo.
O scheduler futuro deve compartilhar o timestamp do único RAF do renderer; ao
ativar eventos precisará solicitar quadros até o fim/cancelamento e restaurar as
âncoras. Não adicionar timers por efeito. `SceneHandle` retorna áudio unavailable
e mute é idempotente, sem criar AudioContext.

Rodada visual sobre a base integrada 756db51567ea3341bf1bd50c3624579bfc4334ae:
interior fechado, teto/treliças/dutos, oficina e apoio exterior estáticos;
DRF-01 com superfícies curvas, pneus arredondados, rodas, cockpit e asas próprias.
Ventilador e varredura decorativa funcionam no único relógio RAF, com ambiente
pausado por painel, movimento reduzido ou página oculta. Câmera continua durante
leitura; ocultação pausa/rebaseia o relógio; cancelamentos partem da pose atual.
O blockout técnico anterior permanece no histórico Git.

Medição desta rodada em 08/10/2026: Chrome headless 155.0.8059.39, Windows,
ANGLE/D3D11 NVIDIA RTX 3060; viewport 1440×900, DPR emulado 2 limitado a 1,5,
balanced, MSAA. Percurso 30 s, cinco câmeras repetidas duas vezes: 3.202 intervalos
entre frames renderizados, mediana 6,9 ms e p95 7,2 ms; pausas ociosas excluídas.
Polling pode incluir frames de ambiente ao fim de cada percurso. Não é tempo GPU.
Vista Garage: 61 draw calls, 45.392 triângulos, 39 geometrias e 17 texturas
(contadores do passe principal, sem contabilizar o passe de sombra).
Sem CAR_PASS; não é medição de GPU mobile nem aceite de performance integrado.
Emulação 390×844/320×844: DPR low 1, sem overflow; sem aparelho físico testado.
Build local: JS inicial 82,14 kB gzip; cena lazy 152,31 kB gzip, nenhum asset 3D
externo transferido. Há aviso Vite pelo chunk 3D >500 kB minificado; a divisão
lazy já está presente. Câmeras PT/EN, teclado/toque, painel, cancelamento,
ocultação, movimento reduzido, contexto perdido/retry e ausência de WebGL foram
verificados no preview. Três ciclos de montagem mantiveram contagens estáveis;
não foi feito profiling de heap/GPU nem teste prolongado de vazamento.
UI/HUD final e scheduler/áudio Trackside dependem da integração posterior.
As capturas full-viewport usam fixture CSS temporária externa ao repositório,
pois esta UI ainda é a primeira interface. O Lead deve compor SceneRoot no slot
.drf-immersive-stage/.drf-visual, sem margem, com menu principal no HUD e retry
no boundary. A cena possui somente pequenos hotspots ancorados aos objetos.
Os sinais consomem somente rótulos do índice; displays decorativos não são dados.
Limite do worktree: Vite dev retorna 403 para Geist via junction fora da allow
list; configuração é do Lead. No preview do build, Geist carregou e não houve
erros de console/rede. O driver emitiu aviso X4122 de precisão no shader PMREM
do Three. Nenhum arquivo de configuração foi alterado.


## C2 — superfícies e luz autorais, 09/10/2026

Piso epóxi gerado em `src/scene/garage/floorSurface.ts`: albedo, roughness e
altura 512×512, normal derivada 512×512. Noise determinístico em escala da sala,
marcas de pneus no acesso à baia e abrasão localizada de manutenção. Sombra de
contato radial original 128×128 em Garage.ts. Carbono/borracha/metal mantêm seus
mapas procedurais originais 256×256. Tudo é produzido em Canvas pelo código
DRF, sem fotografias, downloads, modelos externos ou licença CC0 atribuída.
Aplicam-se os termos do próprio repositório; nenhuma licença de terceiros nova.
SHA256 do gerador de piso desta entrega:
`fd80e00887ea1fd944d730b960c7b100f21f1192c6e60c8ed0912294dbd83d83`.
As texturas e materiais entram no registro existente de dispose. Não há
requisições de assets adicionais; QA desta rodada em docs/production/SCENE-C2.md
no repositório (fora dos assets distribuídos).
## Missão 11 — suportes mecânicos autorais

Suportes cilíndricos e juntas esféricas originais em `src/scene/car/wheels.ts`,
com geometrias compartilhadas e material metálico já existente. Sem novos mapas,
downloads ou assets de terceiros. Registro/dispose existente preservado.
Aplicam-se os termos do repositório; nenhuma licença externa nova.
## Missão 12 — gravações de áudio CC0

Arquivos locais sanitizados em `audio/`, obtidos em 2026-10-10 dos previews MP3
públicos oferecidos nas próprias páginas do Freesound. Sem login ou bypass;
originais WAV/FLAC/AIFF não foram baixados. Não são sons sintetizados pelo DRF.
Licença dos três: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/),
verificada individualmente nas páginas dos autores abaixo. Créditos preservados
mesmo sem exigência de atribuição. MP3 distribuídos sem alteração; recorte/fade apenas
em memória WebAudio após consentimento. Escuta humana/qualidade artística pendentes.

| Arquivo | Autor / fonte oficial | Preview público | Bytes | SHA256 |
|---|---|---|---:|---|
| `audio/ventilation.mp3` | morosopher, [Hotel room ventilator](https://freesound.org/people/morosopher/sounds/185992/) | https://cdn.freesound.org/previews/185/185992_3226149-lq.mp3 | 875232 | `3704b5c38f8ea94b5ba209ae8039dded71e73a24a92b197380e09a4a8c83acbc` |
| `audio/workshop.mp3` | SoundDesigner0101, [Workshop ambience](https://freesound.org/people/SoundDesigner0101/sounds/766013/) | https://cdn.freesound.org/previews/766/766013_15695818-lq.mp3 | 1074600 | `90e490033aab4dec6d0d775a02ee7761dd66ff7bb233124de67a21a7092f2de9` |
| `audio/car-pass.mp3` | Johnnyfarmer, [Car Passing](https://freesound.org/people/Johnnyfarmer/sounds/209767/) | https://cdn.freesound.org/previews/209/209767_2012390-lq.mp3 | 36744 | `5a8b2b35d4bdc5840cc7548ddae217b8c9765a138f3cc1546290c7f3fe00b4ca` |
## Missão 12 — monoposto de pista original

`src/scene/trackside/TrackCar.ts` gera o DRF-track-02 autoral: seções de carroceria,
cockpit aberto, aero compacta, rodas de torno com duas faces e suspensão exposta.
Rampa/pista em TrackOpening.ts e trajeto analítico em preparation.ts são autorais.
Sem GLB, fotografia, marca, personagem, arquivo de modelo externo ou nova textura.
Reutiliza materiais/mapas existentes e registro de dispose; termos do repositório.

## Missão 12 — cinco detalhes pessoais autorais

Fonte: `src/scene/garage/personalDetails.ts`, autoria desta implementação DRF.
Placa REC/PE com ponte/ondas inventadas; estojo vermelho/branco/preto; cartão
observar/testar/iterar com esboço científico DEMO; controle abstrato 360; handgrip
com inscrição constância. Geometrias e desenhos Canvas originais, sob os termos
do repositório, sem arquivos baixados, logos, escudos, personagens ou modelos
oficiais. As alusões não constituem fatos profissionais ou afirmações de rotina.
Um atlas Canvas 512×512 gerado em memória, quatro tiles 256×256; materiais
existentes compartilhados. Sem áudio, fonte nova ou asset binário adicional.
Upload inicial e somente quando o idioma muda; dispose pelo registro Resources.

## Missão 13 — DRF Sprint 03 autoral

Asset `models/drf-sprint-03.glb`: 166.608 bytes; SHA-256
`0c4f3052e87ad8e6e84f3677b8391588e581af55261ba27430c0555bc9bc53ec`.
Fonte integral: `src/scene/tooling/build_track_model.py`, criação autoral desta
implementação DRF em Blender 5.2.0 LTS batch. Sem conversão do modelo anterior,
download, marca, modelo oficial ou textura externa. Uso sob os termos do
repositório; não atribuído a CC0. Monocoque, cockpit, sidepods, asas perfiladas,
suspensão e rodas construídos neste script. Cinco materiais; 13.710 triângulos
por veículo, incluindo quatro rodas com geometria compartilhada. Sem imagens
embutidas; a cena reutiliza seus materiais existentes. Studio/luzes/câmera de
revisão não são exportados. Fallback procedural anterior preservado.

## Missão 13 P1 — cinco detalhes autorais refinados

Fonte `src/scene/garage/personalDetails.ts`: carcaça360 com pegas curvas,
estojo de cantos arredondados/tampa/alça/fechos, suporte REC/PE, cartão e
handgrip. Cinco famílias originais,2.344 triângulos; atlas Canvas512×512
existente compartilhado. Sem modelo/logo/sample/download ou asset novo.
RoundedBoxGeometry é helper da Three instalada, não asset de terceiros.
Barlow Condensed700 e Geist Variable existentes são carregadas pelos nomes
CSS locais; arquivos/licenças das fontes não foram alterados. Meshes/mapas
continuam sob dispose de Resources. Termos do repositório; sem atribuição CC0.

## Missão 14 P1 — estojo e gamepad

Fonte autoral `src/scene/garage/gamepad.ts` e montagem em `personalDetails.ts`.
Controle de carcaça/pegas curvas, caps côncavos e controles sem marcas, letras
oficiais ou modelo comercial copiado. Geometria procedural original; helpers
Three instalados. Estojo com faixas geometricamente afastadas do corpo.
Reutiliza materiais e atlas512 existentes, sem novo mapa/arquivo/download.
Cinco detalhes totalizam4256 triângulos nesta versão; controle2750. Recursos
compartilhados pertencem a Resources/dispose. Termos do repositório; não CC0.
REC/PE, science e handgrip e seus textos originais permanecem inalterados.
