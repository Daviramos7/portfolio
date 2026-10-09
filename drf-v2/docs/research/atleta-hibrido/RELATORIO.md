# Atleta Híbrido — Missão06 PERFORMANCE LAB

Auditoria experimental local de 09/10/2026. Entrega ao Lead; nenhum conteúdo publicado. Cada afirmação relevante recebe uma das classificações exigidas. As severidades abaixo são avaliações desta auditoria, não comprovação de impacto em produção.

## Revisão, isolamento e ambiente

- **Confirmado por execução:** original `AtletaHib`, branch `main`, SHA `0ae9190b15b9da943c3c640eddd9fd5e9ecf0b84`, status inicial/final vazio. Não foi encontrado AGENTS no repositório nem nos dois diretórios ancestrais consultados. Evidências: `copy-manifest.json`, `final-state.json`, `source-index.json`.
- **Confirmado por execução:** worktree do portfólio em `feat/drf-engineering-research`, base `175820af7937840f4a7367bfd5dedc2a76ae8269`. Escrita versionável restrita a `drf-v2/docs/research/atleta-hibrido/`. Nenhum commit, push, merge ou deploy. A autorização deste turno substitui as restrições antigas de instalação/execução e especifica esta branch.
- **Confirmado por execução:** cópia de 178 arquivos rastreados por `git show HEAD:path`, em `.agent-grid/labs/mission06/atleta-hibrido/run-20261009-1410`. Sem env do autor, credenciais, dados de usuário ou node_modules originais. Instalações somente na cópia; nenhuma alteração de pacote/lock do portfólio. Manifesto com os caminhos, não conteúdo privado.
- **Confirmado por execução:** Windows 11 Home 10.0.26200; 8 threads lógicos; RAM física 34.278.518.784 bytes (~31,92 GiB), livre em amostra ~16,1 GiB; Node 22.21.0, npm 11.6.2, pnpm 11.9.0, Python 3.13.9, Chrome 155.0.8059.39, Playwright 1.58.2 isolado. Máquina compartilhada, carga ambiente não controlada. `environment.json`.
- **Confirmado por documentação/código:** scripts/lifecycle inspecionados antes dos comandos do projeto: `package.json:6-16`, `vite.config.js:1-6`, `pnpm-workspace.yaml:1-6`, `scripts/smoke-polish.mjs:1-106`. Não há package-lock: usou-se pnpm frozen com lock existente e `--ignore-scripts`; o lifecycle esbuild permitido pelo workspace permaneceu desabilitado e o build funcionou.
- **Confirmado por execução:** skill Supabase solicitada foi lida. Nenhuma feature Supabase foi alterada, SQL aplicado ou conta conectada. A consulta pública ao changelog pela ferramenta web falhou por content-type markdown; registro em `attempts.json`. Não impede analisar o código fixado nesta revisão.

## Problema, solução e arquitetura

| Classificação | Evidência e conclusão |
|---|---|
| Declarado pelo autor | Reunir alimentação, hidratação, recuperação, força e cardio, preservando origens e evitando contagem dupla. `README.md:5-16`. |
| Confirmado por documentação/código | Web React 19 + TypeScript + Vite; componentes → serviços Supabase → Auth/PostgreSQL; regras determinísticas em `src/domain`. `package.json:18-40`, `src/lib/supabaseClient.ts:1-30`, `src/domain/buildDailyTruth.ts:11-85`. Não há backend Node separado no pacote. |
| Confirmado por documentação/código | Verdade diária reúne nove consultas por usuário e janela local; preserva origem por campo e separa kcal de sessão de totais diários. `buildDailyTruth.ts:19-85,100-132`, `cardioRules.ts:3-12`. |
| Confirmado por documentação/código | Políticas SQL de propriedade com `auth.uid()` existem; migrations adicionam proteção de vínculos. `database/policies.sql:4-35`; `database/migrations/20260928194615_public_release_security_hardening.sql:11-142`. Isto não comprova RLS aplicada no banco. |
| Confirmado por documentação/código | Android Bridge documenta Kotlin/Compose, Health Connect e Ktor, companion v4.1.3; pacote Web v4.1.2. `README.md:22-42,86-101`, `android_bridge/README.md:1-24`. |

