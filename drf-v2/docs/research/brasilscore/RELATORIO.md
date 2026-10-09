# BrasilScore — Missão06 PERFORMANCE LAB

Auditoria local de 09/10/2026, entrega ao Lead. Classificações nas afirmações relevantes: Confirmado por execução / Confirmado por documentação/código / Declarado pelo autor / Não verificado / Bloqueado. Severidades são avaliações locais, não medição de impacto em produção. Nenhum candidato foi publicado.

## Revisão, ambiente e isolamento

- **Confirmado por execução:** original `C:/Users/davir/OneDrive/Documentos/GitHub/BrasilScore`, branch main, SHA `aadc1e996de265e1e053a1c25567ecdb6bf7bc71`, status inicial limpo; nenhum AGENTS encontrado na busca do repositório. Fonte por arquivos/linhas abaixo sempre corresponde a este SHA; blobs/contagem de linhas em `source-index.json`.
- **Confirmado por execução:** portfólio permanece em `feat/drf-engineering-research`, base `175820af7937840f4a7367bfd5dedc2a76ae8269`. Escrita versionável em `drf-v2/docs/research/brasilscore/**`, mais duas correções editoriais de Atleta explicitamente solicitadas pelo Lead. Sem commit, merge, push, deploy, catálogo ou UI do portfólio.
- **Confirmado por execução:** cópia rastreada em `.agent-grid/labs/mission06/brasilscore/run-20261009-1427`, criada em 2026-10-09T14:26:27.578773-03:00. Sem env, dados de usuário ou dependências originais. Manifesto em `copy-manifest.json`. Não se instalou globalmente nem se ativou lifecycle de dependências.
- **Confirmado por execução:** Windows 11 Home 10.0.26200; Node 22.21.0, npm padrão 11.6.2, npm isolado 10.9.4, Python 3.13.9, Chrome 155.0.8059.39. Host confirmado: 8 threads lógicos, 34.278.518.784 bytes RAM (~31,92 GiB). Máquina compartilhada; sem controlar carga, afinidade ou temperatura. Playwright 1.58.2 do laboratório anterior reutilizado somente leitura. `environment.json`.
- **Confirmado por documentação/código:** scripts/lock inspecionados antes de executar; `package.json:6-14`, `package-lock.json:1-31`, `vite.config.js:4-30`, `.hintrc:1-16`. Nenhum lifecycle de instalação na raiz; todos os installs usaram ignore-scripts. Dev combina Express e Vite, build é apenas Vite, test é Vitest, lint é webhint sobre sete HTMLs. Não existem scripts separados `typecheck`, `test:e2e`, benchmark ou lint ESLint/JS no package.

## Problema, arquitetura e conteúdo

| Classificação | Conclusão / fonte |
|---|---|
| Declarado pelo autor | Centralizar classificação, clubes, partidas e favoritos do Brasileirão Série A. `README.md:12-18,21-54`. |
| Confirmado por documentação/código | Frontend multipágina HTML/CSS/JavaScript ES Modules e DOM; API Express/Node separada; dotenv no entrypoint. `package.json`, `vite.config.js:14-28`, `server/index.js:1-19`, `server/app.js:1-16`. |
| Confirmado por documentação/código | Cliente web chama endpoints internos; proxy valida competição, cacheia payload bruto e normaliza resposta/erros. A única competição configurada é serie-a/BSA, temporada 2026. `assets/js/football/internalFootballProvider.js:1-44`, `server/routes/footballRoutes.js:9-74`, `server/config/competitions.js:1-7`. |
| Confirmado por documentação/código | FootballDataClient tem base fixa football-data.org/v4, token só no backend, fetchImpl injetável e timeout padrão 8 s. Cache em memória TTL 15 min + coalescência in-flight; busca cacheia resultados positivos em localStorage por 30 min. `footballDataClient.js:3-84`, `asyncRequestCache.js:1-45`, `search.js:16-87`. |
| Confirmado por documentação/código | Conta, perfil, favoritos e papel admin são demonstração localStorage; senha local em claro e comparação local. Não há autenticação/API de contas segura. `auth.js:1-74,77-178`; `README.md:18`. Não alegar proteção de contas reais. |
| Declarado pelo autor | `docs/WORKFLOW.md:3-5,33-42` apresenta divisão inicial de trabalho: Davi em arquitetura/backend/integração/revisão, com colaboradores. É plano documental, não comprovação das entregas individuais ou exclusividade. |
| Não verificado | Contribuição efetiva de cada pessoa, uso profissional, usuários reais, resultados de negócio, cobertura de testes e operação publicada. Não inferir a partir de commits nem divulgar link de repositório como público sem confirmar visibilidade. |

