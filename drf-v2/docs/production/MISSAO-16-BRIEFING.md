# Missão 16 — Art Direction Reboot (briefing para o Claude Code)

Repositório: `C:\Users\davir\OneDrive\Documentos\GitHub\portfolio`, branch `feat/drf-engineering`, app em `drf-v2\`.
Base conferida em 22/10/2026: HEAD `fc8afd3` (Missão 15 integrada em 11/10), checkout limpo.
Ler antes: `AGENTS.md` (raiz), `drf-v2\docs\production\MISSAO-15.md`, `MISSAO-15-SCENE.md`, `MISSAO-14-SCENE.md`.
**Não ler** o contexto mestre inteiro nem todas as missões antigas: só o que a fase pedir.

## Feedback do Davi (22/10/2026), fonte de verdade desta missão
> "Ainda me representa, mas os modelos 3D estão bem feios e genéricos, por exemplo, controle Xbox, handgrip, e
> textos em telas tão com qualidade ruim. O carro até tá com qualidade boa, mas não lembra um carro de Fórmula 1
> atual. O carro que tá passando também não tá muito legal. Eu pensei em a visão ser uma garagem mais no alto, e
> meio que uma corrida rolando ao fundo com vários carros passando."

Decisões do Davi: **modelos novos por IA 3D** (local, grátis), **execução pelo Claude Code**.
Isto substitui as aprovações antigas do controle ("BOM" na M14): o dono reavaliou e agora reprova.
Câmera cinematográfica, legibilidade de projetos/stacks, Recruiter Mode, conteúdo, PT/EN, reduced motion, fallback
WebGL e áudio opt-in **continuam preservados**.

## Fato técnico conferido
A cena é **Three.js imperativo** (`src\scene\...`, `garageRenderer.ts`, `Garage.ts`). `@react-three/fiber` e `drei`
estão no `package.json`, mas nenhum arquivo do `src` os importa. **Não migrar para R3F** nesta missão.
Telas: `src\scene\garage\programmeScreen.ts` usa `CanvasTexture` 1024×512; não há anisotropia configurada.

## Regras
- Uma fase por vez. **No fim de cada fase: parar, mostrar evidência e esperar o ok do Davi.**
- Commits pequenos na `feat/drf-engineering` (ou branch de fase a partir dela). Sem push, sem deploy, sem tocar `main`/V1/`curriculo\`.
- **Nunca rodar `git worktree prune`, `git clean`, `git reset --hard`** nem remover `.agent-grid\` (worktrees e evidências).
- Terminal sem administrador. Downloads de modelos/pesos **só depois de listar tamanho/licença e o Davi aprovar**. Caminhos ASCII para ferramentas de IA (ex.: `C:\Users\davir\drf-ia3d\`), fora do repositório; pesos e arquivos pesados nunca no Git.
- Qualidade técnica ≠ aprovação visual. Não escrever "premium", "cinematográfico" nem "aprovado". Quem aprova é o Davi.
- Toda medição com metodologia; sem FPS inventado. Antes/depois sempre no mesmo enquadramento.
- Assets: só com licença que permita uso público. Nada de logo/marca real (Xbox, Ferrari, F1, equipes): alusões originais. Registrar origem, licença, prompt e hash de cada asset em `drf-v2\docs\production\ASSETS.md`.

## Fase 0 — preparação (curta)
1. Confirmar HEAD, `git status` e a lista de worktrees (só leitura).
2. **Skills** (biblioteca em `C:\Users\davir\skills-biblioteca\`, ativas em `C:\Users\davir\.agents\skills`):
   avaliar e propor ao Davi, com auditoria arquivo por arquivo (scripts, hooks, rede) antes de instalar:
   - `greensock/gsap-skills` (oficial, MIT): só para UI/Recruiter/transições de HUD; **não mexer na câmera**.
   - uma skill de **Three.js vanilla** (procurar a mais mantida; a `EnzeD/r3f-skills` é R3F e serve pouco aqui).
   - instalar **só no projeto** (`.claude\skills\` do repo, com `.gitignore`), nunca global.
3. Propor um `CLAUDE.md` enxuto (≤ 6 KB) na raiz do repo: regras, aprovados, estado atual e onde estão os docs.
   Mostrar ao Davi antes de gravar.

## Fase 1 — telas nítidas (vitória rápida)
- Diagnosticar com números: resolução da textura × pixels na tela em 1440×900 e 390, mipmap, anisotropia
  (`renderer.capabilities.getMaxAnisotropy()`), DPR, carregamento das fontes no canvas.
- Propor e implementar a menor correção que resolva: textura maior + anisotropia, ou **troika-three-text**
  (texto SDF, compatível com Three.js puro). Comparar peso no bundle antes de adicionar dependência.
- Evidência: capturas antes/depois de todas as telas, desktop e mobile, PT/EN; lint/build/testes.
- **Gate Davi.**

## Fase 2 — referências (antes de gerar qualquer 3D)
Montar `drf-v2\docs\design\M16-REFERENCIAS.md` (e uma página HTML local de galeria, fora do build) com:
- **DRF-01 padrão 2026**: o que muda no regulamento 2026 (carro menor e mais estreito, aero ativa, halo, rodas,
  sidepods), com fontes oficiais (FIA). Silhueta-alvo e paleta da pintura autoral.
- **Garagem elevada**: referências de vista de cima para a pista (andar superior do box/paddock), guarda-corpo,
  vidro, como o piso e a altura ficam *intencionais* (a M15 corrigiu um desnível *acidental*; agora é desenho).
- **Corrida ao fundo**: quantos carros, distância, traçado visível, como a velocidade aparece de cima.
- **Props**: controle (inspirado, sem marca), handgrip, demais objetos que o Davi apontar.
Referências são estudo; não entram no site. **Gate Davi** (ele escolhe a direção de cada item).

## Fase 3 — pipeline de IA 3D (teste com UM prop)
1. Inventário (sem baixar): para cada gerador, licença (uso público? restrição de território?), VRAM, tamanho,
   se gera PBR, se roda na RTX 3060 12 GB. Candidatos de partida (conferir no Hugging Face na data):
   - **Hunyuan3D 2.x / 2mini** (Tencent Community License; exclui UE/Reino Unido/Coreia do Sul — conferir texto;
     forma ~10 GB VRAM, textura completa exige mais: verificar modo low-VRAM/mini).
   - **TripoSR** (MIT, ~6 GB, sem PBR) e **Stable Fast 3D** (Stability Community License, grátis abaixo de US$ 1 mi/ano).
   - TRELLIS/TRELLIS.2 (MIT) exigem 16–24 GB: registrar como "não cabe".
   - Imagem de entrada: gerador de imagem local com licença aberta (ex.: FLUX.1-schnell, Apache 2.0) ou imagem
     fornecida pelo Davi. Conferir licença do que for usado.
2. Mostrar lista e total em GB ao Davi; manter ≥ 60 GB livres no C:. **Esperar ok.**
3. Gerar **só o handgrip** primeiro: imagem → 3D → limpeza no Blender (decimar, corrigir normais, UV/bake,
   escala real) → GLB otimizado (glTF-Transform/Draco/KTX2 se compensar) → orçamento de triângulos e KB definido
   antes → integrar no lugar do procedural, mesmo enquadramento.
4. Relatar tempo de geração, tamanho, triângulos, draw calls antes/depois. **Gate Davi.**
   Se a IA 3D não chegar no nível, dizer isso com honestidade e propor alternativa (asset CC0 ou Blender autoral).

## Fase 4 — garagem elevada + corrida ao fundo (só após fases 1–3)
- Documento de desenho antes do código: nova altura, linha do horizonte, o que muda na **câmera aprovada**
  (impacto explícito; o Davi aprova trajetória por trajetória), traçado, nº de carros, LOD, instancing, orçamento.
- Carros de fundo: versão leve do DRF-01 + variações de pintura autorais; vários carros com instancing/LOD.
- Mobile: menos carros, degradação definida; reduced motion: corrida parada ou mínima; integrar com o áudio
  existente (prioridade de passagem, opt-in, volume/mute).
- Resolver também a oclusão da passagem pela ficha/hero (pendência da M15) na nova composição.
- **Gate Davi.**

## Fase 5 — DRF-01 padrão 2026
Base IA 3D + limpeza Blender (superfícies finas de asa, halo e simetria costumam sair ruins da IA: esperar retrabalho).
Pintura autoral DRF. Preservar o encaixe na cena e a câmera. **Gate Davi.**

## Fase 6 — troca dos demais props
Controle (inspirado, sem logo), estojo, placa REC/PE, cartão científico e o que o Davi apontar, usando o pipeline
validado na Fase 3. **Gate Davi.**

## Relatório de cada fase
Em `drf-v2\docs\production\MISSAO-16.md` (seção por fase): o que mudou, arquivos, commits, testes e smoke reais,
números com metodologia, capturas (caminhos absolutos Windows), limitações, e a linha "Aprovação do Davi: pendente".
