# Performance Lab — checkpoint do lote 01

09/10/2026. Lead revisou relatórios, harnesses, resultados brutos e capturas selecionadas. Relatórios/evidências copiados do worktree de pesquisa ao checkout `feat/drf-engineering`, base `175820af7937840f4a7367bfd5dedc2a76ae8269`, sem commit ou publicação. Candidatos ao painel e textos PT/EN aguardam revisão do proprietário.

## Execução confirmada

| Projeto / revisão | Execução atual | Resultado e limite |
|---|---|---|
| [Atleta Híbrido](atleta-hibrido/RELATORIO.md), `0ae9190` | 283 testes existentes, lint/build; smoke com Supabase interceptado; complemento e microbenchmarks | Suíte existente PASS; complemento 4 PASS/3 FAIL. Nutrição/50 mil registros: mediana 10,432 ms, p95 11,854 ms **das médias de lotes**, não latência individual. |
| [BrasilScore](brasilscore/RELATORIO.md), `aadc1e9` | npm10 frozen, 32 testes/build; webhint limitado; API real com upstream HTTP sintético; navegador desktop/mobile | Suíte PASS; benchmark exit1 por check complementar; navegador final 12 PASS/2 FAIL. Cache quente/concorrência8: mediana 3,036 ms, p95 individual 4,400 ms, 1.972 req/s **locais**, processo combinado com mock/gerador. |
| [Despesas públicas PySpark](auditoria-despesas-pyspark/RELATORIO.md), `27f0c93` | Notebook real adaptado apenas para isolamento; dataset público; CSV/JSON/PNG/ZIP; 12 checks e benchmarks | 127.119 registros, R$7.803.361.234,91 liquidados e 94,05% pago/liquidado reproduzidos. 10 PASS/2 FAIL. Trecho Spark público: 5,4249 s; processo completo: 18,165 s. Sintético100 mil: mediana0,611475 s, três repetições, sessão ANSI=false; suites/lint/build inexistentes=N/A. |

Todos os resultados da tabela são **Confirmado por execução**, nas condições dos relatórios. Métricas de laboratório não são resultados de produção, ganhos antes/depois, cobertura ou contribuição profissional individual. P95 PySpark com três amostras equivale ao máximo observado e não sustenta uma conclusão de cauda.

## Problemas e bloqueios

- **Confirmado por execução — Atleta:** ausência semanal exportada como zero; média de kcal inclui dias sem aquela métrica; zero passos excluído da média. Três regressões mantidas. Console adicional FAIL: 11 recursos ERR_FAILED sem URL instrumentada; causa **Não verificado**, não alegar console limpo. Bundle538,10kB minificado é aviso, não prova de lentidão. **Bloqueado:** DB/RLS/Auth reais e Android/Health Connect; mocks não substituem esses testes.
- **Confirmado por execução — BrasilScore:** falha do fornecedor apresentada como busca vazia; `founded:null` vira0; placeholder de escudo ausente. npm11 frozen falhou, npm10 frozen passou com lock idêntico. Webhint exit0 com falhas de instrumentação não comprova aprovação completa. **Confirmado por documentação/código:** contas/admin/senhas em storage são demonstração local. **Bloqueado:** fornecedor real e autenticação de produção nesta rodada.
- **Confirmado por execução — PySpark:** moeda malformada aborta sob Spark4 ANSI padrão; CSV válido menor que1KiB é rejeitado pela política do código. Diagnóstico Double/Decimal mostrou diferença8,8E-13 em fixture, sem evidência de prejuízo contábil. Ranking atual: Planejamento supervisionada#4, Encargos#5, divergindo da numeração do README. **Bloqueado:** Colab interativo. **Não verificado:** cluster/produção e auditoria contábil completa.

## Evidências, tempo e recursos

Cada pasta contém relatório técnico, funcionalidades, fontes/SHA, comandos/exitcodes/tempos, logs sanitizados, resultados brutos, metodologia, scripts de reprodução, recomendações, PT/EN e questões ao proprietário. Capturas são headless/mobile emulado; não equivalem a aparelho físico. O dataset público de86.703.123B tem SHA256 `4445925692b24c33523e45bf02c52f01d0f2593a9fe1dcf93b8342986c80d36d`; permanece no laboratório, sem query assinada nos relatórios.

- **Confirmado por execução:** um Portfolio Intelligence Analyst, Codex/GPT-6.1-Sol/Medium, reutilizado em três turnos sequenciais. Pane `pane-node-3bee4942-b857-4305-837d-6ecde5f57168`, worktree `.agent-grid/worktrees/drf-portfolio-intelligence`, branch `feat/drf-engineering-research`; agora idle. Workers UI/3D preservados idle, sem QA adicional.
- **Confirmado por execução:** tempos registrados por projeto: Atleta14,1min; Brasil12,7min; PySpark9,2min até validação (sem fechamento editorial posterior). Soma~35,9min; janela entre inventário17:10:41UTC e cópia revisada17:55:23UTC~44,7min, incluindo supervisão/esperas/fechamento. Não é CPU-time.
- **Confirmado por execução:** host Windows/8 threads/~31,92GiB RAM compartilhado. Atleta RSS=snapshots do worker Vitest; Brasil maior RSS observado102,8MiB no processo combinado; PySpark público Python124,6MiB/JVM864,5MiB amostrados a100ms, sem garantia de pico. CPU/energia/custo exclusivo **Não verificado**. Consulta AgentGrid no fechamento:49% headroom disponível, indicador global, não custo exclusivo desta missão.
- **Confirmado por execução:** conferência dos14 repositórios manteve branch/SHA/quantidade de alterações iniciais, incluindo os dois previamente sujos. Origens dos três auditados continuam limpas. Worktrees UI/3D limpos e preservados; principal continua175820a. Nenhuma escuta5280–5289; processos próprios encerrados. Apenas `drf-v2/docs/research/` adicionado ao principal; sem alterações V1/main/código/catálogo/CV/pacotes, push ou deploy.
- **Confirmado por execução:**200 arquivos/~9,28MB copiados e verificados por SHA256 antes deste checkpoint. Manifests e inventários operacionais preservados em `.agent-grid/labs/mission06/`. Verificação direcionada não encontrou arquivos.env, chaves privadas/tokens detectáveis ou queries assinadas; não substitui auditoria universal de segredos.

## Próximo lote — depende de autorização

Recomendação: Stock Data Pipeline (`f9feca6`) e Análise SPFC (`ff13dc2`), ambos localizados; Horta Inteligente somente após localizar seu código/materiais. Não iniciar novo lote, corrigir originais, publicar métricas ou gerar currículo antes da revisão do proprietário. Contribuições pessoais e questões de produto estão explicitadas nos três relatórios.
