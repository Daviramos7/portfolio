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

## Fase 4a — estrutura da sala elevada (branch `feat/m16-fase4a`, integrada em `dc9c50b`)

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

### Fase 4a · reta afastada (decisão do Davi, 25/10/2026)

**O que mudou.** A passagem saiu da parábola da M15 (z −10…−28) para uma reta em **z −52** (x −90 → +16), curva no
lado direito do quadro (raio 8 m, até x 24, z −60) e saída para o fundo até z −125. Velocidade de cena constante,
**45 m/s** (±8 % entre passagens: 3.777–4.434 ms), parametrizada por comprimento de arco (rodas seguem a distância
exata). Cenário do paddock (separador, zebra, arquibancada, horizonte) foi para trás da reta (z −66,6), com o lado
direito aberto para a estrada de saída. Névoa 32–65 → **50–125** e `far` da câmera 85 → **130**, para entrada e saída
sumirem na névoa em vez de cortar. Reflexo leve no piso e o tremor do objeto da mesa agora seguem o carro só na reta
em frente ao vidro (|x| < 40 m) e somem na curva; amplitude do tremor pela metade (o carro está a ~60 m). O hook DEV
`trigger` usa a duração natural (os 2400 ms fixos ficariam fora da faixa nova).

**Testes.** `npm run lint` OK, `npm run build` OK (SceneRoot 674 kB, alerta conhecido). `node --test tests/*.test.mjs`
(preview 5175 com o build da 4a): **94 pass, 0 fail, 0 skip**: o teste de janela do `trackside-glb` voltou sem `skip`
(carro inteiro dentro do vidro e da tela por ≥ 200 ms no hero 1440/390/320, nos dois sentidos). Testes de rota
reescritos para a geometria nova (separador por interseção de caixa, tangente com 1000 amostras, 45 m/s).
`browser-smoke.mjs`: exit 0, sem erro de console ou rede.

**O carro aparece na janela? (prints com o carro forçado na reta, x −30/−15/0/+15)**
| Estação | 1440 balanced | 1440 low | 390 low |
| --- | --- | --- | --- |
| Hero (garagem) | sim, à direita, pequeno | sim | **não**: a reta cai atrás da ficha "Programas" |
| Telemetria | sim, à direita da mesa | sim | só a ponta, na borda da mesa |
| Pit wall | sim, à esquerda do monitor, breve | sim | **não**: monitor/mesa tapam |

O teste de janela cobre só o hero (enquadramento sem a UI por cima); a ficha do mobile não entra na conta.

