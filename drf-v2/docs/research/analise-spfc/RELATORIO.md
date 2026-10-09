# Análise SPFC — auditoria experimental Lote02

09/10/2026. Revisão **ff13dc28a6872d4b53f6e203eb241f9b2a1e6f32**. Referências são arquivos/linhas dessa revisão; cópias `source-*.py` em evidencias preservam as linhas. Aprovação experimental não significa produto aprovado nem resultado profissional. Nenhum conteúdo publicado.

## Problema, arquitetura e proveniência

- **Confirmado por execução** — Original `C:/Users/davir/OneDrive/Documentos/GitHub/Projeto-SPFC`, main, SHA acima, status limpo antes/depois; AGENTS não encontrado na ancestralidade inspecionada. [Manifesto](evidencias/manifest.json), [fechamento](evidencias/closure.json). Worker permanece `feat/drf-engineering-research`, base `175820af7937840f4a7367bfd5dedc2a76ae8269`, sem sync/merge/commit/push/deploy.
- **Confirmado por documentação/código** — Automação de estatísticas públicas do elenco: CLI → Selenium/FBref → HTML/Pandas → schema normalizado → CSV por rename de temporário → menu/análises Matplotlib/Seaborn. `pipeline.py:27,135–289`, `main.py`, `menu.py`, `analises.py`. Não há serviço HTTP, BD, scheduler ou pipeline cloud rastreado.
- **Declarado pelo autor** — README relata coleta anterior de46 registros em10,63s e referência manual~480s. **Não verificado** — esses números na execução atual, baseline manual, ganhos profissionais, autoria exclusiva e divisão de responsabilidades. Copyright README atribui Davi Ramos Ferreira; não prova contribuição individual.
- **Confirmado por execução** — Copiados por Git/SHA somente README, requirements, cinco módulos e quatro arquivos de testes. Histórico CSV/assets rastreados não copiados nem tratados como aquisição atual; nenhum env/conta/dado privado/.git/cache/deps copiado. Todas as funções/scripts/testes foram inspecionados antes da execução.

## Inventário e estado

| Classificação | Funcionalidade/estado atual | Fonte |
|---|---|---|
| Confirmado por documentação/código | ChromeDriver via webdriver-manager, acessoFBref, espera tabela DOM, read_html multiheaders e normalização | pipeline96–215 |
| Confirmado por execução | Extrator original com driver/HTML sintético injetado: parsing multiheaders, oito linhas, quit chamado; run_pipeline/save_result/roundtrip reais | fixture-table.html; offline-results.json |
| Confirmado por execução | Nomes com acento e espaços, filtros de cabeçalhos/totais/null, dedupe por nome keep-first, obrigatórias ausentes/vazio rejeitados | pipeline135–175; checks |
| Confirmado por execução | Timeout localizado, falha de coleta e falha de escrita preservam CSV anterior; temporário removido; reexecução demo/legacy coerente | pipeline178–289; testes/checks |
| Confirmado por execução | CLI original `--demo --no-open`, wrapper legado, origem sintética explícita e arquivo separado; 22 linhas atuais determinísticas seed42 | main.py; raspagem_spfc.py; SINTETICO-demo.csv |
| Confirmado por execução | Análises gols/90, assistências/90 e cartões; menu percorre1/2/3/0 sem GUI; PNG da função real com fixture sintética | analises.py; menu-offline.log; PNG |
| Confirmado por documentação/código | Menu padrão lê CSV real; demo não substitui esse arquivo. Opção debug e abertura Windows existem | menu12–13; main.py |
| Bloqueado | Aquisição pública atual: HTTP403/challengeFBref, tabela não localizada; nenhum CSV real atual | public-result.json/public.log |
| Não verificado | GUI/Excel padrão, renderização desktop/mobile, dados FBref atuais, concorrência de escritores, robustez para todas as mudanças de schema | fora do run |

**Confirmado por documentação/código** — Não há unwrap de tabelas comentadas: coletor espera elemento DOM `table[id^='stats_standard_']`, depois lê outerHTML. Fixture executada tem tabela visível com multiheaders; suporte a tabela em comentário **Não verificado** em browser e não reivindicado. Aliases são padrões fixos, não um parser universal de FBref. Campos numéricos inválidos/ausentes viram zero (169–170): desconhecido não permanece distinguido de zero neste domínio.

## Ambiente e isolamento

**Confirmado por execução** — Windows11 10.0.26200/Python3.13.9; host compartilhado8threads/~31,92GiB RAM (condição conferida no Lote02). Novo venv, pins originais respeitados: Pandas2.3.3, NumPy2.4.2, Selenium4.40.0, webdriver-manager4.0.2, Matplotlib3.10.8, Seaborn0.13.2, lxml6.0.2; psutil7.2.2 adicional apenas instrumentação. [Freeze](evidencias/requirements-resolved.txt), [pip check](evidencias/pip-check.log), [install metadata](evidencias/install-report.json). Dependências transitivas registradas; source requirements fixa diretas, sem lock com hashes. Não houve global install/configuração.