Todas as referências de fonte nesta entrega correspondem ao SHA acima; linhas e blobs constam de `source-index.json`.

## Funcionalidades e caminhos reais

| Classificação | Funcionalidade / fonte | Limite |
|---|---|---|
| Confirmado por execução | Hoje, Registrar, Academia, Progresso, Saúde e Perfil; smoke em 360/390/412/1440 px. `scripts/smoke-polish.mjs:132-144`; `evidencias/browser/results.json`. | Dados sintéticos e backend interceptado. |
| Confirmado por execução | Força por série, exercício por tempo, concluir força separado de finalizar sessão, cardio manual/aguardando importação/pulado e histórico. `smoke-polish.mjs:145-206`. | Persistência simulada, sem transação de banco real. |
| Confirmado por execução | Cardio real de 25 min preservado, distância ausente null; kcal de sessão fora de totais diários; seleção wearable por campo sem soma de fontes. `imports.test.ts:22-51`, `dailyRules.test.ts:19-76`; fixture complementar. | Não comprova ingestão wearable real nem dedupe concorrente no DB. |
| Confirmado por execução | Comida/sono/cardio/força wearable têm preview JSON, edição invalida preview e conferir não persiste. `smoke-polish.mjs:223-244`. Fingerprint cardio repetido permanece estável; normalização de comida validada. | Preview não comprova importação remota; fingerprint não comprova restrição única aplicada. |
| Confirmado por execução | Ausência diária permanece null; zero explícito de água permanece 0; fronteira local 02:30Z → dia anterior em São Paulo. `mission06.test.ts:27-47`. | A revisão semanal tem inconsistências abaixo. |
| Confirmado por execução | Água: um clique de +200 ml, 1200 → 1400 ml, uma chamada RPC mock; `evidencias/water/water-results.json`. | Não valida atomicidade/concorrência de `increment_daily_water` no PostgreSQL. |
| Confirmado por execução | Modal de exclusão prende foco, Escape cancela e devolve foco; logout global emite scope global no mock. `smoke-polish.mjs:207-219,247-253`. | Revogação real de JWT/sessões não foi testada. |
| Confirmado por documentação/código | Plano/fila Upper-Lower, prontidão, sono corrigido, peso, check-in e revisão semanal têm domínio/serviços e telas. `README.md:48-57`, `src/domain/readiness.ts:62-139`, `src/services/analyticsService.ts:19-175`, testes existentes. | A presença de tela/testes não confirma todos os fluxos possíveis. |

## Execuções e startup

Todos os comandos abaixo usaram a cópia isolada; testes iniciais sem env, variáveis VITE/SUPABASE herdadas removidas do processo, TZ São Paulo. stdout/stderr completos e condições em `evidencias/runs.json` e logs correspondentes.

| Comando | Exitcode | Walltime | Classificação |
|---|---:|---:|---|
| `pnpm.cmd install --frozen-lockfile --ignore-scripts --store-dir ./pnpm-store --reporter append-only` | 0 | 7.447 s | Confirmado por execução |
| `pnpm.cmd test` | 0 | 6.039 s | Confirmado por execução |
| `pnpm.cmd run lint` | 0 | 24.122 s | Confirmado por execução |
| `pnpm.cmd run build` | 0 | 11.842 s | Confirmado por execução |