## Funcionalidades e ausências

| Classificação | Inventário e evidência | Limite |
|---|---|---|
| Confirmado por execução | API status, teams, standings, matches; competição inválida 400 e rota desconhecida 404. 20 clubes, 20 linhas e uma partida com placar null conferidos. `benchmark-results.json`; rotas `footballRoutes.js:25-72`. | Dados sintéticos via fornecedor local, não futebol atual. |
| Confirmado por execução | Mapeamento de upstream 403/429, JSON inválido, shape inválido e timeout para erro sanitizado 502/504. `benchmark-results.json`; 32 testes existentes também verificam contratos. | Timeout de laboratório 80 ms; padrão do código 8 s não foi esperado em tempo real. |
| Confirmado por execução | Cache quente evita upstream; batches frios com concorrência 4/8 coalescem em uma chamada por batch. `benchmark-results.json`. | Não se aguardou expiração de 15 min nem se testou cache distribuído. |
| Confirmado por execução | Cadastro local, perfil, logout/login, classificação, busca `sao` encontrando `São`, cache positivo da busca e adicionar/remover favorito em 1440×1000 e 390×844. `browser/browser-results.json`; `auth.js`, `profile.js`, `main.js`, `search.js`, `favorites.js`. | Contextos novos/sintéticos; não prova segurança, persistência entre dispositivos ou todos os navegadores. |
| Confirmado por execução | Seis capturas finais sem overflow horizontal da página; duas inspecionadas visualmente. Tab não levou a controle interativo de fundo nos samples refinados do modal. | BODY/foco do navegador apareceu; não afirmar trap completa, auditoria de acessibilidade ou leitura de todas as colunas mobile. |
| Confirmado por documentação/código | Listagem, busca/edição/exclusão administrativas existem na demonstração. `listing.js:1-111`, `registre.html:83-148`. | Não exercitadas no navegador nesta amostragem; papel manipulável no storage não é autorização real. |
| Confirmado por documentação/código | Serviço getMatches e endpoint existem; busca de jogadores retorna sempre `[]`. `internalFootballProvider.js:35-43`. | Não há tela/consumidor ativo de partidas nos JS auditados; UI de partidas e busca real de jogadores estão ausentes nesta revisão, apesar de textos no README. |

## Comandos, resultados e instalação

**Confirmado por execução:** comandos abaixo na cópia, chaves do fornecedor removidas do ambiente do processo, sem env; logs sanitizados completos em `evidencias/`. Não houve acesso a fornecedor externo nos testes/cargas.

| Execução | Comando | Exitcode | Walltime |
|---|---|---:|---:|
| install | `npm.cmd ci --ignore-scripts --no-audit --no-fund` | 1 | 10.390 s |
| install-peer-compatible | `npm.cmd ci --ignore-scripts --no-audit --no-fund --legacy-peer-deps` | 1 | 1.520 s |
| install-npm10 | `node tooling/package/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund` | 0 | 23.209 s |
| test | `node tooling/package/bin/npm-cli.js test` | 0 | 2.705 s |
| lint | `node tooling/package/bin/npm-cli.js run lint` | 0 | 3.613 s |
| build | `node tooling/package/bin/npm-cli.js run build` | 0 | 0.843 s |
| benchmark | `node benchmark.mjs` | 1 | 1.765 s |
| browser | `node browser.mjs` | 1 | 4.296 s |
| browser-refined-focus | `node browser.mjs` | 1 | 7.163 s |