Lab: `portfolio/.agent-grid/labs/performance-lab/lote02/analise-spfc/run-20261009-151044`. TEMP/MPL cache/perfil Chrome/driver cache exclusivamente lab. `measure.py` amostra RSS e monitora apenas filhos/descendentes próprios, limite90s. Portas de serviço ChromeDriver5285 local; nenhum servidor do usuário tocado.

**Confirmado por execução** — Tentativa pública única com `main.main(['--no-open'])`/extrator original; bootstrap `create_driver` substituído pelo harness: Chrome155.0.8059.39 headless padrão, perfil novo e cacheDriverCacheManager local. Driver instalado em4,502s. Flags de disfarce de automação presentes no original96–110 foram **omitidas**, sem bypass/challenge solving. Não é prova da execução integral do bootstrap original. Nenhum benchmark enviado ao FBref; sem contas/cookies/headers/query em evidências.

**Confirmado por execução** — Fonte [FBref São Paulo](https://fbref.com/en/squads/5f232eb1/Sao-Paulo-Stats), tentativa iniciada2026-10-09T15:13:22.947143-03:00, statusHTTP403, título“Um momento…”, TimeoutException na etapa“localização da tabela”. [Metadata sanitizada](evidencias/public-result.json) inclui URL estável/hash da página de bloqueio, não dataset. Browser quit executado; nenhuma repetição nem fallback. **Bloqueado** — reprodução do dataset atual e da métrica histórica de46registros/10,63s.

## Comandos e resultados

Python abaixo é `.venv/Scripts/python.exe`, cwd lab. Cada execução foi envolvida por `Python measure.py <label> <evidencias> <argumentos>`; wrapper registra exitcode do filho, sem converter FAIL em PASS. Logs e `*-run.json` preservados.

| Classificação | Comando filho/atividade | Exitcode | Walltime(s) |
|---|---|---:|---:|
| Confirmado por execução | cópia porSHA + `python -m venv .venv` | 0 | shell6,621 |
| Confirmado por execução | `Python -m pip install -r requirements.txt psutil==7.2.2 --report <install-report.json> --disable-pip-version-check` | 0 | 48,221 |
| Confirmado por execução | `Python -m pip check` | 0 | exato em pip-check-run.json; nenhuma dependência quebrada |
| Confirmado por execução | `Python -m unittest discover -s tests -v` | 0 | 4,983 processo; suite26tests em0,123 |
| Confirmado por execução | `Python main.py --demo --no-open` | 0 | 0,855 |
| Confirmado por execução | `Python raspagem_spfc.py --demo --no-open` | 0 | 0,854 |
| Confirmado por execução | `Python offline_audit.py <evidencias>` | **1** | 2,768; checks+benchmarks concluídos, FAILs abaixo |
| Confirmado por execução | `Python public_once.py <evidencias>` | **1** | 25,163; HTTP403/Timeout, não timeout do supervisor |
| Confirmado por execução | metadata/AST/hash/Git + `math.isclose` dirigido dos resultados preservados | 0 | 0,137; sem rerun |
| Confirmado por documentação/código | lint/build existentes | N/A | ausentes; AST parse não é build |

**Confirmado por execução** — Suite existente atual: **26PASS**, não cobertura. Complementar original: **19checks,17PASS/2FAIL**; um FAIL é instrumental e um é expectativa de formato na entrada raw, sem alegação de dois bugs de produto. Testes offline patcham driver/HTML; `PipelineResult.source='real'` indica ramo de código, **não proveniência FBref** da fixture. Não confundir com aquisição remota end-to-end.

## Benchmarks e recursos

**Confirmado por execução** — Funções reais `normalize_data` + `analisar_finalizadores(mostrar_grafico=False)` + `save_result` atômico. Inclui normalização/dedupe/sortTop5/formatação impressa redirecionada e escrita CSV/replace; exclui browser/coleta/HTMLparser/gráfico, geração de fixture e readback/asserts posteriores. Input em memória aquecido, SO/processo aquecidos, mesmo arquivo local sobrescrito, sem fsync/durabilidade elétrica demonstrada. Concorrência1, warmup1+3repetições/n. Determinístico sem RNG, nomes únicos/minutos900/gols i%10; output asserts verificam n,totalgols,toprate0,9, CSV roundtrip cardinalidade e ausência de.tmp. Hashes/tamanhos inputs/outputs e amostras brutas em [resultados](evidencias/offline-results.json); inputs100mil~3,39MB somente lab.

| Linhas | Mediana(ms) | p95 nearest-rank(ms) | Linhas/s derivadas |
|---:|---:|---:|---:|
| 1.000 | 7,9206 | 11,4257 | 126.253 |
| 10.000 | 22,5265 | 22,6530 | 443.922 |
| 100.000 | 186,8317 | 191,0800 | 535.241 |

**Confirmado por execução** — p95 **n=3 é máximo observado**, cauda fraca; timer `perf_counter` mede walltime, não CPU. Os números não equivalem à velocidade remota nem a promessa de produção. Benchmarks não repetidos após diagnóstico instrumental.

**Confirmado por execução** — RSS~100ms, máximos **amostrados**, não picos garantidos: offline Python163.102.720B (~155,5MiB); run público Python107.888.640B, Chrome agregado877.301.760B (~836,7MiB), ChromeDriver22.593.536B. Chrome agrega processos no mesmo snapshot, pode contar páginas compartilhadas várias vezes; outros descendentes separados em closure.json. Escopo de cada processo completo, não cardinalidade isolada; CPUtime/CPUpeak **Não verificado**.

## Achados, FAILs e recomendações

- **Confirmado por execução** — **FAIL instrumental**: harness original compara assist top rate por igualdade exata; esperado0,6, real0,6000000000000001. [Original arquivado](evidencias/harness-offline-original.py), comando/results mantidos. Check dirigido `math.isclose(actual,expected,rel_tol=1e-12)` retornaTrue, default abs_tol0; [diagnóstico/hashes](evidencias/instrumental-failure.json). Só o predicado correspondente do harness de reprodução foi corrigido; versão corrigida não rerodada. Não é defeito da fórmula do projeto.
- **Confirmado por execução** — **FAIL de expectativa complementar/P3 contrato**: `normalize_data(rawDataFrame)` com Minutos `"1,234"` produz0; `"1.234"` produz1,234 decimal; NA/null→0. O contrato implementado é `pd.to_numeric(errors='coerce').fillna(0)`. `read_html` pode previamente tratar milhares: **Não verificado** esse token pelo caminho completo realFBref; não generalizar para dados coletados nem alegar corrupção remota. Confirmar formato aceito/necessidade de distinguir inválido/nulo/zero antes de mudar código.
- **Bloqueado** — HTTP403 atual impede comprovação do coletor contra fonte pública; registrar bloqueio externo, sem atribuir como bug interno ou contornar. Offline continua útil com limite de proveniência explícito.
- **Confirmado por documentação/código** — Escrita usa destino.tmp fixo+replace e cleanup (235–257); testes demonstram preservação em falhas sintéticas serializadas, não atomicidade concorrente/crash/power-loss universal. Dedupe por nome keep-first pode ser decisão editorial, requer contrato para homônimos; nenhum defeito novo afirmado sem fixture específica.

Recomendações (**Confirmado por documentação/código**): manter origem/revisão/tempo junto de outputs e distinguir histórico/demo; documentar formatos numéricos e política de inválidos; avaliar estabilidade do schema/DOM e alternativas públicas permitidas se bloqueio persistir. Não alterar originais nesta auditoria.

## Candidatos DRF e texto para revisão

**Confirmado por execução** — Candidatos NÃO publicados: “26testes locais executados, demo determinística22linhas e preservação de CSV em falhas sintéticas”; benchmark “100mil linhas sintéticas: mediana186,832ms/p95observado191,080ms, n3, normalização+Top5+CSV local”. Anexar escopo e bloqueio de coleta. PNG [finalizadores sintéticos](evidencias/sintetico-finalizadores.png) inspecionado, nomes explicitamente sintéticos; hash e CSV em closure.json. Não converter em resultado profissional.

PT (**Confirmado por documentação/código**): “Automação Python para coletar estatísticas públicas do São Paulo FC, normalizar o elenco e salvar CSV para análises de gols/90, assistências/90 e disciplina.” Complemento (**Confirmado por execução**): “A auditoria atual validou testes locais, demo explícita e fluxo offline; a coleta pública ficou bloqueada por HTTP403.”

EN (**Confirmado por documentação/código**): “Python automation for collecting São Paulo FC public statistics, normalizing squad data, and saving CSV for goals/90, assists/90, and disciplinary analysis.” Complement (**Confirmado por execução**): “The current audit validated local tests, an explicit demo, and an offline flow; public collection was blocked by HTTP403.”

Questões ao proprietário (**Não verificado**): contribuição individual e uso real? Fonte alternativa permitida/contrato de schema? Milhares/decimais e ausência devem virar zero? Homônimos/dedupe? A referência manual480s foi medida como? Origem/revisão deveria acompanhar cada CSV além de nome/terminal?

**Confirmado por execução** — Tempo da cópia à validação **229,28s (~3,8min)**; editorial posterior separado. Original SHA/status preservados, driver/browser próprios encerrados, nenhuma GUI externa aberta, nenhum benchmark remoto. Artefatos individuais≤1MiB; grandes arquivos/perfil/deps somente lab. Lote01/Stock preservados; nenhum projeto adicional iniciado. Quota é monitorada pelo Lead (34% na revisão), ferramenta ausente no worker não bloqueia o projeto. Encerrado para checkpoint Lote02.