- **Confirmado por execução:** 22 arquivos / 283 testes existentes PASS. Não é percentual de cobertura. Lint/build são verificações técnicas, não funcionalidades. Build inclui typecheck; não houve execução separada do script typecheck.
- **Confirmado por execução:** build alerta para chunk inicial de 538,10 kB minificado / 156,43 kB gzip. Build não falhou; estes tamanhos não são tempo de carregamento. `build.log`.
- **Confirmado por execução:** complemento final: 4 PASS / 3 FAIL em 7 testes, exitcode 1, 8.870 s. Os FAILs são regressões reproduzidas, mantidas no relatório e no harness. `complementary.log`, `complementary-run.json`.
- **Confirmado por execução:** startup `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5280 --strictPort`; HTTP 200 após 0.741 s. `node scripts/smoke-polish.mjs`: exitcode 0, 58.854 s; ciclo incluindo shutdown 59.786 s. 89 capturas verificadas, sem overflow nos critérios do script ou pageerror. Capturas selecionadas desktop Hoje e mobile Hoje sem dados foram também inspecionadas visualmente.
- **Confirmado por execução:** smoke de água: exitcode 0, 16.610 s; servidor encerrado. `water/run.json`.
- **Confirmado por documentação/código:** interceptador permite somente origin do Vite; origin Supabase é loopback sintético 5289 com fulfill; demais origins abortados. Sem teste de carga em serviços terceiros. `smoke-polish.mjs:49-97`. Não há WebGL na stack auditada, portanto fallback WebGL não se aplica a esta execução.

**Confirmado por execução:** checagem explícita de `console.error` já iniciada ao receber o pedido de fechamento: `node scripts/mission06-console.mjs`, exitcode 1, wall smoke 48,135 s, ciclo com shutdown 48,904 s; 11 mensagens `Failed to load resource: net::ERR_FAILED`, nenhum pageerror (assertion anterior passou). FAIL preservado em `console-browser.log` e `console-run.json`; capturas adicionais preservadas no laboratório em `console-output/`. **Não verificado:** URL/causa exata dos recursos; compatível com bloqueio de origins externos pelo harness, mas a instrumentação não registrou URLs. Não atribuir defeito de produção nem afirmar console limpo. Sem rerun após supervisão.

## Benchmarks locais

**Confirmado por execução:** funções reais `buildNutritionTruth`, `buildCardioTruth` e `normalizeMealImportPayload`, com saída conferida antes de medir. Fixture sintética determinística, identificador/seed 6092026 (sem RNG). Agregações: n=1.000/10.000/50.000 linhas; normalização: n=1/50/250 itens, respeitando limite de importação de 250. Geração das fixtures fora do cronômetro. Fontes: `nutritionRules.ts:11-36`, `cardioRules.ts:3-12`, `mealService.ts:114-153`; reprodução em `repro/mission06.test.ts`.

**Confirmado por execução:** 20 chamadas de warmup, 40 repetições de lotes de 10 chamadas por caso. Mediana e p95 dos **tempos médios por lote**, em ms por chamada média. P95 pelo nearest-rank sobre 40 médias; não mede cauda individual, HTTP, UI ou usuário. `performance.now`; menor delta positivo observado 0.0002000 ms é observação do relógio, não garantia de precisão. A resolução efetiva é limitada por batching, GC, JIT e carga compartilhada. Última rodada após desligar o smoke próprio; nenhuma afinidade/isolação de CPU.

| Função | n | Mediana ms | p95 das médias ms | Wall medido ms | RSS antes → depois MiB |
|---|---:|---:|---:|---:|---:|
| nutrition | 1,000 | 0.2192 | 0.3037 | 93.53 | 64.8 → 71.8 |
| cardio | 1,000 | 0.0721 | 0.1017 | 29.56 | 72.0 → 72.1 |
| nutrition | 10,000 | 2.0307 | 2.2574 | 812.09 | 73.6 → 89.2 |
| cardio | 10,000 | 0.5881 | 0.6891 | 240.81 | 89.2 → 89.2 |
| nutrition | 50,000 | 10.4316 | 11.8542 | 4290.04 | 109.7 → 105.9 |
| cardio | 50,000 | 3.6966 | 4.1883 | 1506.86 | 110.6 → 180.4 |
| meal-normalization | 1 | 0.0054 | 0.0059 | 2.20 | 180.5 → 180.5 |
| meal-normalization | 50 | 0.0475 | 0.1152 | 22.81 | 180.8 → 173.5 |
| meal-normalization | 250 | 0.1742 | 0.2240 | 75.22 | 173.2 → 173.3 |

**Confirmado por execução:** RSS são **snapshots do worker Vitest**, incluindo módulos/fixtures, sem baseline exclusivo por função; não pico, não delta de memória retida e não RAM do produto. Wall da tabela soma apenas a janela medida de 400 chamadas, excluindo warmup e preparação. Amostras brutas e valores sem arredondamento em `mission06-results.json` / `benchmarks.csv`. Resultados locais não representam resultado profissional, ganho antes/depois, SLA ou capacidade de produção.

