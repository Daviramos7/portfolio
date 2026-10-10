# Rescue 09 — P0 3D

Base de implementação: `a1b97c5`, branch `feat/drf-engineering-3d`. Diagnóstico inicial/capturas anteriores em `7712287`; o fast-forward intermediário preservou a cena. Sem alteração de contratos, conteúdo, UI ou preferências do sistema.

## Causas verificadas e correções

- Chrome instalado, primeira inspeção com janela e sem emulação: `matchMedia(reduce) = true`. Enquadramento direto era o ramo de acessibilidade legítimo. Não se atribuiu esse resultado a defeito da curva.
- Rodas: aro aberto e faces incompletas; braços convergiam para dentro do pneu. Novo conjunto original compartilhado para quatro rodas: perfil fechado, disco, cubos, porca, raios nas duas faces, manga e spindle; braços terminam antes do envelope interno do pneu. Extrusão dos raios centrada para espessura simétrica.
- Hotspot: `width:auto` absoluto dentro de botão de 44 px, herdando `overflow-wrap:anywhere`. Reproduzido “Telemetria” em coluna, largura 33 px / altura 136 px no mobile. Agora largura explícita 135 px mobile / 190 px desktop, quebra por palavra e offset limitado ao viewport. Foco de teclado e hover PT/EN: 320, 390, 1440 px, sem coluna de letras.
- Trackside: intervalo inicial longo e rota distante contribuíam para percepção de ausência; reduced bloqueia visual corretamente. Renderer injeta primeiro intervalo 5–8 s, posteriores 25–45 s. Rota externa encurtada para x ±9, z −7.5. Movimento permanece independente do áudio; um ativo, cancelamento/restauração preservados.
- Hum tonal removido. Pedido de áudio retorna `unavailable`, mute/setter/dispose seguros, nenhum AudioContext criado. Silêncio autorizado; não se anuncia áudio realista.

## Evidências executadas

Raiz durável das capturas (fora de public e do código):
`C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/rescue-09/3d-p0/`

- `index.html`: visor local de frames reais e comparação geométrica. `before/` e `after/`: frontal, traseira, lateral, 3/4 e quatro closes, mesmas poses/resolução 1200×800, fixture temporária externa ao repo.
- `after/validation.json` + `travel-000..059.jpg`: Chrome instalado headless, emulação **anotada** no-preference, sequência 01→02→03→04→05→01. Poses intermediárias em todas as viagens, sequências finais 1..5; percurso existente preservado. A gravação anterior com janela teve stalls de visibilidade e não serve como aprovação de movimento.
- `after/interactions.json` + nove frames: cliques rápidos, chegada da intenção mais recente, passagem com áudio off e cancelamento ao abrir leitura.
- `after/pass-000..014.jpg` e `pass-mobile-000..011.jpg`: carro externo renderizado, transforms/progresso registrados. Primeira passagem observada no relógio 5350 ms, deadline ~5274 ms; cancelamento reduced restaura posição/visual.
- `after/idle-native.json`, `idle-native-ui-320.png`, `idle-native-scene-320.png`: sem EmulatedMedia, preferência nativa reduce=true, após 15 s idle, garagem visível tanto no preview UI 5175 quanto 3D 5174, zero erros. Preto reportado por outro harness não reproduzido por Page.captureScreenshot; `ready` sozinho não foi considerado prova visual. Não foi mudado preserveDrawingBuffer nem mantido RAF infinito para mascarar captura.
- `after/labels.json` + foco/hover PT/EN: largura 135/190, altura ~33/35, rótulo visível dentro do viewport.
- `after/dev-seam.json`: Vite DEV real em fixture externa, trigger aceito quando elegível, bloqueado reduced/painel e removido no dispose. `canvas.drfDebugTrackside.trigger()` existe só em DEV; ausente no canvas/bundle de produção.
- `after/audio.json`: UI inicialmente off, volume .25; gesto informa Indisponível, aria-pressed=false, zero AudioContexts, zero erros.
- `smoke/smoke-result.json`: smoke principal **não alterado**, aprovado. Inclui raycast/hotspot, painel sem snap, latest-wins, hide/resume, histórico/teclado, Recruiter, PT/EN, mobile 390/320, WebGL loss/retry/fallback. Console e rede sem erros.

