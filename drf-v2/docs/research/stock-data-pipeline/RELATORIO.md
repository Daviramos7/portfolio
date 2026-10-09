# Stock Data Pipeline — auditoria experimental Lote02

09/10/2026. Referências abaixo: revisão **f9feca6fba241479c9fcb113132c601b4d44d54d**, `dashboard.py`, com linhas preservadas em [fonte](evidencias/source-dashboard.py). Evidência local sintética; nenhum resultado de mercado, corretora ou produção.

## Projeto e proveniência

- **Confirmado por execução** — Original `C:/Users/davir/OneDrive/Documentos/GitHub/stock_data_pipeline`, branch main, SHA acima, limpo antes/depois. Somente cinco arquivos rastreados; nenhum AGENTS encontrado na ancestralidade inspecionada. [Manifesto](evidencias/manifest.json) e [fechamento](evidencias/closure.json). Worker continua `feat/drf-engineering-research`, base `175820af7937840f4a7367bfd5dedc2a76ae8269`; Lote01 preservado sem sync/rebase/merge.
- **Confirmado por documentação/código** — Dashboard Streamlit de análise técnica: yfinance → normalização OHLCV/Pandas → indicadores → Plotly/KPIs/tabela. Um arquivo Python de 185 linhas; execução do módulo dispara consulta e UI. Não há banco, armazenamento durável, exportação de usuário, cron, deploy script ou pipeline separado rastreado. Cache Streamlit não equivale a persistência em BD. Fonte linhas29–82, 135–185.
- **Declarado pelo autor** — README descreve ETL automatizado, dados em tempo real, hospedagem Cloud e métricas 0,81s /76.472 registros/s /0,0033s (linhas3,16–18,35); não reproduzidas remotamente nesta auditoria. README104 atribui desenvolvimento a Davi Ramos Ferreira. **Não verificado** — autoria exclusiva, contribuição individual, responsabilidades, adoção e resultados profissionais.
- **Declarado pelo autor** — [Demo indicada no README6](https://stockdatapipeline-jnuaqfhrnt8jts3ymssrsp.streamlit.app/). **Não verificado** — disponibilidade atual e correspondência da revisão implantada; não acessada, sem carga externa.

## Funcionalidades e execução

| Classificação | Funcionalidade/estado | Fonte |
|---|---|---|
| Confirmado por execução | Loader real normalizou fixture MultiIndex em seis colunas OHLCV, recebeu fim+1dia; cache reutilizou resultado com uma chamada ao fornecedor para duas consultas iguais | 29–58; results.json checks |
| Confirmado por execução | SMA20 conferida por média independente; RSI100 em série crescente; função não altera input; gráfico contém cinco traces | 60–131; synthetic-chart.json |
| Confirmado por documentação/código | SMA50, Bollinger ±2std, retorno percentual e volatilidade janela21×√252 presentes; esta revisão de testes não prova correção financeira completa dessas fórmulas | 64–78 |
| Confirmado por execução | AppTest executou módulo original com60 linhas; KPIs, tabs, gráfico/tabela sem exceção. Seleção AAPL disparou rerun real com fornecedor sintético | 135–185; results.json apps/checks |
| Confirmado por execução | Dataset vazio produz mensagem controlada de falha; duplicata retida na transformação (61linhas), caracterização sem contrato de deduplicação | 36–37,185; results.json |
| Confirmado por documentação/código | TTL3600 configurado; ordenação antes da análise e tabela descendente; filtro início/fim e dez tickers | 16–29,139–148,182 |
| Não verificado | Expiração após1h, persistência/restart de cache, protocolo Yahoo, moedas/corporate actions/dados reais do fornecedor, equivalência RSI ao algoritmo Wilder | integração fora deste run |

**Confirmado por execução** — Cópia por `git show SHA:<arquivo>` somente README, dashboard e requirements necessários, sem env/dados/deps. Todo código inspecionado antes de executar: imports, consulta yfinance, cache, UI; sem install/shell/export/lifecycle do projeto, credenciais ou referências a env. Lab `portfolio/.agent-grid/labs/performance-lab/lote02/stock-data-pipeline/run-20261009-150256`. Nenhuma alteração original.

**Confirmado por execução** — Python3.13.9, Windows11 10.0.26200, 8threads, RAM34.278.518.784B (~31,92GiB), host compartilhado. Venv novo: Streamlit1.65.0, Pandas3.0.6, NumPy2.5.3, yfinance1.7.0, Plotly7.1.0, psutil7.2.2. Requirements original **sem pins/lock**, NumPy transitivo; versões resolvidas fixadas para reprodução em [freeze](evidencias/requirements-resolved.txt). [Install report](evidencias/install-report.json) registra origem/artefatos; freeze não é lock com hashes. psutil é instrumentação adicional. Nenhuma instalação/configuração global.

**Confirmado por execução** — Harness extrai via AST imports e funções **inalteradas** para testes/bench; AppTest executa `dashboard.py` original completo. `yf.download` é substituído em processo por fornecedor determinístico; não chama yfinance remoto. Guard adicional bloqueia conexão socket Python externa, nenhum attempt observado. Guard não comprova interceptação de rede nativa curl_cffi; isolamento relevante aqui é a substituição da entrada yf.download, sem uso de fornecedor real. Não há DB a substituir, HTTP mock desnecessário nesta arquitetura. Nenhuma coleta pública feita.

| Classificação | Comando/atividade | Exitcode | Walltime |
|---|---|---:|---:|
| Confirmado por execução | Python3.13 cria `.venv` local + cópia/manifesto | 0 | shell6,201s |
| Confirmado por execução | `.venv/Scripts/python.exe -m pip install -r requirements.txt psutil --report <install-report.json> --disable-pip-version-check` | 0 | 69,872s |
| Confirmado por execução | `.venv/Scripts/python.exe audit.py <evidencias>` no lab | **1** | **8,341s** processo completo; 17checks/6FAIL, benchmark concluído |
| Confirmado por execução | AST syntax parse + metadados + SHA/status | 0 | 0,178s; não build |
| Confirmado por documentação/código | Suites/lint/build existentes | N/A | Ausentes; harness complementar não é suite original |

[Comandos/exitcodes](evidencias/audit-run.json), [log](evidencias/audit.log), [resultados](evidencias/results.json). **Confirmado por execução** — Warnings de Streamlit bare-mode/cache em memória e depreciação `use_container_width` preservados; não impediram AppTest nominal. As exceções dos cenários negativos são FAILs funcionais, não falhas do instrumentador. FAIL instrumental editorial posterior: leitura do install-report UTF8 com default cp1252 lançou UnicodeDecodeError (exit1); recuperação única com encoding explícito concluída, sem rerun. [Registro](evidencias/editorial-instrumentation.json).

## Resultados experimentais e limites

**Confirmado por execução** — **17 checks:11PASS/6FAIL**, sem alegação de cobertura. Startup viável demonstrado por AppTest nominal (~0,722s do cenário após imports), não servidor HTTP/browser real. Testes de interface são headless em processo: desktop/mobile/foco/renderização visual **Não verificado**. [Figura Plotly sintética serializada](evidencias/synthetic-chart.json) contém saída real da função; não screenshot de navegador.

**Confirmado por execução** — Probe único do cache Streamlit: chamada fria11,0815ms, quente0,5137ms; n=1cada, sem p95/generalização. Retorno `tempo_download` repetiu10,1309ms nas duas consultas: é tempo original armazenado no cache, não latência atual do hit. Não atribuir números ao Yahoo/HTTP.

**Confirmado por execução** — Benchmark da função real `processar_indicadores` (60–81), inclui cópia e cálculos rolling em memória; exclui extração, CSV IO, Streamlit/cache/gráfico/UI. Fixture aritmética determinística sem RNG, fechamento100+i×0,01; timestamps por minuto apenas para cardinalidade, não dados diários ou inferência financeira. Inputs CSV/hash/tamanho em results.json, arquivos grandes somente lab. Uma warmup + cinco repetições por n, serial/concurrency1, input e processo aquecidos. Output asserts: cardinalidade, SMA20 independente, RSI100 crescente, input preservado. Sem benchmark DB pois engine/contrato inexistentes.

| Linhas | Mediana(ms) | p95 nearest-rank(ms) | Linhas/s da mediana |
|---:|---:|---:|---:|
| 1.000 | 3,8512 | 5,3302 | 259.659 |
| 10.000 | 4,9566 | 6,0891 | 2.017.512 |
| 100.000 | 15,8570 | 16,9598 | 6.306.363 |

**Confirmado por execução** — p95 com **n=5 equivale ao máximo observado**, cauda fraca. Walltime externo usa `perf_counter`; timer interno usa `time.time` e termina antes do retorno/descarte anterior, logo não é escopo idêntico ao harness. Não houve medição de tempo de CPU: a legenda original “Cálculo (CPU)” mede walltime. Amostras brutas preservadas; números não são promessa de produção nem validação das métricas históricas README.

**Confirmado por execução** — RSS amostrado ~100ms no processo completo (imports, AppTest, checks, benchmark): máximo observado **183.496.704B (~175MiB)**; não pico absoluto nem consumo de uma cardinalidade específica. Nenhum subprocesso observado; não há RSS JVM/BD. CPU peak **Não verificado**. Fixtures100mil têm7.316.111B, ficam exclusivamente no lab; todos os artefatos versionáveis ≤1MiB.

## Achados reproduzidos

Todos os achados abaixo: **Confirmado por execução**, fonte/log/results na revisão indicada. Prioridades são triagem local, sem afirmar impacto em produção.

| Severidade | Reprodução / resultado | Recomendação ao proprietário |
|---|---|---|
| P2 | Uma linha OHLCV válida → `iloc[-2]` (162) causa IndexError; app não conclui | Validar mínimo de linhas antes da comparação |
| P2 | Fornecedor injetado lança TimeoutError → exceção não tratada na UI (34); real yfinance pode internamente tratar alguns erros, não testado | Separar vazio/erro e tratar exceções documentadas da camada |
| P2 | Coluna Close ausente → KeyError na seleção final (54) | Validar schema e mensagem controlada |
| P2 | Cinco linhas → SMA20 ausente, comparação comNaN vira “Baixa” (171); RSI/vol exibem nan/nan% | Estado indisponível para janela insuficiente |
| P2 | Seleção AAPL → preço com prefixoR$ (167); fixture não representa conversão cambial | Derivar moeda do ativo/provedor ou deixar unidade explícita |
| P3/política | Série constante60linhas → ganho0/perda0 → RSI NaN (74–75), FAIL expectativa de indicador definido | Confirmar política para série plana; não impor valor sem contrato |

**Confirmado por documentação/código** — Timer cacheado apresentado como “Download(API)” e walltime denominado CPU podem induzir interpretação incorreta; TTL declarado confirmado por código, expiração não executada. Ausência de persistência, dedupe, validação de schema e suite deve constar no escopo, não virar promessa de pipeline durável. **Não verificado** — regras para OHLC inconsistente, preços zero/nulos, exceções específicas reais, datasets multiativo; não expandido para preservar foco/quota.

## Candidatos DRF, textos e questões

**Confirmado por documentação/código** — Candidato de painel não publicado: “Dashboard Python/Streamlit de análise técnica, cache comTTL3600s, visualização OHLCV e indicadores rolling”. **Confirmado por execução** — Candidato experimental: “100mil linhas sintéticas: mediana15,857ms/p95observado16,960ms, n5, apenas cálculo Pandas em memória”; condições devem acompanhar o número. Não usar para produtividade profissional ou velocidade da API.

PT (**Confirmado por documentação/código**): “Dashboard em Python e Streamlit para consultar séries de ações, normalizar OHLCV e apresentar indicadores técnicos, gráficos Plotly e uma tabela de análise.” Complemento (**Confirmado por execução**): “A auditoria local exercitou o aplicativo com fornecedor sintético e mediu os cálculos Pandas em cardinalidades de até100mil linhas.”

EN (**Confirmado por documentação/código**): “A Python and Streamlit dashboard that queries stock time series, normalizes OHLCV, and displays technical indicators, Plotly charts, and an analysis table.” Complement (**Confirmado por execução**): “The local audit exercised the application with a synthetic supplier and measured Pandas calculations on datasets of up to100,000 rows.”

Questões (**Não verificado**): contribuição individual e contexto de desenvolvimento? Versões oficialmente suportadas? Moeda por ativo e significado de “tempo real”? Política de RSI plano/janelas incompletas? Cache/timing devem ser expostos como benchmark? ETL precisa persistência/agendamento ou descreve apenas a consulta interativa?

**Bloqueado** — Percentual de reserva Codex: `harness_bandwidth` não exposto, portanto não mensurável pelo worker. Consulta feita antes da instalação; nenhuma nova carga após fase de resultados. Lead deve conferir headroom antes de autorizar follow-up. **Confirmado por execução** — Laboratório até validação final **157,38s (~2,6min)**, fechamento editorial posterior separado. Processo audit encerrado, nenhum servidor/helper persistente iniciado, nenhum serviço externo recebeu benchmark; servidores5173/4173 intocados. Original SHA/status preservados; sem commit/merge/push/deploy. Somente pasta nova stock-data-pipeline escrita; SPFC não iniciado. Encerrado para revisão do Lead.