- **Confirmado por execução:** npm11 frozen FAIL por nan@2.28.0 versus resolução 2.29.0; legacy-peer-deps FAIL por entradas canvas/simple-get/encoding/decompress-response/mimic-response ausentes. Logs preservados. Isto é incompatibilidade constatada desses comandos/ambiente, não prova de impossibilidade em todo ambiente.
- **Confirmado por execução:** uma única versão anterior, npm 10.9.4 isolado via `npm pack npm@10.9.4 --ignore-scripts --pack-destination ./tooling --silent` (exitcode 0; tool wall 2,098 s incluindo criação da pasta), instalou frozen. Hash SHA256 antes/depois do lock: `ba721709fa1c085541c6453e6c5a06bc052e22aa4bad7e9eef996835c2bedfba`. **Não houve reconciliação de lock.** `lock-check.json`; árvore completa `dependency-tree.json`, consulta read-only com exitcode 0 em `dependency-tree-run.json`.
- **Confirmado por execução:** 6 arquivos / 32 testes existentes PASS. Não é cobertura percentual. Build PASS gerou sete entradas HTML; não inclui typecheck. `test.log`, `build.log`.
- **Confirmado por execução:** lint exitcode 0, mas log contém sete erros instrumentais `HTMLCanvasElement.prototype.getContext` de jsdom sem canvas e sete hints button-type. Resultado formal 0 preservado; checagem visual/contraste incompleta. Webhint nesses HTMLs não comprova lint de todos os JS nem aprovação funcional. Não se habilitou instalação nativa/lifecycle para maquiar o resultado. `lint.log`.
- **Confirmado por execução:** startup viável em laboratório: createApp/FootballDataClient reais com fetchImpl nativo injetado; API loopback5281, upstream loopback5282, Vite loopback5280. Readiness HTTP 200 em 478.656 ms na rodada final. Apenas target de proxy Vite foi adaptado na cópia 3001→5281 (`vite-proxy-adaptation.json`); bootstrap do laboratório substitui entrypoint dotenv/portas, não código de domínio/rotas. Script npm dev/concurrently não foi iniciado sem adaptação, para evitar porta3001 e acesso remoto.
- **Confirmado por execução:** benchmark exitcode 1 **por FAIL complementar founded**, mas os seis cenários completaram; 11 checks auxiliares PASS / 1 FAIL. Browser refinado exitcode 1: 12 checks PASS / 2 FAIL (o mesmo erro de busca nos dois viewports), seis capturas e nenhum pageerror. Quatro console.error / dois HTTP502 correspondem aos erros de upstream deliberadamente injetados, com URLs e localização registrados. Nenhuma URL externa tentada na fixture; todas seriam abortadas e registradas. `browser-results.json`.

## Benchmarks — API real, upstream sintético

**Confirmado por execução:** três processos de laboratório não foram executados como carga concorrente entre si: benchmark terminou antes do smoke. Dentro do benchmark, Express, mock HTTP e gerador compartilham um único processo Node. O fetchImpl recebe a URL fixa do fornecedor e a mapeia exclusivamente a HTTP loopback; nenhuma requisição chega ao fornecedor. Fixtures: sequência determinística, id 6092026, sem RNG, 20 clubes/20 linhas/uma partida. Upstream agenda 5 ms de atraso, que não é garantia de atraso real nem emulação de latência remota.

**Confirmado por execução:** cinco batches de warmup por cenário, 30 batches medidos, concorrência bounded 1/4/8. Cold limpa cache **antes de cada batch**, mantém conexões/OS aquecidos e coalescência dentro do batch; warm previamente populado. 30/120/240 latências individuais por cenário. Cronômetro performance.now começa antes de fetch e termina após JSON do body. Mediana convencional; p95 nearest-rank sobre **requisições individuais**, diferente do p95 por médias de lote de Atleta. Saída validada por status, n=20, soma IDs210, nome esperado/cidade null, além de checks separados de standings/matches. Throughput = requests/wall da janela; inclui coordenação/clear/verificação do harness. Keep-alive e host compartilhado influenciam números.