## Verificações e custos

`npm run lint`, `npm run build`, `node --test tests/foundation.test.mjs tests/trackside.test.mjs tests/rescue-3d.test.mjs`: **25/25** (15 fundação, 6 Trackside, 4 Rescue). `git diff --check` passou.

Desktop balanced 1440×900: 68 draw calls / 48.632 triângulos, DPR 1.5, ANGLE NVIDIA RTX 3060. Passagem capturada: 76 / 49.162. Mobile low estático: 59 / 45.818, DPR 1. Bundle lazy cena: 604.11 kB minificado / 156.53 kB gzip; inicial: 92.38 kB gzip. Warning de chunk >500 kB permanece. Medidas são snapshots, não FPS, pico de memória ou benchmark físico.

Todos os novos elementos são geometria procedural autoral; nenhum asset externo, sample, marca ou modelo protegido foi adicionado. Geometrias/materiais compartilhados e dispose continuam no gestor de recursos.

## Limites e integração

Estética ainda estilizada. Carro da pista permanece simples, parcialmente ocluído pelo hero no mobile; visibilidade demonstrada não significa acabamento final. Aliasing low, performance/temperatura física mobile e áudio em hardware não medidos. Avisos de precisão shader/instâncias Three surgiram apenas na fixture DEV externa; produção sem console errors.

UI nova não foi editada nem integrada por este worker; inspeção read-only do preview dela confirmou frame reduced. Controle explícito de movimento pertence ao Lead/UI. Câmera continua consumindo somente reducedMotion efetivo. P1/telas/material overhaul não iniciado; conteúdo aprovado adicional exigiria seam do SceneIndex pelo Lead, sem inventar fatos.

## P1 — materiais e estações, 10/10/2026

Base `fc70d9c705582b2896197e3658db2ec46ad191ca`, mesma branch isolada. P1 consome o seam opcional screenLines sem alterar contratos, adaptador, conteúdo ou UI. Sem sync de main durante alterações.

**Decisões e comparação:** paredes/teto agora têm acabamento de metal pintado; treliças metal estrutural; bancadas metal escovado; armários/cases polímero; suspensão/asa carbono twill; pneus borracha moldada. Pintura DRF-01 com reflexo/clearcoat controlado. Mapas próprios 256² determinísticos com campos distintos (yarn, escovação, microrelevo de pintura e borracha), compartilhados; não houve pesquisa/download de assets. Piso e iluminação C2 preservados. Ajuste limitado de escovação e reflexo após captura draft evitou brilho excessivo, sem rodada infinita de arte. Quatro cabeças de chaves funcionais substituem parte das hastes genéricas.

**Cinco telas:** Garage — diagrama original do DRF-01 e programa selecionado/tech/status; Telemetry — curvas DEMO com “Demonstração ambiental” e strings de auditoria **local**, condições na leitura; Pit Wall — registros de experiências públicas, sem datas inventadas e nós conforme strings disponíveis; Driver — identidade/local/formação; Strategy — interesses documentados, sem roadmap. Rótulos/dados vêm exclusivamente de index.screenLines; ausência do seam mantém diagrama e convite à leitura. As telas são 1024×512, com cache por apresentação: atualização imediata em seleção/idioma, nenhuma repintura periódica. Animações implementadas: **somente fan + marcador de telemetria DEMO**, com frustum point gate e ambient/reduced/visible/panel gates existentes. Não declarar todas as telas animadas. Nada de áudio novo; unavailable/silêncio preservado.

**Trackside:** rota mudou do apron z −7.5 para a faixa de pista existente z −11, x ±8, sem atravessar paredes. Veículo ganhou faixa clara autoral para contraste com a cerca. Frames mobile mostram passagem mais alta no recorte exterior; parte continua ocluída pelo hero. Câmera validada não foi modificada.

**Capturas duráveis:**
`C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/rescue-09/3d-p1/`