## Problemas, reprodução e severidade

| Classificação | Problema / severidade analítica | Reprodução / resultado | Fonte e limite |
|---|---|---|---|
| Confirmado por execução | P2: ausência semanal exportada como zero | Todas as tabelas vazias: avgSteps/avgActiveKcal/totalKm retornam 0; teste espera null. | `analyticsService.ts:55-81,94-110,373-388`; `checks.weeklyEmpty`. UI mascara alguns zeros com `--` (`WeeklyReviewView.tsx:111,171-172`), sem resolver contrato/exportação. Impacto real em usuários não medido. |
| Confirmado por execução | P2: média de kcal ativas usa dias sem aquela métrica | Dois dias wearable: active_kcal=500 e null com passos; resultado 250, média dos valores conhecidos 500. | `analyticsService.ts:100-106`; `checks.weeklyPartial`. Fixture mock, nenhuma consulta DB real. |
| Confirmado por execução | P2: dia com zero passos excluído de “dias com registro” | Dois dias steps=0 e 10000: stepDays=1 e média 10000; média dos dias conhecidos 5000. | `analyticsService.ts:104-105`; `checks.weeklyZero`. Proprietário deve confirmar se deseja média de dias ativos; se sim, rótulo/contrato precisam explicitá-lo. |
| Confirmado por execução | P3: aviso de bundle grande | `pnpm run build`: chunk >500 kB, build PASS. | `build.log`; sem evidência de lentidão percebida ou impacto mobile real. |

**Confirmado por execução — FAILs instrumentais preservados:** instalação inicialmente falhou por omissão de `pnpm-workspace.yaml` na cópia (não defeito do projeto); pnpm exec tentou revalidar store e abortou sem TTY (harness corrigido usando CLI Node instalada); benchmark excedeu timeout padrão de 5 s (corrigido para 30 s, sem alterar código auditado); primeira checagem de água buscou `1400 ml` em vez de `1.400 ml` (seletor corrigido). `attempts.json`, `complementary-attempt1.*`, `attempt2-*`, `attempt3-*`, `water/attempt1-*`. Rodada intermediária de benchmark concorria com smoke e não é a tabela final. Nenhum desses FAILs é atribuído a produto/produção.

## Bloqueios e recomendações

- **Bloqueado:** RLS/DB/Auth reais, migrations, concorrência de importação/água e persistência durável. Não foi verificada stack Supabase isolada disponível: CLI ausente e nenhuma escuta na porta usual 54321; não se instalou stack pesada nem usou backend remoto. Alternativa executada: serviços mockados, fixtures e smoke interceptado. Testes SQL existentes validam texto da migration, não aplicação ou isolamento real.
- **Bloqueado:** build/startup Android e Health Connect real. Java disponível, adb/gradle ausentes do PATH, nenhum aparelho/plataforma conectado nesta missão. Não foi instalado SDK nem copiada credencial. Omitir alegação de integração Android end-to-end validada.
- **Não verificado:** demo pública, uso profissional, volume real, resultados de saúde, cobertura de testes, autoria exclusiva e responsabilidades individuais. URL declarada no README: https://atleta-hib.vercel.app; não foi acessada/testada.
- **Confirmado por documentação/código:** README `78-84` alerta contra replay indiscriminado de migrations e registra problema histórico em migration. Nenhum replay realizado; não transformar aviso em falha atual do banco.
- **Não verificado:** recomendações ainda não implementadas: unificar critérios de ausência/zero/média conhecidos no serviço semanal e export; manter contagem de observações por campo; decidir rótulo de média de passos; adicionar regressões mínimas ao projeto após autorização do proprietário. Avaliar divisão do chunk somente após medir uso real em condições adequadas.

## Candidatos ao painel DRF e texto PT/EN

