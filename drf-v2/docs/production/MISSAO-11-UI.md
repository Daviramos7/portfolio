# Missão 11 — contexto do programa selecionado

Branch feat/drf-engineering-ui; base 60b28c436d586db1f46705e0d0e2b4b6e3461d56, worktree confirmado limpo antes do lote. Sem alteração de câmera, cena, catálogo, contratos, V1 ou PDF.

## Causa confirmada e intervenção

O HUD anterior mostrava título, qualificação e seletor; não renderizava resumo ou tecnologias. baseline-diagnostic.json registra summaryPresent=false e stackPresent=false. A captura Cinematic baseline-selected-1440.png mostra o monitor superior parcialmente fora do enquadramento. A ficha HTML oferece acesso equivalente, sem alegar corrigir geometria/oclusão 3D.

ProgramContext.tsx renderiza o resumo completo atual, todas as tecnologias e Explorar projeto / Explore project, além de repositório/demo somente quando o catálogo contém URL. O nome completo permanece em ProgramIdentity. Nenhum resumo alternativo, link ou tecnologia foi inventado. A ficha só aparece após seleção explícita na Garagem; o estado inicial sem projeto continua compacto. Na leitura fica hidden, mantendo o trigger montado para retorno de foco por Escape. SceneRoot não é alterado/remontado pela ficha.

ImmersiveHud.tsx passa o registro/idioma/estado de leitura e o mesmo onInspect já existente. programShowcase.css compõe a ficha abaixo do seletor, com texto → stack → ações de pelo menos 44 px. Sem altura fixa, clamp, corte ou scroll interno da ficha. A tentativa inicial com 136/116 px foi descartada após revisão porque ocultava parte do conteúdo: a validação final exige texto, cada tag e cada ação dentro do viewport e sem oclusão HTML, não apenas presença no DOM.

## Verificação

- npm run lint / npm run build: PASS. Aviso existente de SceneRoot >500 kB (610,99 kB); nenhuma conclusão de performance.
- node --test tests/foundation.test.mjs tests/trackside.test.mjs tests/rescue-3d.test.mjs tests/art-direction.test.mjs: 31/31 PASS.
- node --test tests/editorial-ui.test.mjs: 170 checagens PASS, Chrome instalado headless, preview do worktree em 5175. Nove programas × PT/EN × 1440×900, 390×844 e 320×844; conteúdo/links confrontados com o catálogo atual. Bounds e elementFromPoint de nome, resumo, cada tecnologia e ações; sem overflow horizontal. Fontes prontas, documento novo e sceneStatus antes de captura; espera da animação finita de título, sem sleeps longos. Cinematic escolhido pela UI, sem mudar a preferência do Windows.
- Casos dirigidos adicionais: canvas mantido após seleção/idioma, abrir o case correto, Escape devolve foco ao trigger, history restaura programa, reduced estático, contexto sem WebGL e botão de currículo público existente. Console/rede sem erros registrados. git diff --check executado antes do commit.

## Evidências e pendências

Raiz absoluta: C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/mission-11-ui/

baseline-selected-1440.png e baseline-diagnostic.json documentam o antes. Capturas finais: final-{1440,390,320}-{pt,en}-{projectId}.png, cobrindo os nove registros. final-reduced-320.png e final-fallback-320.png cobrem os estados adicionais. results.json guarda checks e bounds de cada amostra. Exemplo crítico: final-320-en-atleta-hibrido.png mostra resumo completo, sete tecnologias e três ações no frame.

O tamanho da ficha depende do conteúdo: Atleta ocupa aproximadamente metade da altura em 320 px após seleção; não há nove cards nem página atrás da cena. A câmera Cinematic aprovada foi preservada. O monitor superior fora do frame segue pendência da frente 3D; HTML não resolve sua posição física.

Mobile é viewport emulado, sem teste físico, benchmark CPU/GPU ou garantia para conteúdo arbitrariamente maior. As futuras summaries editoriais do Analyst ainda não estão nessa base: o Lead deve repetir o teste dirigido após integrar o catálogo final. Não há alteração de currículo. Encerrado este lote; integração/revisão pelo Lead, sem push ou deploy.
