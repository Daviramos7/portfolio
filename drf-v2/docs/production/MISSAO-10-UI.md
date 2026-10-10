# Missão 10 — UI contextual

Branch: feat/drf-engineering-ui. Base confirmada: b99a8aa, sincronizada por fast-forward com worktree limpo. Lote limitado a showcase de programas e feedback de leitura; sem alteração de cena, contratos, conteúdo, CV, controle de movimento ou arquitetura.

## Diagnóstico e mudança

Reutilizada a Fase 0 do Lead. Baseline local complementar: 18 checagens dirigidas e 49 do smoke existente passaram; títulos das cinco estações e labels dos hotspots atuais ficaram legíveis, sem overflow nos casos exercitados. Nenhuma regressão de UI demonstrada nesse recorte. Hotspots de outras estações ocultos fora da câmera não são prova de defeito. Geometria/oclusão e os novos monitores in-world continuam sob responsabilidade 3D.

ProgramIdentity deriva seleção, título completo, qualificação e evidências do catálogo do Lead. Indicador de posição tem nove segmentos, sem porcentagem de domínio. Seletor nativo, ações e foco são preservados. ProgramEvidenceStamp também acompanha o cabeçalho do dossiê, só com contagem; a comparação visual levou a remover a qualificação repetida ali, preservando a já existente no corpo. CSS acrescenta feedback hover/pressed e duas transições finitas de 180 ms apenas com movimento efetivo permitido. Não há nova galeria, estado central, catálogo paralelo ou animação de valores inventados.

## Validação executada

- npm run lint e npm run build: PASS. Build mantém aviso preexistente do chunk SceneRoot acima de 500 kB (608,65 kB); não é medição de performance.
- node --test tests/foundation.test.mjs tests/trackside.test.mjs tests/rescue-3d.test.mjs: 28/28 PASS.
- node --test tests/rescue-ui.test.mjs, URL http://127.0.0.1:5175/: 49 checagens PASS; arquivo existente intacto. Inclui valores/contextos reais, PT/EN, toolbar, movimento reduzido, estados loading/unavailable e leitura sem WebGL.
- node --test tests/premium-ui.test.mjs: 35 checagens PASS. Nove identidades/qualificações canônicas, canvas preservado, teclado na seleção, Escape/retorno de foco após RAF, histórico, Cinematic explícito sem ligar áudio, reduced estático, cinco estações/hotspots atuais e larguras 1440/390/320. Console/rede sem erros registrados.
- git diff --check: PASS antes do commit.

O primeiro assert de retorno de foco foi antecipado em relação ao RAF usado pela UI. O harness passou a aguardar os frames antes de verificar o foco; nenhuma implementação foi alterada para encobrir a falha. Capturas nativas e Cinematic usam nomes separados para não comparar câmeras diferentes como mudança de UI.

## Evidências e limites

Raiz absoluta: C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/mission-10-ui/

Pares antes/depois: baseline-garage-1440.png / final-garage-1440.png; baseline-station-garage-1440.png / final-station-garage-1440.png; baseline-garage-390-en.png / final-garage-390-en.png; baseline-garage-320-en.png / final-garage-320-en.png. Cinco estações desktop: final-station-{zoneId}-1440.png. Leitura mobile: final-detail-{390,320}-en.png. Cinematic escolhido pela UI: final-cinematic-explicit-1440.png e final-garage-cinematic-1440.png. Resultados: final-results.json e after-smoke/p1-directed-results.json. As capturas baseline anteriores foram conservadas.

Chrome instalado executado headless via CDP, preview compilado 5175, documento novo confirmado, fontes prontas, sceneStatus ready/unavailable e dois RAF antes da captura. MatchMedia nativo reduced=true; nenhuma emulação de preferência na prova Cinematic. Mobile é viewport emulado, sem dispositivo físico ou medição CPU/GPU. Ready e screenshot demonstram frame visível nos cenários capturados, não disponibilidade universal de WebGL. Sem gravação contínua nova; imagens e asserts verificam estados/transições finitas, não fluidez de todo o percurso.

Pendente: revisão/integração do commit pelo Lead e QA dos monitores/câmera/oclusão da frente 3D. O PDF público e a revisão local DEV permanecem os mecanismos existentes. Nenhuma publicação ou alteração de currículo neste lote.
