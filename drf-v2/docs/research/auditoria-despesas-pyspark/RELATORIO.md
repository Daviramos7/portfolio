# Auditoria experimental — Despesas Públicas Recife / PySpark

Revisão de 09/10/2026, Missão06. Escopo encerrado neste projeto; publicação depende do checkpoint do Lead. Todas as referências de código abaixo são de `analise.ipynb`, célula de índice **2**, na revisão `27f0c933e83c2e426248bf397659c88b02fe072e`; linhas preservadas em [source-cell-2.py](evidencias/source-cell-2.py). Resultados de laboratório não representam desempenho de produção nem contribuição profissional individual.

## Estado, problema e arquitetura

- **Confirmado por execução** — Original `main`, SHA acima, status vazio antes/depois; somente README.md e analise.ipynb rastreados, sem AGENTS específico encontrado. Cópia por Git/SHA, hashes em [manifesto](evidencias/copy-manifest.json); nenhum original editado. Worker em `feat/drf-engineering-research`, base `175820af7937840f4a7367bfd5dedc2a76ae8269`; sem commit/publicação.
- **Confirmado por documentação/código** — Pipeline de análise das despesas municipais de 2023: aquisição/validação CSV → normalização de nomes e moedas → Spark persistido → contagem/totais/qualidade → ranking agregado Top10 em Pandas → dashboard Matplotlib, CSV, JSON e ZIP. Fontes: linhas 81–106, 139–473, 712–975. Não é API, aplicação web ou prova de auditoria contábil independente.
- **Declarado pelo autor** — README linhas 374–380 atribui desenvolvimento a Davi Ramos Ferreira. **Não verificado** — divisão de responsabilidades, exclusividade, contexto profissional e uso institucional; confirmar com proprietário.
- **Confirmado por documentação/código** — Inventário: download com retries e detecção HTML (147–206, 275–391); opção upload Colab (217–272); detecção `;`, `,`, tab e normalização (393–427); moedas BR/DoubleType (430–473); totais e qualidade (790–820); Top10 (825–840); dashboard Top7 (493–683); exportações (885–946). Parquet opcional está desabilitado. **Não verificado** — upload interativo Colab, retries/fallback remoto e Parquet em execução atual.

## Ambiente, isolamento e comandos

**Confirmado por execução** — Windows 11 Home 10.0.26200, 8 threads lógicas, 34.278.518.784 bytes RAM (~31,92 GiB), máquina compartilhada. Python 3.13.9, Temurin Java 17.0.18.8, venv próprio; resolvidos PySpark **4.0.4**, Pandas 3.0.6, Matplotlib 3.11.2, requests 2.34.2, psutil 7.2.2. [Freeze](evidencias/requirements-resolved.txt), relatório/log de instalação preservados. Instalação local do pacote Spark: ~434 MB baixados, wheel construída; nenhuma instalação global, winutils ou mudança de configuração global.