**Evidência**: `C:\Users\davir\OneDrive\Documentos\GitHub\portfolio\.agent-grid\screenshots\mission-16\fila05-reta\`
(`*-sem-carro.png`, `*-carro-x*.png`, `tira-*.png`, `crop-*.png`, `capture.json`, `smoke\`, `smoke.txt`).
Sem FPS medido. Sem telefone físico. Áudio da passagem não recalibrado (o panner já usa a posição nova; o carro mais
longe soa mais baixo).

Aprovação do Davi: pendente.

### Fase 4a · integração (fila 06, 29/10/2026)

Gate visual: o Davi aprovou o enquadramento da 4a (sala elevada 4,5 m + reta em z −52, `d3eebd9`) em 28/10/2026,
17h43. O carro é provisório: sai pelos modelos da IA 3D na 4b/4c.

- Merge `--no-ff` da `feat/m16-fase4a` na `feat/drf-engineering`: **`dc9c50b`**. Branch e worktree da 4a mantidos.
- Um conflito, em `src/scene/garageRenderer.ts`, trivial: import e loop do governor da Fase 1 (`40a38c0`) ao lado do
  `createPitLevel` e do `camera.lookAt(room.localToWorld(...))` da 4a. Ficou o governor da Fase 1 inteiro (amostra
  depois do teto, `cappedFrameMs`, `loopRenderedAt`) com o `lookAt` da sala elevada. O teto antigo `1000 / 30` da 4a
  saiu (é o que a Fase 1 substituiu). `CLAUDE.md` (`7f61ba7`) sem conflito.
- Validação: lint OK; build OK (alerta de chunk conhecido); `node --test tests/*.test.mjs` **97/97** (preview 5175 de
  pé); `browser-smoke.mjs` exit 0, console e rede sem erros.
- Prints de conferência, 1440 balanced, sem carro (dev 5176, harness da fila 05 reduzido): garage, telemetry e pit
  wall. Diff de pixels contra os mesmos quadros da fila 05 (1 a cada 4 px, limiar 30 RGB): **0,00 %** nos três.
  Pasta: `C:\Users\davir\OneDrive\Documentos\GitHub\portfolio\.agent-grid\screenshots\mission-16\fila06-merge\`
  (`balanced-1440-{garage,telemetry,pit-wall}-sem-carro.png`, `capture.json`, `smoke\`, `smoke.txt`).
  Harness: `C:\Users\davir\OneDrive\Documentos\GitHub\portfolio\.agent-grid\screenshots\mission-16\harness\capture-fila06-merge.mjs`.

**Pendente:** o carro some no mobile 390 atrás da ficha "Programas" (hero) e do monitor/mesa (pit wall). Precisa de
decisão de desenho; câmera e UI não foram tocadas. Sem FPS medido, sem telefone físico.

Aprovação do Davi: pendente (merge e pendência do 390).

## Fila 11 — materiais (branch `m16-11-materiais`, 15–16/11/2026)

Base: `feat/drf-engineering` em `c96005c`, **sem a 4b**. Câmera, trajetórias, UI, áudio, luzes, ambiente (PMREM) e a
cota `y=-0,007` não foram tocados. Nenhuma textura baixada: tudo é gerado no código.

### Causa atacada
A oficina é montada com um cubo e um cilindro unitários escalados por peça. O UV 0..1 deles esticava trama, escovado
e casca de laranja até o tamanho de cada peça (a mesma trama ocupava 17 m numa soleira e 35 cm num pilar). Isso, mais
vermelho/branco/preto com `metalness` de metal, era o que mais lia como "demo".

### O que mudou
- `src/scene/garage/surfaceFinish.ts` (novo): `objectSpaceFinish` troca, via `onBeforeCompile`, os UVs dos mapas por
  coordenadas **em espaço do objeto, em metros** (`repeat` da textura = tiles por metro; o U segue o lado mais longo
  da face). Espaço do objeto, não do mundo, para o padrão não "nadar" em peça que gira ou anda (carro da pista,
  ventilador, e o show car quando a 4b o fizer girar). No mesmo patch: variação lenta de roughness/cor (ruído 3D
  barato) e uma faixa de desgaste nas arestas do cubo unitário (atributo `drfCube`; outras geometrias leem 0), com
  largura em metros, nunca maior que 1/4 do lado mais fino, e que some quando fica menor que um pixel.
- `src/scene/garage/surfaceMaps.ts` (novo): sarja 2×2 (16 fios de 7 mm por tile), escovado em linhas retas (256
  linhas em 25 cm) e casca de laranja, todos 256 px e sem emenda. O relevo que gera o normal é um canvas separado e
  não sobe para a GPU.
- `resources.ts` (paleta):
  - **carbono**: o campo cinza da trama modula albedo e roughness, normal por fio, `clearcoat .6` /
    `clearcoatRoughness .2` (antes `.04`). Vale para todas as peças que usam `palette.carbon` (asas, braços,
    soleira, anel do show car, bancada de estratégia, fundo das placas).
  - **alumínio** (`metal`): `MeshPhysicalMaterial`, escovado ao longo da peça; anisotropia de material `.55`
    **só no `balanced`** (`setBrushedAnisotropy`, ligado no mesmo ponto em que o renderer liga sombras). No `low` fica
    desligada. Cavaletes, tampos, guarda-corpo, montantes e puxadores já usavam `metal`.
  - **piso**: `roughness` do material = 1 e o mapa carrega o valor absoluto (base ~.50, manchas ±.10, passadas de
    rodo, trilhas de pneu e riscos mais foscos, poeira junto às paredes), `normalScale .1` com ondulação lenta,
    `envMapIntensity .65`. O reflexo borrado vem do ambiente pré-filtrado e das lâmpadas; **não há SSR nem espelho**,
    então o piso não reflete o carro nem os móveis.
  - **borracha** (`tire`): roughness `.97`, sem metal, `envMapIntensity .25`. Mangueiras e cabo do chão passaram de
    `black` para `tire`.
  - **tinta**: `red`, `white`, `black` e `panel` deixaram de ser metálicos (`metalness ≤ .04`, roughness `.52–.88`).
- `garageRenderer.ts`: uma linha para a anisotropia por qualidade; e, só em DEV, `dataset.sceneTextureBytes` e o hook
  `drfDebugTrackside.view` (texto idêntico ao da 4b, para o merge não conflitar).

### Decisões tomadas sem perguntar
- "Anisotropia desde `083fdc0`" é filtro anisotrópico **de textura**, e o teste `text-sharpness` exige que ele fique
  só no texto. Não mexi nesse teste: o alumínio usa anisotropia **de material**, que é outra coisa.
- Mapas de material continuam em 256 px e o piso em 512 px (limite pedido: 1024 no `low`). Não subi para não gastar
  memória no mobile.
- Não mexi no ambiente nem nas luzes para "ajudar" o metal (a luz é outra missão). Por isso o alumínio ficou com
  `metalness .88` e cor mais clara: com 1.0 os tampos refletiam o teto escuro e ficavam pretos.

### Medidas (antes × depois)
Metodologia: dev server em 127.0.0.1:5175, Chrome headless (ANGLE D3D11, RTX 3060), mesma URL e mesma pose, 3,5 s
depois de `sceneStatus=ready`, leitura de `canvas.dataset` (`renderer.info.render.calls/triangles`,
`renderer.info.memory.textures`). Bytes de textura: estimativa própria (`src/scene/textureBytes.ts`), soma de
largura×altura×4 (RGBA8) ×4/3 (mips) das texturas ligadas a materiais da cena **que já subiram para a GPU naquele
quadro**; não conta o PMREM nem o shadow map e depende do que a pose já mostrou. "Antes" = commit `fce222a` (só a
medição), "depois" = fim da missão.

| Config · pose | Draw calls | Triângulos | Texturas | Bytes de textura (estim.) |
| --- | --- | --- | --- | --- |
| 1440 balanced · hero | 102 → 102 | 70 212 → 70 212 | 29 → 29 | 31 894 187 → 31 894 187 |
| 1440 balanced · garage | 47 → 47 | 30 434 → 30 434 | 23 → 23 | 20 709 376 → 20 709 376 |
| 1440 balanced · telemetry | 48 → 48 | 38 362 → 38 282 | 23 → 23 | 20 709 376 → 20 709 376 |
| 1440 balanced · pit wall | 40 → 40 | 18 756 → 18 676 | 17 → 17 | 10 922 667 → 10 922 667 |
| 1440 balanced · driver-profile | 48 → 48 | 21 880 → 21 880 | 21 → 21 | 19 223 893 → 19 223 893 |
| 390 low · hero | 86 → 86 | 66 428 → 66 348 | 24 → 24 | 24 903 680 → 24 903 680 |
| 390 low · garage | 49 → 49 | 42 652 → 42 652 | 19 → 19 | 17 913 173 → 17 913 173 |
| 390 low · telemetry | 43 → 43 | 18 362 → 18 282 | 21 → 21 | 20 709 376 → 20 709 376 |
| 390 low · pit wall | 38 → 38 | 18 468 → 18 388 | 15 → 15 | 10 922 667 → 10 922 667 |
| 390 low · driver-profile | 40 → 40 | 17 754 → 17 754 | 15 → 15 | 12 233 387 → 12 233 387 |

320 low deu os mesmos números do 390 low nas cinco poses. Os −80 triângulos em algumas poses são a mangueira que
trocou de lote ao virar `tire` (um cilindro de 80 triângulos). Draw calls, contagem e memória de textura não mudaram:
a trama do carbono reaproveita a textura que já era o roughness.

**O que essas medidas não dizem:** o custo por pixel subiu (ruído 3D e desgaste em nove materiais, clearcoat mais
forte no carbono, anisotropia no alumínio no `balanced`) e **isso não foi medido**. Não há FPS nem tempo de quadro.
O `dprGovernor` ficou em `full` nas capturas `low`, mas a máquina é um desktop com RTX 3060: não vale como
evidência para celular.

### Validação
- `npm run lint`: OK. `npm run build`: OK (alerta de chunk conhecido; SceneRoot 679,51 kB).
- `node --test tests/*.test.mjs` com o preview do build em 5175: **103/103** rodando em série
  (`--test-concurrency=1`). São os 97 de antes mais 6 novos em `tests/materials-11.test.mjs` (contrato dos materiais,
  orçamento de textura, âncoras do patch de shader nesta versão do three, cota do piso). Em paralelo (padrão) a
  primeira rodada deu 100/103 e a segunda 102/103, sempre em testes de UI com Chrome headless; `rescue-ui` passou
  sozinho. Tratei como disputa entre vários Chromes ao mesmo tempo, **sem ter provado a causa**.
- `browser-smoke.mjs` no preview: 13 checks, exit 0, console e rede sem erros.
- Console nas capturas (dev): só o aviso X4122 do compilador HLSL, que já aparecia no "antes".

### Evidência
Pasta: `C:\Users\davir\OneDrive\Documentos\GitHub\portfolio\.agent-grid\screenshots\mission-16\fila11-materiais\`
- `before-*` e `after-*`, mesmo enquadramento: `{1440-balanced,390-low,320-low}-{hero,garage,telemetry,pit-wall,driver-profile}.png`.
- Closes (hook DEV, UI escondida, em 1440 balanced e 390 low): `close-carbono-asa`, `close-carbono-bancada`,
  `close-carbono-soleira`, `close-piso`, `close-piso-rasante`, `close-aluminio-bancada`,
  `close-aluminio-guarda-corpo`, `close-pneu-borracha`, `close-pintura-ferramentas`.
- `before-report.json`, `after-report.json`; `iter1\`, `iter2\`, `iter3\` são as rodadas de ajuste.
- Harness: `C:\Users\davir\OneDrive\Documentos\GitHub\portfolio\.agent-grid\screenshots\mission-16\harness\capture-fila11-materiais.mjs`.

Corrigido depois de olhar os prints: verniz do carbono forte demais (`.8` → `.6`); piso com cara de molhado e mancha
estourada perto da luminária (base de roughness `.34` → `.50`, `envMapIntensity .65`); alumínio preto nos tampos
(`metalness 1` → `.88`, cor mais clara); pneu sem volume (cor um pouco mais clara); faixas brancas do piso sumindo.

### O que ficou fraco
- **Piso:** em ângulo rasante ainda clareia bastante perto da fachada e da luminária, e a variação de roughness é
  discreta nas poses normais. Com 512 px para 17×20 m (~3,3 cm por texel) não há detalhe fino de perto.
- **Carbono:** a trama só aparece de perto (closes). Nas cinco poses ela vira um tom liso; o que muda nelas é o brilho
  do verniz. Os fios têm 7 mm, maiores que os de uma sarja 3K.
- **Desgaste de aresta:** só existe nas peças feitas com o cubo unitário. Cilindros, o carro e qualquer malha própria
  não têm. É discreto a ponto de quase não se notar nas poses.
- **Alumínio:** depende do que o ambiente tem para refletir; em contraluz na fachada ele fica claro, quase branco.
- **Mobile:** os quadros `before`/`after` de 390 e 320 são quase iguais, porque a ficha cobre o piso e o carro.
- Rodas (`alloy`, `brake`), vidro da fachada e concreto dos boxes não foram tocados.

### Não verificado
- Desempenho em aparelho real, FPS e tempo de quadro. Nenhum celular físico.
- Convivência com a 4b (não fiz merge nem checkout). Risco conhecido: as duas branches acrescentam seção no fim deste
  arquivo, então este `MISSAO-16.md` deve conflitar (resolver mantendo as duas). Em `resources.ts`, `Garage.ts` e
  `garageRenderer.ts` editei longe das linhas da 4b, mas isso só o merge confirma. Os materiais novos da 4b (asfalto,
  grama, brita, tinta de pista) não recebem o acabamento em espaço do objeto.
- GPUs que não sejam a desta máquina (o patch de shader só foi compilado aqui, em ANGLE D3D11).
- Reduced motion e fallback sem WebGL só pelo smoke, sem print dedicado.

Aprovação do Davi: pendente
