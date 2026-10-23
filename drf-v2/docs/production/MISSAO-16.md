# Missão 16 — Art Direction Reboot (relatório por fase)

Briefing: `MISSAO-16-BRIEFING.md`. Branch `feat/drf-engineering`. Sem push, sem deploy.

## Fase 0 — preparação

- Base conferida: HEAD `fc8afd3`, checkout limpo; 4 worktrees em `.agent-grid\worktrees\` preservadas.
- Skills: `CloudAI-X/threejs-skills` (MIT, commit `0e18186`, escrita para three r186) auditada arquivo por
  arquivo (só markdown, sem script/hook/`allowed-tools`). Instaladas só no projeto, das cópias auditadas
  (blob SHA igual ao do commit): `threejs-fundamentals`, `-textures`, `-materials`, `-lighting`, `-geometry`,
  `-loaders`, `-asset-pipeline`, `-performance`. Fora: `-react-three-fiber` (sem R3F), GSAP (adiado: `gsap` e
  `framer-motion` estão no `package.json` mas não são importados no `src`).
- `.gitignore` novo na raiz com `.claude/skills/`; `CLAUDE.md` enxuto (4,6 KB) aprovado pelo Davi.
- Commit `28329ef`.

## Fase 1 — telas nítidas

### Diagnóstico (números)

Metodologia: `measure-screens.mjs` monta a garagem real em Node (mesmo stub dos testes), projeta os quatro cantos
de cada tela (`programme-screen-*`, 1024×512) e placa (1024×256) com as framings aprovadas e as regras de
`resize()` (fov 43 desktop / 63 em 390×844; DPR `balanced` ≤ 1,5, `low` = 1 em ≤ 820 px). Texel/px = largura da
textura ÷ largura projetada em pixels do framebuffer. Geometria, sem oclusão por HUD.

| Vista | Tela | px na tela (CSS) | texel/px | ângulo |
| --- | --- | --- | --- | --- |
| 1440, estação | telemetry / pit-wall | 562×312 | 1,82 (DPR 1) · 1,22 (DPR 1,5) | 26° |
| 1440, estação | strategy-room | 705×416 | 1,45 · 0,97 | 29° |
| 1440, programa | garage | 494×282 | 2,07 · 1,38 | 29° |
| 1440, hero | driver-profile / garage | 325×148 / 148×90 | 3,15 / 6,94 | 22° / 38° |
| 390, estação | telemetry / pit-wall | 265×139 | 3,87 (DPR 1) | 18° |
| 390, estação | strategy-room | 339×190 | 3,02 | 22° |

Tabela completa (87 linhas): `.agent-grid\screenshots\mission-16\harness\measure-before.json`.

Conclusões:
1. **Não há magnificação**: em todas as vistas cada pixel recebe ≥ 1 texel. Textura maior **não** ajuda: o
   mipmap escolhe o nível pela densidade na tela, então 2048 cairia no mesmo nível efetivo que 1024.
2. A suavidade vem do filtro trilinear em minificação (1,5–4 texels/px mistura os níveis 1024 e 512) e, nas
   vistas oblíquas (38–55°), da falta de anisotropia (`anisotropy` = 1 em todas as texturas).
3. **No mobile a causa dominante é o DPR**: a política `low` fixa DPR 1; num telefone DSF 3 o canvas de 390 px é
   esticado 3×. O HUD (DOM) fica nítido e o 3D inteiro, inclusive as telas, fica borrado. O corpo do texto da
   tela sai com ~6 px CSS de altura.
4. GPU de captura: ANGLE/D3D11 RTX 3060, `MAX_TEXTURE_MAX_ANISOTROPY` 16. Fontes Barlow Condensed e Geist
   carregadas antes do desenho (`document.fonts.check` true; redesenho via `onFontsReady` já existia).

### Correção aplicada (menor que ataca a causa medida)

- `resources.ts`: `textTexture()` registra texturas de texto e `setTextAnisotropy()` aplica o nível.
- `garageRenderer.ts`: antes de construir a garagem, `min(8, renderer.capabilities.getMaxAnisotropy())`;
  exposto em `data-scene-text-anisotropy`.
- Aplicado a telas de programa, placas (`sign`) e atlas dos cartões pessoais. Texturas de material (piso,
  carbono, metal) ficam como estavam.
- troika-three-text **não** adicionado: 843 KB desempacotado + 4 dependências e reescrita do layout em canvas,
  e não resolve o problema do DPR mobile.

### Resultado medido

Capturas: Chrome instalado headless, CDP, movimento reduzido (câmera direto no enquadramento final), 6 vistas
(5 estações + programa) × PT/EN × 1440×900 DSF 1 e 390×844 DSF 3 = 24 por rodada. Energia de borda (FIND_EDGES²)
na região alterada: desktop +1 a +19% (strategy +18%, programa +11%, telemetry +7%, driver-profile +6%,
hero +3%, pit-wall +1%); mobile entre −4% e +21%, dentro do ruído do cursor animado. **Ganho real, mas pequeno: não
resolve o mobile.**

Experimento **não aplicado** (revertido, fora do commit): DPR `low` = 2. As telas do mobile ficam legíveis
(recorte `phase1-compare\390-pt-telemetry-before-aniso-dpr2.png`). Custo: 4× pixels por quadro no mobile
(329 mil → 1,32 milhão); FPS em telefone real **não medido**. O smoke atual exige DPR mobile ≤ 1. Decisão do Davi.

### Validação

- `npm run lint` OK; `npm run build` OK (SceneRoot 669,72 kB / gzip 176,95 kB; alerta > 500 kB conhecido).
- `node --test tests/*.test.mjs`: 82/82 (2 novos em `text-sharpness.test.mjs`; mocks de `art-direction` e
  `rescue-3d` ganharam `textTexture`). Testes de navegador contra `vite preview` em 5175.
- Smoke integrado (`browser-smoke.mjs`, preview 5175): 13 grupos PASS, console/rede sem erros;
  hero 91 draw calls / 67.334 triângulos (iguais à M15); DPR 1,5 desktop, 1 mobile.

### Evidência

- Galeria: `C:\Users\davir\OneDrive\Documentos\GitHub\portfolio\.agent-grid\screenshots\mission-16\phase1-index.html`
- Antes / depois / experimento: `...\mission-16\phase1-before\`, `phase1-after-aniso\`,
  `phase1-experiment-mobile-dpr2\` (só 390); smoke em `phase1-smoke\`; scripts em `harness\`.

### Limites

- Sem telefone físico, sem FPS. Desktop capturado a DPR 1 (a política permite até 1,5 em telas HiDPI).
- O marcador de hotspot "02" cobre o título/linha da tela de telemetria em 1440 e 390. É composição de UI,
  fora desta fase; registrado como pendência.
- Qualidade técnica não é aprovação visual.

Aprovação do Davi: pendente.

### Fase 1b — D11: DPR 1,5 no modo `low` com degradação automática (23/10/2026)

Decisão do Davi (D11, `M16-REFERENCIAS.md`): DPR 1,5 no `low`, cai para 1 quando o frame time sustentado piora,
sem oscilar. Missão vinda da fila (`_fila\01-m16-fases-1-2-3.md`).

**O que mudou**
- `src\scene\dprGovernor.ts` (novo, puro e testável): `low` e `balanced` com teto 1,5 (sempre ≤ `devicePixelRatio`).
  Só o `low` adapta. Sinal: intervalo entre RAFs consecutivos (só com o loop rodando direto), suavizado por EWMA
  (α = 0,1); amostras > 250 ms (GC, troca de aba) são descartadas.
- Limites documentados no código (`dprPolicy`): **cai** para 1 após 2 s com média > 25 ms (< 40 fps);
  **volta** para 1,5 só após 10 s com média < 18 ms (> 55 fps). Entre 18 e 25 ms não muda nada (histerese).
  **Segunda degradação trava DPR 1 na sessão** (estado `latched`): no máximo uma volta, nunca vai-e-volta.
- Loop parado, aba oculta, resize ou troca de qualidade zeram a média (sem herdar tendência), sem desfazer a queda.
- `garageRenderer.ts`: `resize()` usa o governador; `render()` amostra e chama `resize()` na troca.
  Novo `data-scene-dpr-state` (`full` / `degraded` / `latched`) para diagnóstico.
- `tests\browser-smoke.mjs`: a asserção antiga "DPR mobile ≤ 1" virou "1,5 ou 1 (D11)"; o registro de medida
  agora lê o DPR real em vez de escrever `1` fixo.

**Antes/depois** (Chrome headless, ANGLE D3D11 na RTX 3060; `prefers-reduced-motion: no-preference`)

| Enquadramento | Antes: DPR / canvas | Depois: DPR / canvas |
| --- | --- | --- |
| 1440×900 @1x (balanced) | 1 / 1440×900 | 1 / 1440×900 (igual) |
| 1440×900 @2x (balanced) | 1,5 / 2160×1350 | 1,5 / 2160×1350 (igual) |
| 390×844 @3x (low) | 1 / 390×844 | **1,5 / 585×1266** |
| 320×844 @3x (low) | 1 / 320×844 | **1,5 / 480×1266** |

Custo no mobile: 2,25× pixels por quadro (329 mil → 741 mil a 390). Visualmente as placas (REC / PE,
GARAGEM / PROJETOS, telas) ficam mais nítidas (recorte lado a lado `compare-390-top.png`).

**Degradação medida no navegador real** (390 @3x, 20 s por linha, amostra de 1 em 1 s, throttle de CPU do CDP):

| CPU | Quadros renderizados em 20 s | Estado |
| --- | --- | --- |
| 1× | 575 (~29 fps, teto de 30 fps do ambiente) | `full` 1,5 o tempo todo |
| 6× | 579 | `full` 1,5 o tempo todo |
| 30× | 87 (~4 fps) | `full` até 3 s → `degraded` 1 aos 4 s, ficou em 1 até o fim (sem oscilar) |

Metodologia: throttle de CPU emulado em desktop, **não é telefone físico**; fps = quadros renderizados ÷ tempo,
não FPS de GPU. FPS em celular real continua **não medido**.

**Validação**
- `npm run lint` OK; `npm run build` OK (alerta de chunk > 500 kB conhecido).
- `node --test tests/*.test.mjs`: **89/89** (novo `dpr-governor.test.mjs`, 7 testes: teto, pico curto não
  derruba, queda sustentada derruba, histerese, trava na 2ª queda, `balanced` não adapta, `interrupt`).
  Testes de navegador contra `vite preview` em 5175 (sem o preview, os 5 de UI falham por conexão, já na base).
- `browser-smoke.mjs` (preview 5175): exit 0, console/rede sem erros; mobile 390/320 registrado com DPR 1,5.

**Evidência**: `C:\Users\davir\OneDrive\Documentos\GitHub\portfolio\.agent-grid\screenshots\mission-16\fase1-dpr\`
(`before-*.png`, `after-*.png`, `compare-390-top.png`, `before-report.json`, `after-report.json` com a linha do
tempo, `browser-smoke.txt`, `smoke\`). Build da base em `.agent-grid\m16-dpr-before-dist\`.

**Limites**: sem telefone físico; o limiar de 25 ms foi escolhido por raciocínio (abaixo de 40 fps), não calibrado
em aparelho. Tela de 30 Hz cairia para 1 (raro; documentado). Câmera, trajetórias e cota da M15 intocadas.

Aprovação do Davi: pendente.

## Fase 2 — referências: **decidida** (Davi, 23/10/2026, 12h57)

- `docs\design\M16-REFERENCIAS.md` (pesquisa + decisões D1–D12 na seção "Decisões registradas") e
  `docs\design\M16-PROMPTS-CONCEITO.md` versionados como o Davi entregou, sem edição.
- Direções escolhidas: D1 B (sala de vidro sobre o pit), D2 B (horizonte de Recife fictício), D3 A→B (3–5 carros,
  8–12 se o desempenho medido permitir), D4 B (preto fosco + faixa vermelha e branca), D5 B (silhueta limpa),
  D6 sim (flaps na Telemetry ≤ 400 ms), D7 (conceito gerado localmente, foto da internet só como estudo),
  D8 sim (inventário antes de baixar), D9 sim (crédito de IA), D10 A (luz assada + HDRI CC0), D11 (Fase 1b acima),
  D12 sim (nota "sem vínculo com F1/FIA/equipes").
- Impacto registrado no próprio documento: a cota da M15 (`y=-0,007`) só deixa de valer depois do desenho da Fase 4
  aprovado; cada trajetória de câmera nova precisa de aprovação do Davi.