| Cache | Concorrência | n requests | Mediana ms | p95 individual ms | req/s local | Upstream calls | Wall medido ms | RSS máx. amostrado MiB |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| cold | 1 | 30 | 6.664 | 9.490 | 142.6 | 30 | 210.38 | 64.0 |
| warm | 1 | 30 | 0.732 | 1.153 | 1200.4 | 0 | 24.99 | 67.7 |
| cold | 4 | 120 | 8.213 | 9.637 | 453.0 | 30 | 264.93 | 72.6 |
| warm | 4 | 120 | 2.010 | 2.358 | 1637.9 | 0 | 73.27 | 80.8 |
| cold | 8 | 240 | 9.639 | 12.370 | 717.7 | 30 | 334.41 | 96.1 |
| warm | 8 | 240 | 3.036 | 4.400 | 1972.4 | 0 | 121.68 | 102.8 |

**Confirmado por execução:** cold teve 30 upstream calls por cenário, warm zero durante medição, comprovando efeito do cache/coalescência sob estas condições. RSS amostrado a cada 5 ms e ao fim de batch: **processo combinado API + mock + gerador**, máximo observado, sem garantia de pico absoluto ou memória exclusiva da API. Não equivale a footprint do app publicado. Amostras individuais, RSS e metodologia em `benchmark-results.json`, tabela em `benchmarks.csv`. Sem orçamento de resolução nominal medido; valores sub-ms dependem do relógio e host. Nenhum número é promessa de produção, integração remota ou resultado profissional.

## Problemas, reproduções e recomendações

| Classificação | Achado e severidade analítica | Reprodução / fonte / limite |
|---|---|---|
| Confirmado por execução | P2: indisponibilidade tratada como nenhum resultado | Upstream local429 → API502 external_rate_limited; busca renderiza “Nenhum clube encontrado”. Reproduzido em ambos viewports; `search.js:62-72,107-124`, captures upstream-error. Console registra erro, mas usuário recebe mensagem de ausência. |
| Confirmado por execução | P2: founded ausente vira zero | `normalizeTeams({teams:[{id:1,name:'Synthetic',founded:null}]})` retorna founded0; expectativa null fica FAIL. `footballDataAdapter.js:72`, benchmark check preservado. Não se mediu incidência em dados reais. |
| Confirmado por execução | P3: fallback de logo ausente | Fixtures crest null acionam `assets/img/team-placeholder.png`; arquivo não está rastreado/não existe no original. 20 imagens quebradas na classificação e uma na busca em cada viewport. `main.js:128`, `search.js:93-94`; URLs DOM registradas em screens.brokenImages e capturas. Vite responde HTML fallback200, por isso não aparece como HTTP404; diagnosticar por naturalWidth0. Não é bloqueio de endpoint externo. |
| Confirmado por execução | Limitação de tooling: npm11 frozen falha | Instalação npm10 frozen PASS com hash idêntico; não generalizar falha para todos os ambientes. Fixar versão de npm suportada/revisar lock após autorização. |
| Confirmado por execução | FAIL instrumental do primeiro probe de foco | Primeiro probe exigia todo document.activeElement dentro do dialog; BODY/foco do navegador produz falso diagnóstico de fuga. `browser-attempt1/`, `browser-attempt1.log` preservados; probe refinado não mostrou controle de fundo focado. Nenhuma falha de trap segura foi reivindicada. |
| Confirmado por documentação/código | Demonstração não apropriada para contas reais | Senha local em claro, admin escolhido no cliente, logs de atualização incluem objeto de usuário. `auth.js:21-36,93-140,153-178`. Logs desta missão só registram errors/fixtures, sem logs de payload pessoal. Não apresentar como autenticação segura. |
| Não verificado | Recomendações ainda não implementadas | Propagar erros sanitizados na busca, preservar null antes de Number, fornecer fallback rastreado, especificar npm suportado; separar/aperfeiçoar validações JS/HTML/acessibilidade. Manter demo explicitamente local ou projetar auth real em escopo futuro autorizado. Nenhuma correção aplicada ao projeto. |

## Bloqueios, candidatos DRF e texto PT/EN

