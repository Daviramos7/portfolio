# Iteração 04 — Visual Experience Rescue

Missão09V3, 10/10/2026. Base7712287, branch feat/drf-engineering. Bugs reportados pelo proprietário são critérios abertos, mesmo após os testes anteriores.

## Propriedade e execução

- Lead: app/contracts/conteúdo, integração, testes existentes e checkpoint.
- 3D Creative existente: src/scene, public/scene, RESCUE-3D.md e rescue-3d.test.mjs; câmera, rodas, Trackside, materiais e áudio sequenciais na mesma área.
- Frontend/UX existente: src/features, component-adoption.md, RESCUE-UI.md e rescue-ui.test.mjs; diagnóstico de texto/estados, padrões UI e descoberta do CV.
- Analyst preservado e ocioso; nenhum quarto agente ou worker extra. Codex GPT-6.1-Sol/Medium solicitado aos dois workers. Capacidade inicial consultada40%; não assumir renovação integral.

## Inspeção inicial (não substitui reprodução no navegador)

Controller inicia ambientEnabled=true/audio=off; armazenamento guarda somente idioma/modo. Prefers-reduced-motion vem de matchMedia e a cena recebe o estado sem override. UI atual chama a restrição de movimento de Desativado: potencial feedback ambíguo. O código contém trajeto contínuo, mas isso não comprova o comportamento percebido; diagnóstico browser ainda necessário. Nenhuma preferência de acessibilidade do sistema alterada.

## Currículo

393a2a5 prepara cópia byte a byte do PDF público já disponível na V1, agora em public/cv/Davi-Ramos-Ferreira-public-2026.pdf. SHA256972BB2C0936FF78B1D293AA1DAB33F4BD746B2F76B6B055A748B86B4CE4A81C9. V1 intocada; PDF novo de revisão não é utilizado como download público. Fonte continua curriculo/Davi Ramos 2026.pdf. Lint/build20testes passaram. UI principal de download ainda depende da entrega UX.

Rascunho privado: .agent-grid/artifacts/resume/night-shift/Davi_Ramos_Ferreira_CV_PT_v1.pdf. Revisão apenas DEV+cv-review=1, seleção local; aprovação futura deverá identificar explicitamente qual versão pode substituir o download. DOCX permanece pendente de QA compatível.

## Critérios e evidências

Exigir frames reais de navegação 01→02→03→04→05→01, interrupção, hotspots, histórico, Recruiter e reduced motion; antes/depois e closes das quatro rodas; carro atravessando abertura com áudiooff; PT/EN cinco estações em1440/390/320. Testes automatizados não equivalem a aprovação visual do proprietário. Resultados por área nos relatórios dos workers; capturas anteriores preservadas.

## Diagnóstico confirmado e decisão de movimento

Worker3D verificou Chrome sem emulação: matchMedia(reduce)=true, cena pronta, ambiente pausado e nenhum CAR_PASS agendado. Navegação direta é o ramo de acessibilidade, não demonstra falha da interpolação normal. Estado inicial de ambiente continua true; rótulo Desativado confunde restrição com escolha desligada. Evidências/browserframes devem permanecer no RESCUE-3D.

a1b97c5 adiciona preferência explícita somente na sessão: system(default)/cinematic/reduced. System continua respeitando o dispositivo; escolha cinematográfica não modifica Windows/navegador e não ativa áudio. Teste de regressão verifica mudanças de matchMedia, modos, retorno ao sistema e reset após nova sessão. Lint/build21testes passaram. Workers sincronizados enquanto estavam limpos.