**Confirmado por documentação/código** — README linha 8 anuncia PySpark 3.x, mas o instalador da célula aceita `>=3.5,<4.1` (52), permitindo 4.0.4. Java17/Python3.13 satisfazem os requisitos publicados do [Spark 4.0.4](https://spark.apache.org/docs/4.0.4/index.html). ANSI passa a ser padrão no Spark4: [guia de migração](https://spark.apache.org/docs/4.0.4/sql-migration-guide.html).

**Confirmado por execução** — Todas as 979 linhas da única célula de código foram inspecionadas antes da execução. Harness remove somente chamadas de instalação de módulo (52–55), desliga upload/download durante execução, aponta arquivo público local e saídas ao lab, usa Agg, `local[2]`, driver 2 GiB, loopback, portas 5283/5284, UI Spark desabilitada. Transformações e função `executar_pipeline` permanecem originais. Hash célula: `9035d6349a8834c3cc8b613ef0475a3ef925bd5e798cab840efcfa7e53279092`; fonte adaptada: `781b4e7ebe850ba1791458a43c6e987b78b931f1ace4da67d99c3ebb957bf767`. [Adaptações](evidencias/public-pipeline-details.json), [fonte adaptada](evidencias/public-pipeline-adapted.py).

Lab: `portfolio/.agent-grid/labs/mission06/auditoria-despesas-pyspark/run-20261009-1441`. Comandos abaixo executados nele, `PYTHON` = `.venv/Scripts/python.exe`; wrappers apenas configuram ambiente local e amostram recursos.

| Classificação | Comando/atividade | Exitcode | Walltime/condições |
|---|---|---:|---|
| Confirmado por execução | `PYTHON -m pip install "pyspark>=3.5,<4.1" pandas matplotlib requests psutil --report <install-report.json> --disable-pip-version-check` | 0 | 152,022 s; venv isolado; psutil só instrumentação |
| Confirmado por execução | GET único via urllib da URL estável do código | 0 | 13,961 s, HTTP200, sem retries; [metadata](evidencias/public-download.json) |
| Confirmado por execução | `PYTHON measure_process.py --label public-pipeline --evidence <evidencias> --timeout 180 -- PYTHON run_pipeline.py --input public-dataset.csv --output public-output` | filho 0 | 18,165 s processo completo; [run](evidencias/public-pipeline-run.json), [log](evidencias/public-pipeline.log) |
| Confirmado por execução | `PYTHON measure_process.py --label checks-benchmark --evidence <evidencias> --timeout 180 -- PYTHON checks_benchmark.py` | filho **1** | 21,621 s; dois FAILs preservados; wrapper de medição termina 0, não equivale a suite PASS |
| Confirmado por execução | `ast.parse` da célula original + validação CSV/ZIP/PNG/hashes | validações concluídas; impressão Python **1** | 1,219 s wall do comando PowerShell; UnicodeEncodeError cp1252 ao imprimir BOM; shell terminou 0. JSON já gravado, falha instrumental preservada em [nota](evidencias/closure-instrumentation.json) |
| Confirmado por documentação/código | suites/lint/build existentes | N/A | Ausentes nos dois arquivos rastreados; syntax parse não é build |

## Dataset público e resultados atuais

**Confirmado por execução** — Uma coleta normal em `2026-10-09T14:42:05.674355-03:00` da [URL estável Recife](https://dados.recife.pe.gov.br/dataset/63f7941b-9a1e-4a49-893b-d5f16e2134d8/resource/ba29bffc-6478-4dd7-80a4-4c3ab6157f59/download/despesas-orcamentarias-2023.csv), 86.703.123 bytes; SHA256 `4445925692b24c33523e45bf02c52f01d0f2593a9fe1dcf93b8342986c80d36d`. Metadata contém destino sem query: **query assinada omitida**. Dataset grande fica só no lab; nenhum dado interno SEFAZ ou credencial utilizado.

**Confirmado por execução** — Pipeline real iniciou `2026-10-09T14:44:52.398945-03:00`, Spark4 ANSI padrão. Reproduziu **127.119 registros**, **R$ 7.803.361.234,91 liquidados**, **R$ 8.162.834.911,14 empenhados**, **R$ 7.339.449.931,79 pagos**, razão **94,05%**. Valores Double brutos mantidos no [JSON](evidencias/public-output/resumo_execucao.json); arredondamento a centavos coincide com totais documentados, não é validação contábil de cada registro. Duas partições de entrada; zero órgãos ausentes e zero liquidados inválidos segundo as regras do código. Zero é medido neste arquivo, não regra universal de qualidade.

**Confirmado por execução** — Startup Spark medido separadamente **6,737 s**; chamada completa da função **12,842 s**; timer interno **5,4249 s** abrange leitura/materialização/contagens/totais/ranking, exclui startup, coleta e exportações. Dashboard/JSON/CSV/ZIP produzidos; PNG 1600×900 inspecionado, Top10 ordenado com dez linhas e ZIP sem membro corrupto. [Validação/hashes](evidencias/closure-validation.json), [dashboard](evidencias/public-output/04_dashboard_portfolio.png). Históricos embutidos no notebook não foram tratados como run atual.

**Confirmado por execução** — Discrepância do ranking: [CSV atual](evidencias/public-output/top_10_orgaos_por_valor_liquidado.csv), linha 5 (4º órgão), Planejamento/Gestão/Transformação Digital **supervisionada**, R$ **928.018.667,95**; linha 6 (5º), Encargos Gerais, R$ **806.929.638,80**. Hash CSV `05896e3862d9d115eb6621d84980aed968f1a0cba0fb8a524fa790e3268cff20`. **Confirmado por documentação/código** — README linha 55 numera Encargos como #4 ~R$810 milhões. A tabela pode selecionar órgãos relevantes, mas sua numeração não reproduz a ordem atual. README original preservado; timestamp/checksum/partições acima delimitam esta reprodução.

## Checks e benchmarks

**Confirmado por execução** — [Resultados brutos](evidencias/checks-benchmark-results.json): 12 checks, **10 PASS/2 FAIL**, não cobertura. Validação e sniff de CSV semicolon/comma/tab (>1 KiB), HTML rejeitado, moedas BR/com símbolo/ponto decimal, nulos/inválidos, coluna obrigatória ausente e duplicatas retidas foram exercitados. Retenção de duplicatas caracteriza o contrato atual, sem alegar defeito de deduplicação. Após FAIL ANSI, recuperação dirigida `spark.sql.ansi.enabled=false` **somente na sessão** permitiu checks seguintes/benchmark; nenhum rewrite das transformações. Pipeline público anterior permaneceu ANSI=true.

**Confirmado por execução** — Precisão diagnóstica: 1.000 linhas sintéticas `0,10`, esperado Decimal100,00; Double somou `100.00000000000088`, Decimal(20,2) somou `100.00`, diferença `8,8E-13`. Evidencia arredondamento binário; não demonstra prejuízo contábil material no dataset público.

**Confirmado por execução** — Benchmark executa nós AST exatos das linhas 755–841: IO CSV, normalização, persist/count, totais e Top10/toPandas (ações forçadas). Exclui startup/download/PNG/exportações. Fixture determinística ID6092026, sem RNG: 20 órgãos, cada valor liquidado123,45/pago100,00; contagem, totais e ranking conferidos em cada repetição. Uma warmup por cardinalidade, três repetições, `unpersist` bloqueante e clearCache entre runs: cache Spark frio por run, JVM/OS aquecidos; cache persistido reutilizado nas agregações dentro do run. Entrada uma partição, shuffle configurado8 com AQE, sem concorrência adicional. Cronômetro `perf_counter`; overhead e resolução efetiva não foram quantificados. Não mede latência de evento individual.

| Linhas | Mediana (s) | p95 nearest-rank (s) | Linhas/s derivadas da mediana |
|---:|---:|---:|---:|
| 1.000 | 0,440163 | 0,478712 | 2.272 |
| 10.000 | 0,420231 | 0,449492 | 23.796 |
| 100.000 | 0,611475 | 0,619790 | 163.539 |

**Confirmado por execução** — p95 tem apenas **n=3**, logo equivale ao máximo observado; estimativa de cauda fraca. Não se espera escala monotônica nos tamanhos pequenos com JVM aquecida. Pandas recebe somente dez linhas agregadas; única coleta raw complementar tem oito linhas sintéticas.

**Confirmado por execução** — RSS amostrado a cada ~100 ms, valores máximos **observados**, não picos absolutos: processo público Python **130.646.016 B**, JVM **906.510.336 B**; processo checks+benchmark Python **189.722.624 B**, JVM **756.264.960 B**. Escopo processo completo e descendentes de cada categoria; não atribuir Python RSS ao Spark/JVM nem a uma cardinalidade isolada. Sem CPU peak ou extrapolação de produção.

## Achados e limites

| Classificação | Severidade/contexto | Reprodução e recomendação |
|---|---|---|
| Confirmado por execução | P2 compatibilidade/dado malformado; **FAIL** | `preparar_dataframe` com `valor_liquidado='1,2,3'`, ação `.first()`, Spark4 ANSI=true: NumberFormatException (`1.2.3`). Regex/cast linhas430–452; não vira null contado inválido. Fixar versão/ANSI deliberadamente ou avaliar `try_cast`; original não corrigido. Dado público atual passou. |
| Confirmado por execução | P3 restrição de entrada; **FAIL** expectativa complementar | CSV sintético válido pequeno (<1024B) rejeitado por validar_csv_local linhas163–181. Política anti-página-erro inclui limiar fixo. Confirmar se pequenos datasets devem ser suportados; não confundir com falha do dataset público. |
| Confirmado por execução | P3 precisão diagnóstica | DoubleType expõe erro binário mínimo acima; avaliar Decimal para contrato monetário, sem afirmar erro material ou mudar original. |
| Confirmado por documentação/código | P3 documentação | Badge3.x vs constraint4.x e ranking README divergente; atualizar documentação com revisão/checksum e distinguir seleção de ranking. |
| Confirmado por execução | Instrumental, sem defeito funcional demonstrado | UnicodeEncodeError de impressão de BOM UTF8 em console cp1252 na validação final. Artefatos válidos já gravados; usar console UTF8/reader utf-8-sig. Preservado sem rerun. |

**Confirmado por execução** — Logs também preservam warnings HADOOP_HOME/winutils/native-Hadoop (fallback Java), perfil PowerShell/PSReadLine, URI localdir, plano truncado, backend Agg e mensagens de cleanup de PID já encerrado; pipeline exit0. Sem baixar binários nem corrigir máquina. **Bloqueado** — validação interativa Colab nesta sessão local; **Não verificado** — cluster, produção, robustez contábil completa, upload, Parquet e falhas reais de upstream. Ausência de moeda opcional deve permanecer distinguida de zero: código agrega condicionalmente (794–811); comportamento completo desse cenário não foi executado. Nenhum desses limites impede a evidência local obtida.

## Candidatos DRF e textos para revisão

**Confirmado por execução** — Candidato de painel: “Reprodução local de 127.119 registros públicos / R$7,803 bi liquidados”, origem JSON do run, revisão/checksum acima. Candidato experimental: “100 mil linhas sintéticas: mediana0,611s, p95 observado0,620s (3 runs, Spark local[2], JVM/OS aquecidos, IO+agregação+Top10)”. Não publicados; manter condições junto aos números. Dashboard atual é evidência de análise pública, não resultado profissional.

**Confirmado por documentação/código** — PT: “Pipeline em PySpark para analisar despesas públicas do Recife, com normalização monetária, agregações, indicadores de qualidade e exportação de ranking/dashboard. A reprodução local da revisão auditada processou 127.119 registros do dataset público de 2023.”

**Confirmado por documentação/código** — EN: “A PySpark pipeline for Recife public expenditure analysis, with monetary normalization, aggregations, data-quality indicators, and ranking/dashboard exports. A local reproduction of the audited revision processed 127,119 records from the public 2023 dataset.” A segunda frase de cada texto é **Confirmado por execução**; autoria pessoal/responsabilidades ainda **Não verificado**.

Questões ao proprietário (**Não verificado**): qual foi sua contribuição individual e finalidade do projeto? Spark3 ou4 é alvo suportado? Tokens monetários malformados devem abortar ou virar inválidos? Há política contábil de precisão/deduplicação? Ranking README é seleção editorial? Dados monetários opcionais ausentes devem aparecer como indisponíveis no dashboard?

**Confirmado por execução** — Encerramento: original SHA/status preservados; Spark stop/gateway shutdown e monitor dos próprios descendentes concluídos sem remanescentes. Portas5280–5289 sem listeners na conferência, servidores do usuário preservados. Duração desde cópia até validação final **549,48 s (~9,2 min)**; tempo editorial posterior não incluído. Somente research autorizado escrito. Próxima ação: checkpoint do Lead sobre os três relatórios; nenhum novo projeto iniciado.
