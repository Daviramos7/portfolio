# CLAUDE.md — portfólio DRF Engineering

@AGENTS.md

Regras gerais, stack autorizada e validação estão no `AGENTS.md` (importado acima). Aqui fica só o que o
Claude Code precisa a mais: o estado real, o que está aprovado e onde estão os documentos.

## Onde trabalhar
- App V2: `drf-v2\`. V1 (raiz: `index.html`, `css\`, `js\`, `img\`) e `curriculo\` não se tocam.
- Branch `feat/drf-engineering` (ou branch de fase a partir dela). Nunca `main`. Sem push, sem deploy.
- `.agent-grid\` guarda worktrees e evidências (ignorado pelo Git). **Nunca** `git worktree prune`, `git clean`,
  `git reset --hard`, nem apagar `.agent-grid\`.
- Terminal sem administrador. Ferramentas de IA 3D e pesos fora do repo, em caminho ASCII
  (`C:\Users\davir\drf-ia3d\`); nada pesado no Git. Download só depois de listar tamanho/licença e o Davi aprovar.

## Stack real (conferida em 22/10/2026)
- React 19 + TypeScript + Vite + Tailwind 4. A cena é **Three.js imperativo** (`three` 0.186), em `src\scene\`
  (`garageRenderer.ts`, `Garage.ts`, `src\scene\garage\...`).
- `@react-three/fiber`, `drei`, `gsap` e `framer-motion` estão no `package.json`, mas **nenhum arquivo do `src`
  importa**. Não migrar para R3F. Decisão de 11/11: R3F e drei **saem**, `gsap` fica, `framer-motion` fica para depois.
- **R3F/drei ainda não saíram:** o `@types/three` (0.186.0) só existe no projeto como dependência transitiva do drei
  (`maath`, `stats-gl`). Sem ele o `tsc -b` quebra (TS7016 em todo `src\scene\`). Para remover, primeiro
  `npm i -D @types/three@0.186.0` (precisa de `npm install`, com ok do Davi) e só depois o `npm uninstall`.
- Telas da garagem: `src\scene\garage\programmeScreen.ts` (`CanvasTexture`).

## Comandos (em `drf-v2\`)
- `npm run lint` · `npm run build` (`tsc -b && vite build`)
- Testes: `node --test tests/*.test.mjs` (node:test; `browser-smoke.mjs` e harnesses não entram no glob).
- Dev: `npm run dev -- --host 127.0.0.1 --port 5176 --strictPort`. Encerrar o servidor ao terminar.
- Hook de debug só em DEV: `document.querySelector('canvas').drfDebugTrackside` (`audio()`, `solo(...)`).

## Preservado (não mexer sem pedido explícito)
- Câmera cinematográfica e trajetórias das estações (mudança só com o Davi aprovando trajetória por trajetória).
- Legibilidade de projetos/stacks, Recruiter Mode, conteúdo, PT/EN, reduced motion, fallback sem WebGL.
- Áudio opt-in (OFF até gesto, volume inicial 25%, mute), ambiente calibrado da M15.
- Cota do piso/pista da M15 (`y=-0,007`): não elevar a pista nem mexer em câmera/UI para esconder oclusão. Vale até a Fase 4 ter desenho aprovado pelo Davi.

## Reprovado pelo Davi (22/10/2026)
Modelos genéricos (controle, handgrip), texto das telas com baixa nitidez, DRF-01 que não lembra um F1 atual e o
carro que passa. Isso substitui o "BOM" antigo do controle (M14). Direção nova: garagem elevada com corrida ao fundo.

## Estado atual (11/11/2026)
- Base: Missão 15 integrada (`fc8afd3`). Em andamento: **Missão 16 — Art Direction Reboot**
  (`drf-v2\docs\production\MISSAO-16-BRIEFING.md`). Uma fase por vez; no fim de cada fase, parar e esperar o ok.
- **Fase 1:** anisotropia `083fdc0`, DPR 1,5 `04bda80` e **bug do dprGovernor corrigido** `40a38c0`, tudo na
  `feat/drf-engineering`.
- **Fase 4a: aprovada pelo Davi (28/10 17:43) e integrada** na `feat/drf-engineering` (merge `dc9c50b`): sala
  elevada 4,5 m e **reta em z −52** (`d3eebd9`), 97/97 testes. Branch e worktree da 4a mantidos. Carro provisório
  (troca na 4b/4c). Pendente: o carro some no mobile 390 atrás da ficha "Programas" e do monitor.
- **Fase 3 (IA 3D):** cadeia local pronta em `C:\Users\davir\drf-ia3d\` (FLUX.2 klein 4B → BiRefNet → TripoSG
  sem diso). Teste P1 (handgrip) ok, ~2,5 min. Falta Blender: limpar e decimar de 535 k faces, UV e escala.
  Nada no site ainda.
- **Duplicata do rembg (11/11): conferida, não movida.** `rembg-models\BiRefNet-general-epoch_244.onnx` e
  `rembg-models\models\birefnet-general\birefnet-general.onnx` são idênticos (972.666.916 bytes, mesmo sha256
  `58f621f0…1ebd3c`). O rembg 2.0.86 lê o segundo. O primeiro só é citado em `scripts\setup-flux.sh` (linhas 13–14):
  se sumir, rodar o setup de novo baixa 0,97 GB. Tirar essas linhas antes de mover ou apagar.
- **Deps (11/11): remoção de R3F/drei tentada e desfeita** (ver "Stack real"). `package.json` e lock iguais ao Git,
  mas o **`node_modules` local ficou sem 53 pacotes** (entre eles `@types/three`): `npm run build` falha até rodar
  `npm install` em `drf-v2\`.
- Easter eggs e decisões de 11/11: `_fila\NOITE-11-11-DECISOES.md` (fora do Git).
- Alerta de chunk > 500 kB no build (SceneRoot ~674 kB) é conhecido.
- **Cota (o Davi usa o Claude no estágio):** medir sessão e semana no começo e no fim de cada missão; **pausar a fila
  com a sessão acima de 70%**. O DRF tem prioridade menor que o Plenofone e o Dados com Davi: com a semana acima de
  60%, não pegar missão do DRF.

## Honestidade e evidência
- Qualidade técnica ≠ aprovação visual. Não escrever "premium", "cinematográfico" nem "aprovado": quem aprova é o
  Davi. Todo relatório termina com "Aprovação do Davi: pendente".
- Sem FPS inventado; toda medição com metodologia. Antes/depois no mesmo enquadramento (1440×900, 390, 320).
- Capturas e vídeos em `.agent-grid\screenshots\mission-NN\` (fora do Git), caminhos absolutos no relatório.

## Assets
- Só licença que permita uso público.
- **Regra de marcas (11/11):** nomes reais (bandas, músicas, títulos de anime/filme) em **texto simples**, como
  referência: ok. Logo, capa, arte, personagem, letra de música e forma reconhecível de terceiros (símbolos, objetos
  icônicos de franquia): **não**. Nada de logo de F1, FIA, equipes ou montadoras.
- Registrar origem, licença, prompt e hash de cada asset em `drf-v2\docs\production\ASSETS.md`.

## Documentos (ler só o que a tarefa pedir)
- **Projeto novo a entrar no portfólio:** Orçamento Público do Recife (pipeline PySpark/dbt + API + agente com evals).
  Dossiê com textos PT/EN prontos para card e página em `_contexto-projeto-claude\projetos\orcamento-publico-recife.md`
  (fora do Git). Os números já foram medidos: não arredondar nem "melhorar".
- Missão atual: `docs\production\MISSAO-16-BRIEFING.md`; relatório por fase em `MISSAO-16.md`.
- Última cena/áudio: `MISSAO-15.md`, `MISSAO-15-SCENE.md`, `MISSAO-15-AUDIO.md`; câmera/estações: `MISSAO-14-SCENE.md`.
- Contratos e plano: `docs\CONTRATOS.md`, `docs\PLANO.md`; design: `docs\design\`.
- Não ler o contexto mestre inteiro nem todas as missões antigas.

## Skills do projeto
Em `.claude\skills\` (ignorado pelo Git), copiadas de `CloudAI-X/threejs-skills` (MIT, commit `0e18186`, r186):
`threejs-fundamentals`, `threejs-textures`, `threejs-materials`, `threejs-lighting`, `threejs-geometry`,
`threejs-loaders`, `threejs-asset-pipeline`, `threejs-performance`.
Não instaladas de propósito: `threejs-react-three-fiber` (o projeto não usa R3F), GSAP (adiado).
`asset-pipeline` usa `npx @gltf-transform/cli` (baixa do npm): pedir ok antes. Decoders Draco/KTX2 locais, sem CDN.
