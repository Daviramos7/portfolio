# Pendências técnicas — Performance Lab

Registro do Lote 01, aberto em 09/10/2026. Nenhuma correção aplicada aos projetos originais. Severidades são avaliações locais; incidência e impacto em produção não foram medidos. Benchmarks mantêm as condições dos relatórios, sem publicação no catálogo.

| ID | Projeto / revisão | Pendência confirmada por execução | Reprodução / limite | Estado |
|---|---|---|---|---|
| AH-01 | Atleta Híbrido `0ae9190` | Ausência semanal exportada como zero | Tabelas sintéticas vazias retornam médias/totais0, expectativa complementar null. Política editorial/contrato exige confirmação; UI pode mascarar o zero. | Aberta |
| AH-02 | Atleta Híbrido `0ae9190` | Média de kcal inclui dias sem kcal | Dois dias wearable, kcal500/null: média250 em vez de500 para observações conhecidas. Serviço real com Supabase mock, sem DB/RLS real. | Aberta |
| AH-03 | Atleta Híbrido `0ae9190` | Zero passos excluído de dias registrados | Passos0/10000: média10000, expectativa5000 dos dias conhecidos. Confirmar se contrato pretendido é média de dias ativos. | Aberta |
| BS-01 | BrasilScore `aadc1e9` | Falha do fornecedor apresentada como busca vazia | Upstream sintético429, API502: UI informa nenhum clube encontrado em1440/390px. Não mede fornecedor real. | Aberta |
| BS-02 | BrasilScore `aadc1e9` | Ano de fundação ausente vira zero | Normalizador real recebe `founded:null` e retorna0; expectativa null. Incidência no fornecedor não verificada. | Aberta |
| BS-03 | BrasilScore `aadc1e9` | Fallback de escudo ausente | `crest:null` aponta a `assets/img/team-placeholder.png`, não presente no checkout; imagens quebradas no navegador. | Aberta |
| PY-01 | Despesas PySpark `27f0c93` | Moeda malformada aborta sob Spark4 ANSI | Token `1,2,3` provoca NumberFormatException na materialização, antes de contagem de inválidos. Ambiente4.0.4 ANSI=true; dataset público válido passou. | Aberta |
| PY-02 | Despesas PySpark `27f0c93` | CSV válido pequeno é rejeitado | Arquivo<1024B falha na validação pelo limiar fixo anti-resposta-erro. Confirmar suporte desejado a pequenos datasets; não falha do dataset público. | Aberta |

Fontes e harnesses: [Atleta](atleta-hibrido/RELATORIO.md), [BrasilScore](brasilscore/RELATORIO.md), [PySpark](auditoria-despesas-pyspark/RELATORIO.md). Os três relatórios preservam resultados FAIL, comandos e dados brutos. Achados adicionais, bloqueios de plataforma e falhas instrumentais permanecem nos relatórios; não foram convertidos em aprovação de produto.

Condições a preservar: Atleta p95 das médias de lotes de10 chamadas/RSS snapshots Vitest; Brasil p95 de requests individuais, fornecedor HTTP loopback com atraso sintético e RSS do processo combinado API/mock/gerador; PySpark benchmark ANSI=false, Spark cache frio por repetição/JVM e OS aquecidos, n=3 (p95=máximo observado), RSS Python/JVM amostrado, separado do pipeline público ANSI=true. Nenhum número sustenta SLA ou desempenho de produção.

## Ampliação Night Shift (originais preservados)

| ID | Projeto | Achado / condição | Estado |
|---|---|---|---|
| TM-01 | Task Manager | Título null provoca IntegrityError, fecha resposta sem status e pode manter conexão com lock posterior observado. | Aberta |
| TM-02 | Task Manager | PUT e DELETE retornam 501: duas verificações FAIL para a mesma lacuna de CRUD declarado. | Aberta |
| TM-03 | Task Manager | GET /tasks/1?probe=1 retorna400 por parse do caminho. | Aberta |
| TM-04 | Task Manager | Título vazio aceito: expectativa400 do harness, política do produto a confirmar. | Política pendente |
| GP-01 | Guess the Pokémon | Feedback do acerto sobrescrito por atualização do balão. | Aberta |
| GP-02 | Guess the Pokémon | Tentativas continuam após vitória; prêmio duplicado não demonstrado. | Aberta |
| GP-03 | Guess the Pokémon | Reinício dispara duas aquisições no mock por handlers duplicados. | Aberta |
| GP-04 | Guess the Pokémon | Retry recursivo sem cap/backoff no código; quatro503 injetados seguidos de sucesso. Não se executou loop infinito. | Aberta |

[Task Manager](task-manager/RELATORIO.md): 11 PASS/5 FAIL; KeyError no primeiro harness é instrumental, separado. Listagens 1k/10k/100k incluem API/SQLite/JSON/transporte/decode; n=3 e RSS combinado não representam SLA/pico/backend exclusivo.
[Guess the Pokémon](guess-the-pokemon/RELATORIO.md): 14 PASS/4 FAIL; sprites sintéticos/CDN bloqueada e favicon ausente limitam avaliação visual. API real, assets/licenças de franquia e aparência completa não validados. Nenhuma alteração nos originais.
