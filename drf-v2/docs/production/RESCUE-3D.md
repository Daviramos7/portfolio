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
