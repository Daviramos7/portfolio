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

## Fase 3 — passo 1: inventário da IA 3D (sem baixar nada, 23/10/2026)

Fontes: API pública do Hugging Face (`/api/models/<repo>?blobs=true`, tamanho real de cada arquivo), README/LICENSE
de cada repo no HF e no GitHub, lidos em 23/10/2026. **Nenhum peso foi baixado.** Máquina conferida só por leitura.

| Modelo | Licença (texto conferido) | Pesos necessários | VRAM (fonte) | Windows sem admin |
| --- | --- | --- | --- | --- |
| **Hunyuan3D 2.1** — só forma | Tencent Hunyuan Community: **não vale na UE, Reino Unido e Coreia do Sul**; 5.c proíbe "use, reproduce, modify, distribute, **or display** … Output … outside the Territory"; teto 1 mi MAU; AUP item 12: conteúdo público precisa dizer que é gerado por máquina | DiT 7,37 + VAE 0,66 + DINOv2-large 1,22 (Apache) + rembg/u2net ~0,18 ≈ **9,4 GB** (repo inteiro 14,9 GB com textura) | 10 GB forma, 21 GB textura (README oficial) | Suportado (README: Windows, Python 3.10, torch 2.5.1+cu124). Só forma não exige compilar. `requirements` puxa `bpy==4.0`, `open3d`, `cupy` |
| **TripoSG** | MIT | 7,95 GB + RMBG-1.4 0,18 ≈ **8,1 GB** | > 8 GB (model card) | Python 3.10 (pina `numpy==1.22.3`). Depende de `diso` (extensão CUDA): **precisa compilar** → CUDA Toolkit + MSVC C++, que **não estão instalados** |
| **Pixal3D** (main, base TRELLIS.2) — low-VRAM | MIT | pipeline 1 imagem: 24,1 GB (só forma ~17,6) + DINOv3 ViT-L 1,21 + RMBG-2.0 0,88 ≈ **26,2 GB** (repo inteiro 46 GB) | **sem número oficial**; low-VRAM carrega sob demanda a 1024; TRELLIS.2 pede 24 GB | **Improvável nativo**: TRELLIS.2 é Linux-first, `natten` compilado, extensões CUDA. Rota realista: WSL2 (já habilitado: distro `docker-desktop`) — instalar Ubuntu por usuário, a confirmar |
| **FLUX.2 klein 4B** (conceito) | Apache 2.0 | transformer 7,75 + text encoder 8,05 + VAE 0,17 ≈ **16,0 GB** (não baixar também o single-file de 7,75) | ~13 GB (model card) → na 3060 só com `enable_model_cpu_offload()` (mais lento) | `diffusers` via pip; sem compilação |

**Alertas de licença (mudam decisões)**
1. **Hunyuan3D 2.1 × site público:** exibir saída fora do Território é proibido, e o portfólio abre na UE/RU/Coreia.
   Não há como cumprir isso num site aberto. Recomendo **não usar Hunyuan em nada que vá para o site**; para o
   teste da D8, trocar por **TripoSG × Direct3D-S2** (ambos MIT) ou TripoSG × Pixal3D. Decisão do Davi.
2. **FLUX.2 klein 9B não é Apache:** o HF marca `flux-non-commercial-license` (gated). Só o **4B** é Apache 2.0.
   O `M16-REFERENCIAS.md` §6.2 diz "4B/9B (Apache 2.0)": vale só para o 4B.
3. **Removedores de fundo padrão:** TripoSG usa RMBG-1.4 e Pixal3D usa RMBG-2.0 (Bria, licença própria; 1.4 é
   "non-commercial use"). Contornar: gerar o conceito em fundo liso e recortar com `rembg`/u2net (Apache) ou
   BiRefNet (MIT), passando PNG já transparente.
4. **DINOv3** (Pixal3D): gated com aprovação manual da Meta e licença própria; texto **não lido** (exige aceite).

