# Missão 12 — Frontend/UX

Worktree drf-frontend-ux, branch feat/drf-engineering-ui, base 32788f606febb87b93eabdf94223feee626607e3. Tipografia em 1a713f8; alterações seguintes permanecem exclusivas da UI, teste próprio e documentação autorizada. Nenhuma mudança de Scene/câmera, contratos, conteúdo, áudio, CV, App, configuração, dependências ou V1.

## Entrega

Geist era usada tanto nos títulos quanto na prosa. Agora Barlow Condensed 700 identifica títulos/estações, Geist permanece no corpo/controles/stack e mono nativa nos instrumentos. Um WOFF2 local de 22.444 bytes com SIL OFL 1.1; fonte, hash, licença, tokens e specimen pré-aplicação em [typography.md](../design/typography.md). Sem fonte remota em runtime. Canvas precisa de carregamento e redraw pela frente 3D: CSS não altera texturas automaticamente.

Três interações originais: abas de case, inspeção de fonte e cópia contextual de medição. Autoria, fontes oficiais, licenças e comparação em [component-adoption.md](../design/component-adoption.md). Recruiter mantém leitura linear, navegação persistente e PDF público aprovado. Dados canônicos não foram alterados; nenhuma camada A/B/C foi inferida. Educação (6º período/dezembro de 2027), LinkedIn e qualificações existentes continuam disponíveis.

## Verificações executadas

- npm run lint e npm run build: PASS. Aviso existente de chunk SceneRoot >500 kB; não alterado fora de escopo.
- node --test tests/foundation.test.mjs tests/trackside.test.mjs tests/rescue-3d.test.mjs tests/art-direction.test.mjs tests/editorial-content.test.mjs tests/mechanical-polish.test.mjs: 37 PASS.
- node tests/editorial-ui.test.mjs, URL 5175/capturas final-catalog: 174 verificações PASS, nove programas × PT/EN × 1440/390/320. Bounds e elementFromPoint conferem nome/resumo/todas as tecnologias/abrir case visíveis; não apenas área rolável. Sem erros registrados.
- node tests/identity-ui.test.mjs (preview compilado 5175): 125 verificações PASS. Glyphs Barlow efetivamente renderizados via CSS.getPlatformFontsForNode; Geist no corpo; cinco estações; tabs/setas/End/Escape/foco/canvas preservado; cada fonte/URL; recibo completo e rejeição clipboard; reduced estático; WebGL indisponível; nove cases lineares; revisão local ausente em produção mesmo cv-review=1; GET PDF público com SHA256 igual ao arquivo canônico.
- node tests/browser-smoke.mjs: 13 grupos PASS, incluindo history/scroll/retorno Recruiter, idioma, teclado, console/rede e fallback. Resultados em integrated-smoke/smoke-result.json.
- node tests/rescue-ui.test.mjs: 49 verificações PASS (JSON grava 48 antes da última asserção de console/rede). A primeira execução após adicionar Copiar encontrou incompatibilidade no arranjo mobile toolbar/política. Runtime corrigido para comandos 2×2 de 44 px e política ao lado; teste existente não foi modificado.
- DRF_IDENTITY_PHASE=dev node tests/identity-ui.test.mjs, Vite DEV 5175: 9 PASS. Sem flag não há input; com cv-review=1 há RASCUNHO explícito; PDF sintético anônimo selecionado localmente, download real com hash idêntico; substituição/unmount revogam URLs. Geist via junction e Barlow retornam 200. Primeira tentativa DEV falhou no coletor de erros sem diagnóstico persistido; harness passou a salvar diagnóstico antes da asserção, e as duas execuções seguintes passaram (última com checagens explícitas de fontes).
- git diff --check: PASS. Nenhum teste anterior, configuração ou catálogo modificado.

O teste identity usa Chrome instalado headless/CDP, perfis temporários isolados e input/pointer reais do protocolo; a permissão clipboard só é concedida ao perfil de teste. Guarda documento antigo antes de navegar; espera documento novo, fonts.ready, scene ready/unavailable, dois RAF e fim das animações finitas. Não há sleep de 15 segundos nem WebGL mock nas capturas Cinematic; fallback tem fixture explícita separada. A preferência nativa reduced é verdadeira nesta máquina; Cinematic foi escolhido na própria UI, sem emulatedMedia.

## Evidências

Raiz absoluta: C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/mission-12-ui/

- specimen-typography-specimen.png, capturado antes da aplicação ampla.
- before/after-garage, case e recruiter-{1440,390,320}-{pt,en}.png: comparáveis de tipografia com Atleta/Cinematic.
- before/after-station-{zona}-1440-pt.png: cinco funções de estação.
- after-sequence-case-01/02/03-{largura}-{idioma}.png; after-sequence-source-{sourceId}-{largura}-{idioma}.png; after-sequence-copy-01/02-390-en.png: interações reais, sequência de estados sem alegar vídeo.
- after-reduced-case-390-en.png e after-fallback-evidence-390-en.png.
- final-catalog/: 54 capturas dos nove programas/idiomas/larguras e results.json.
- dev-local-review-390-pt.png, dev-identity-results.json; after-identity-results.json; instrument-smoke/ e integrated-smoke/.

Antes preservados; screenshots fora de src e do diff versionado. Revisão visual levou à compactação do índice de fontes, retirada do identificador de zona duplicado no cabeçalho de leitura e layout mobile da toolbar. A estação tem scroll interno para conteúdo completo; o requisito de ficha fechada com resumo/stack/case no frame foi verificado separadamente pelos 174 checks.

## Limites / integração

Sem teste físico mobile, medição CPU/GPU/performance de dispositivo, auditoria completa AA ou execução/gravação das demos externas. A prova de PDF usa fixture sintética, não revisa o novo currículo privado da Analyst nem DOCX/LibreOffice. Não foi copiado PDF para public, alterado cvUrl ou publicado rascunho. Áudio/carro e harmonização dos monitores Canvas são responsabilidade 3D; UI preserva controles/estado existentes, sem alegar reprodução de áudio validada. A geometria/câmera aprovada permanece: UI não corrige oclusão física de placas 3D. Nenhuma integração/push/deploy executada.