- `before/zone-{1..5}-{1440,390}.png` e `after/zone-{1..5}-{1440,390}.png`: mesmos enquadramentos, resoluções 1440×900 / 390×844, DPR 1, PT, reduzido nativo, sem hotspot label. Hero/carro/paredes/teto/bancadas e cinco telas comparáveis. Pit Wall final mobile atualizado para o único registro público recebido.
- `after/native-validation.json`, `native-system-desktop.png`, `explicit-cinematic-choice.png` e `native-travel-000..044.jpg`: Chrome instalado headless, **nenhum EmulatedMedia**, media nativo reduce=true, escolha explícita Cinematic pela UI via CDP pointer. Viagens 01→02→03→04→05→01 com poses intermediárias e assentamento de sequências 1..5; áudio off. `native-pass-desktop.png` mostra passagem real.
- `after/final-captures.json` e `native-pass-mobile-000..021.jpg`: preferência nativa reduzida, escolha UI cinematic, áudio off, frames de passagem mobile com a rota/faixa final. `selected-project-en.png`: strings de projeto/idioma atualizadas. `wheel-{front,rear}-{left,right}.png`: quatro rodas finais, fixture externa 1200×800.
- `before/pass-*.jpg` vs `after/pass-*.jpg`: comparação dirigida de rota mobile com media emulado no-preference, explicitamente separada da evidência final **nativa/UI**; material no before de rota já era draft P1, não confundir com before completo do hero.
- `smoke/smoke-result.json`: smoke principal inalterado PASS (13 grupos), console/rede sem erros, WebGL/retry/keyboard/PT-EN/history/recruiter/cancel/pause/mobile. Executado no bundle P1 antes da última correção gráfica do número de nós Pit Wall; correção final coberta por build/lint/testes e captura dirigida, sem repetir toda a varredura.

**Medição real 30 s:** Chrome headless/ANGLE NVIDIA RTX 3060, desktop 1440×900, DPR emulado 2 limitado a 1.5 balanced; estação Telemetry, ambiente ligado e Trackside elegível. A passagem foi capturada separadamente; não se assume evento ativo durante esta janela. Contador incrementa somente após renderer.render, timestamp é o RAF daquele render, não duração CPU/GPU. 864 renders em 30.002,6 ms = **28,80 renders/s**; mediana/p95 dos intervalos registrados **34,7 / 34,8 ms**, zero lacunas entre contadores amostrados. Cap de ambiente existente aproxima 30, sem promessa de 60. Versões de textura das telas **15→15** durante 30 s; ambiente off contador **3154→3154** após 1,2 s idle. Reduced volta a quadro estático e cancela passagem. Fonte completa em native-validation.json.

Hero balanced: **75 calls / 48.240 triângulos**, contra P0 68 / 48.632; 28 texturas no primeiro frame e 31 após explorar estações/passagem. Mais materiais/telas, menos decoração geométrica dos monitores. Cinco canvases representam ~10 MiB RGBA base (~13,3 MiB com mipmaps), estimativa por dimensões, não medição de memória GPU. Lazy scene final **608,65 kB min / 158,29 kB gzip** (antes 156,53 gzip); inicial 93,24 gzip. Warning >500 kB permanece. Low DPR 1 / balanced ≤1.5 preservados.

`npm run lint`, `npm run build`, `node --test tests/foundation.test.mjs tests/trackside.test.mjs tests/rescue-3d.test.mjs`: **28/28** (16 fundação + 6 Trackside + 6 Rescue). Novos testes verificam fonte/idioma/seleção/fallback e ausência de uploads repetidos. `git diff --check` passou. Recursos novos registrados no gestor de dispose; sem render target dinâmico, loader remoto ou dependência.

**Limites:** resultado permanece estilizado, não overhaul fotorealista. Monitores reduzidos no hero/mobile exigem leitura HTML para detalhes; aliasing low e oclusão parcial da passagem permanecem. Sem benchmark físico mobile, pico GPU/memória, escuta física ou fonte sonora licenciada. Lead integra e revalida no main mais novo; nenhum P2/refinamento adicional iniciado.