**Máquina (leitura)**: RTX 3060 12 GB, driver 610.88; Python 3.10/3.11/3.12 via `uv` (sem admin); sem CUDA Toolkit,
sem `nvcc`, VS 2022 Community sem `vcvars64` (workload C++ ausente); WSL2 ativo; `C:\Users\davir\drf-ia3d\` ainda não
existe. **Disco C: com 134 GB livres (93% usado).**

**Total estimado** (pesos; ambientes Python ~5–8 GB cada, estimativa, não medido):
- Rota recomendada (FLUX.2 klein 4B + TripoSG + Direct3D-S2 a levantar) ou (FLUX 4B + TripoSG + Hunyuan forma):
  ~24–34 GB de pesos + ~15–20 GB de ambientes ≈ **40–55 GB**.
- Com Pixal3D: + ~26 GB de pesos + ambiente WSL ≈ **75–90 GB** → aperta os 134 GB livres.

Instalação sem admin em `C:\Users\davir\drf-ia3d\` (caminho ASCII): `uv venv --python 3.10` por modelo, torch cu124
via wheel (traz o runtime CUDA, sem toolkit), `HF_HOME` apontando para `drf-ia3d\hf-cache`. Bloqueios: TripoSG
(`diso`) e Pixal3D precisam de compilador CUDA; Visual Studio Build Tools/CUDA Toolkit normalmente pedem admin.
Primeiro passo seguro: verificar se `diso` tem wheel pronto para Windows antes de qualquer instalação.

Direct3D-S2 (MIT) aparece no §6.1 mas não estava na lista desta missão: tamanho e instalação **não levantados**.

Parado aqui, como pedido. Nada baixado, nada instalado.

Aprovação do Davi: pendente.

## Decisões do Davi (23/10/2026, 19h43)

- **Fase 3**: rota de IA 3D aprovada — FLUX.2 klein 4B (Apache) → `rembg` + BiRefNet (MIT) → TripoSG (MIT) sem `diso`
  → Blender, tudo no Windows. D8 com **uma IA só** (TripoSG) por enquanto. Lista de downloads em
  `M16-FASE3-DOWNLOADS.md`, aguardando o ok antes de baixar.
- **Fase 4**: H = 4,5 m; telemetria e pit wall podem mudar **só o alvo**; vidro falso com reflexo leve; velocidade
  ~45 m/s ajustável; curva à direita; show car girando devagar; reduced motion com carros parados no grid/pit
  (saída do pit animada só com movimento ligado; volta ao pit sem animação); fatiada em **4a/4b/4c com gate**.
  Registro completo em `docs\design\M16-FASE4-DESENHO.md` §8.

## Fase 4a — estrutura da sala elevada (branch `feat/m16-fase4a`, sem merge)

**Limite exato da 4a.** Dentro: sala subida H = 4,5 m; boxes embaixo (3 vãos abertos no nível da M15, `y = −0,007`);
fachada de vidro falso (montantes a cada 2,4 m, travessa a 2,6 m, peitoril de 0,25 m, guarda-corpo a 1,05 m, testa da
laje); anel de piso do show car (sem giro, sem elevar o carro); trajetórias das 5 estações iguais em forma; alvo de
telemetria/pit wall rebaixado **só no desktop**. Fora (4b/4c): corrida e spline, horizonte de Recife, muro/pórtico do
pit, placas 100/50, zebras, giro do show car, carros no pit com reduced motion. A passagem da M15 continua como está.

**Como.** Novo grupo `elevated-technical-room` (`y = 4,5`) com a garagem, as luzes internas, os volumes de clique e a
**câmera como filha**. Os enquadramentos continuam nos mesmos números (coordenadas da sala), então os caminhos têm a
mesma forma por construção. Só o `lookAt`, o ouvinte de áudio e a projeção dos rótulos HTML convertem para o mundo.
Pista, passagem e boxes ficam no chão. `data-scene-room-elevation = 4.5`.

**Alvo de telemetria/pit wall.** Desktop: `lookAt.y` 1,7/1,8 → **1,5** (o mais baixo que mantém a placa de zona
inteira; com 1,2 a placa cortava). Mobile: **sem mudança** — a laje esconde o chão até z −31 dali, então rebaixar
não revelaria a corrida e só pioraria a composição aprovada.

**⚠ Achado de desenho (corrige o `M16-FASE4-DESENHO.md` §2): a laje esconde a pista.** A borda do piso (peitoril em
y 4,75 no mundo, z −6,6) corta a linha de visão. Chão visível pelo vidro:

| Câmera | Chão visível a partir de | Reta prevista (z −26)? |
| --- | --- | --- |
| hero desktop / mobile | z ≤ −47 | **não** |
| telemetria / pit wall desktop | z ≤ −25 | no limite |
| telemetria / pit wall mobile | z ≤ −31 | **não** |

Consequências: (1) do hero, o vidro mostra só névoa/céu; (2) a passagem da M15 (z −10…−28) **não aparece mais no
hero** — o teste `trackside-glb` "viewport/opening" foi atualizado para a geometria real, **falha** com ela e ficou
com `skip` explícito até a 4b; (3) o pit lane e os boxes não aparecem de nenhuma estação. Na projeção do §2 eu conferi
"cabe no quadro", mas não a oclusão pela laje: erro meu. Opções para a 4b (decisão do Davi): **reta mais longe**
(z −50…−60, como a reta oposta vista de um Paddock Club; carro ≈ 7% da largura da tela, névoa empurrada), H menor
(~2,5 m, vira mezanino), piso em degrau perto do vidro, ou câmeras mais perto do vidro (mexe em trajetória aprovada).
Cálculo: `C:\Users\davir\OneDrive\Documentos\GitHub\portfolio\.agent-grid\screenshots\mission-16\fase4a\oclusao-laje.py` / `.txt`.

**Medidas (Chrome headless, ANGLE D3D11, RTX 3060, DPR 1)**

| Enquadramento | Antes: calls / tri | Depois: calls / tri |
| --- | --- | --- |
| hero 1440 | 91 / 67.334 | 103 / 70.260 |
| telemetria 1440 | 37 / 35.484 | 49 / 38.410 |
| pit wall 1440 | 29 / 15.878 | 41 / 18.804 |
| hero 390 e 320 | 75 / 63.550 | 87 / 66.476 |
| telemetria 390 e 320 | 34 / 15.772 | 44 / 18.410 |
+12 calls em todo enquadramento, inclusive onde os boxes não aparecem: os lotes instanciados têm esfera envolvente
grande e não são descartados pelo frustum. Dá para recuperar na 4b (mesclar o nível do pit, ou esconder quando fora de
vista). Sem FPS medido.

**Validação**
- `npm run lint` OK; `npm run build` OK (alerta de chunk > 500 kB conhecido; SceneRoot 673,7 kB).
- `node --test tests/*.test.mjs`: **93 pass, 0 fail, 1 skip** (o `trackside-glb` acima). Novo
  `elevated-room.test.mjs` (5): posições aprovadas idênticas, só dois alvos desktop mudam e só em y, fachada aberta
  (raios no meio de cada vão chegam primeiro ao vidro), boxes no nível da M15 até a laje, anel sem elevar o carro.
- `browser-smoke.mjs` (preview 5175): exit 0, console e rede sem erros.
- Capturas antes/depois, 1440×900 / 390×844 / 320×844: 5 estações em PT com movimento, hero em EN e hero com reduced
  motion (21 por build), sem erros de console. Comparativos `cmp-*.png`.

**Evidência**: `C:\Users\davir\OneDrive\Documentos\GitHub\portfolio\.agent-grid\screenshots\mission-16\fase4a\`
(`before-*`, `after-*`, `cmp-*`, `*-report.json`, `browser-smoke.txt`, `smoke\`, `oclusao-laje.*`,
`trackside-glb.unskipped.test.mjs` = o teste sem `skip`, para reproduzir a falha). Build da base:
`...\.agent-grid\m16-4a-before-dist\`.

**Limites**: sem telefone físico, sem FPS. Vidro falso calibrado só no olho (opacidade 0,1). O topo das placas de
telemetria/pit wall ficou sob a faixa do cabeçalho do HUD no desktop (texto legível; borda superior encostada).

Aprovação do Davi: pendente.
