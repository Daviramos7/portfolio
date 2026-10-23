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
  importa**. Não migrar para R3F. Antes de usar GSAP/Framer, decidir com o Davi (e considerar remover o que sobrar).
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

## Estado atual
- Base: Missão 15 integrada (`fc8afd3`). Em andamento: **Missão 16 — Art Direction Reboot**,
  `drf-v2\docs\production\MISSAO-16-BRIEFING.md`. Uma fase por vez; no fim de cada fase, parar e esperar o ok.
- Pendente conhecida: passagem do carro ocluída pela ficha (mobile 320/390) e pelo hero (desktop).
- Alerta de chunk > 500 kB no build (SceneRoot ~668 kB) é conhecido.

## Honestidade e evidência
- Qualidade técnica ≠ aprovação visual. Não escrever "premium", "cinematográfico" nem "aprovado": quem aprova é o
  Davi. Todo relatório termina com "Aprovação do Davi: pendente".
- Sem FPS inventado; toda medição com metodologia. Antes/depois no mesmo enquadramento (1440×900, 390, 320).
- Capturas e vídeos em `.agent-grid\screenshots\mission-NN\` (fora do Git), caminhos absolutos no relatório.

## Assets
- Só licença que permita uso público. Nada de logo ou marca real (Xbox, Ferrari, F1, equipes): alusões originais.
- Registrar origem, licença, prompt e hash de cada asset em `drf-v2\docs\production\ASSETS.md`.

## Documentos (ler só o que a tarefa pedir)
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