- **Bloqueado:** comportamento do fornecedor real/chave/quotas e integração em produção, por limite desta missão: upstream exclusivamente mock local. Alternativa segura concluída com cliente/rotas reais e HTTP loopback. Não houve carga remota.
- **Bloqueado:** autenticação segura real e UI de partidas/busca de jogadores como entregas funcionais: mecanismos/consumidores ausentes nesta revisão; não substituir pelo demo ou pelo endpoint existente.
- **Não verificado:** painel admin no navegador, credenciais reais, perfil de produção, cache entre múltiplas instâncias, expiração cronológica completa, falhas de storage/limites de persistência, auditoria completa de segurança/teclado. HTML interpola conteúdo em innerHTML; não foi testado XSS nesta amostragem e não se afirma segurança.

| Classificação | Candidato DRF (não publicado) / origem / condições |
|---|---|
| Confirmado por execução | “32 testes de contratos/API e busca passaram”, test.log, SHA/data/npm10 frozen; nunca “32 testes de cobertura” nem E2E remoto. |
| Confirmado por execução | “Proxy local com cache e coalescência conferidos”, benchmark-results.json; seis cenários com concorrência1/4/8 e upstream sintético. Tempo/rate só com contexto completo, sem destacar velocidade do fornecedor. |
| Confirmado por documentação/código | “Frontend multipágina e proxy Express com normalização”, fontes de arquitetura acima. Não atribuir autoria exclusiva antes de confirmação. |
| Não verificado | Contribuição pessoal: plano documental aponta arquitetura/backend/integrações/revisão para Davi, mas realizações efetivas e divisão final precisam do proprietário. |

**Confirmado por documentação/código — PT:** “Aplicação multipágina para consultar clubes e classificação da Série A, com favoritos e perfis demonstrativos armazenados localmente. Um proxy Express mantém a chave do fornecedor no backend, valida a competição e normaliza dados e erros.” Fontes: README12-18, app.js, footballRoutes.js, auth.js. **Confirmado por execução — nota PT:** “Nesta revisão, 32 testes passaram em ambiente isolado com npm10 e lock congelado. API e fluxos web foram verificados com dados sintéticos; integração remota e autenticação real não foram validadas. A auditoria registrou inconsistências na apresentação de erros, ausência de campos e fallback de imagens.”

**Confirmado por documentação/código — EN:** “A multipage application for browsing Série A clubs and standings, with demo profiles and favorites stored locally. An Express proxy keeps the provider key on the backend, validates the competition, and normalizes data and errors.” Same sources as PT. **Confirmado por execução — EN validation note:** “At this revision, 32 tests passed in an isolated npm10 environment using the frozen lockfile. API and web flows were checked against synthetic data; live provider integration and production authentication were not validated. The audit recorded issues in error presentation, missing-value handling, and image fallbacks.”

## Handoff

**Não verificado:** confirmar divisão efetiva de contribuição, natureza educacional/demo, visibilidade/licença do repositório, necessidade de UI de partidas e política de campos ausentes. Lead deve revisar os três achados e candidatos editoriais antes de publicar qualquer conteúdo.

**Confirmado por execução:** entrega em `drf-v2/docs/research/brasilscore/RELATORIO.md`, `evidencias/` (JSON/CSV/logs e seis capturas finais; primeiro probe preservado), `repro/` (copy + três módulos e instruções). Processos próprios encerrados em finally; nenhuma alteração no original. Estado final/tempo total após escrita em `final-state.json`. Não há medição de CPU/energia; RSS somente no escopo declarado. PySpark não iniciado. Correções pontuais solicitadas em Atleta: README legível sem duplicata e ressalva sobre fixture água explicitamente zero, sem alterar harness ou rerodar.

**Confirmado por execução — fechamento:** 2026-10-09T14:39:09.330711-03:00, 761.752 s desde a cópia (~12.7 min), leitura preparatória fora dessa medida; evidências ~0.95 MiB. SHA original inalterado, status final vazio e branch main; portfólio na branch research, nenhuma escuta 5280–5289 na conferência. Servidores/helpers próprios encerrados; demais servidores preservados. `final-state.json`.