| Classificação | Candidato / origem / condições |
|---|---|
| Confirmado por execução | “283 testes unitários passaram nesta revisão”, origem `test.log`, em cópia local nesta data; sem percentual de cobertura nem alegação E2E. |
| Confirmado por execução | “Smoke com fixtures sintéticas em quatro viewports; 89 capturas”, `browser/results.json`; pode comunicar método de validação, sem usuários reais ou promessa de compatibilidade universal. |
| Confirmado por execução | “Agregação nutricional de 50 mil registros: mediana 10.43 ms por chamada média de lote”, origem benchmark local; exige contexto/limites completos. Não recomendado como destaque público isolado. |
| Não verificado | Contribuição pessoal: pendente de confirmação de escopo, decisões e colaboração. Histórico de commit não comprova exclusividade. Nenhum candidato foi escrito no catálogo. |

**Confirmado por documentação/código — rascunho PT:** “Aplicação para organizar alimentação, hidratação, recuperação e treino de força com cardio. O cliente React/TypeScript usa serviços Supabase e regras determinísticas para consolidar registros manuais e importados com origem explícita.” Fontes: README `5-57`, `buildDailyTruth.ts:19-85`.

**Confirmado por execução — complemento PT:** “Nesta revisão, 283 testes unitários e um smoke local com dados sintéticos passaram. A auditoria complementar reproduziu três inconsistências na revisão semanal; banco/RLS e Health Connect reais permanecem sem validação nesta rodada.”

**Confirmado por documentação/código — draft EN:** “An application for organizing nutrition, hydration, recovery, strength training and cardio. Its React/TypeScript client uses Supabase services and deterministic rules to consolidate manual and imported records with explicit provenance.” Same sources as PT.

**Confirmado por execução — EN validation note:** “At this revision, 283 unit tests and a local browser smoke using synthetic data passed. Additional checks reproduced three inconsistencies in weekly review calculations; live database/RLS and Health Connect validation remain blocked in this audit.”

## Questões ao proprietário e handoff

**Não verificado:** confirmar papel pessoal e colaboração; decidir média por dias conhecidos versus dias ativos; confirmar política editorial para zeros/ausência no export; indicar futuramente stack descartável e aparelho Android, caso queira validar os bloqueios. Não solicitar credenciais de produção.

**Confirmado por execução:** entrega contém relatório, logs/JSON/CSV sanitizados, capturas sintéticas e três scripts pequenos de reprodução; evidências somavam ~7,4 MB na conferência de 14:19. Tempo de trabalho isolado registrado desde a cópia: 523,176 s até essa conferência (~8 min 43 s), excluindo leitura preparatória não cronometrada. Não há medição de CPU/energia ou pico RSS; snapshots do worker na tabela. Instalação de Playwright reportou 12 s arredondados pelo npm, sem walltime monotônico próprio (`attempts.json`); não inventar esse tempo.

**Confirmado por execução:** original terminou no mesmo SHA e status limpo; servidores próprios encerrados e portas 5280–5289 sem escuta na conferência. `final-state.json`, `browser-run.json`, `water/run.json`. Estado final rechecado no fechamento. Necessidade pontual do Lead: revisar as três inconsistências e a seleção editorial; nenhuma correção de produto foi aplicada. BrasilScore não iniciado; aguardando follow-up do mesmo worker.

**Confirmado por execução — fechamento:** 2026-10-09T14:24:31.499149-03:00; 845.493 s desde a cópia (~14.1 min), preparo anterior fora dessa medida. Original novamente limpo, portas de laboratório livres, helpers próprios encerrados. Somente a pasta autorizada de research aparece no git status do portfólio.

**Confirmado por documentação/código — nota factual solicitada pelo Lead:** a captura `390-hoje-sem-dados.png` mostra Água 0 ml, mas `scripts/smoke-polish.mjs:32` fornece explicitamente `daily_logs` com `water_ml: empty ? 0 : 1200`. Portanto essa captura não testa água ausente; não se presume que toda UI preserve unknown a partir do domínio null. **Não verificado:** política editorial de exibir água realmente ausente requer confirmação; nenhum quarto bug ou rerun. README de reprodução corrigido seletivamente de mojibake e uma nota duplicada de console removida; comandos, benchmarks e harness preservados.
