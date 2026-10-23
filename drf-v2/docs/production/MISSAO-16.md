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
