# Performance Lab — checkpoint do Lote 02

09/10/2026. Rodada encerrada para aprovação do proprietário. Um único Portfolio Intelligence Analyst reutilizado, Codex/GPT-6.1-Sol/Medium, dois projetos sequenciais. Lead revisou fontes/harnesses, resultados brutos, limitações e o gráfico sintético SPFC. Nenhum projeto original corrigido; métricas e currículo não publicados.

## Preservação do Lote 01

**Confirmado por execução:** commit local `4231c1ee403fcf967756ee3fd62c94c671a6bf71`, branch `feat/drf-engineering`, somente202 arquivos em `drf-v2/docs/research/` (~9,29MB, maior arquivo400.148B). Revisão de extensões/tamanho, arquivos.env, padrões de credenciais/JWT privilegiado e conteúdo do ZIP não encontrou material sensível detectável nem artefato pesado; dados brutos e dependências permanecem no laboratório. Verificação direcionada não é garantia universal de ausência de segredos.

As oito pendências estão abertas em [PENDENCIAS-TECNICAS.md](PENDENCIAS-TECNICAS.md): três inconsistências semanais Atleta, três problemas BrasilScore e duas verificações falhas PySpark. [Checkpoint01](CHECKPOINT-LOTE-01.md), resultados e condições de benchmarks preservados sem alteração. Logs ignorados pelo Git foram incluídos explicitamente somente após revisão dessa pasta. Sem push/deploy.

## Resultados atuais

| Projeto / fonte auditada | Execução confirmada | Resultado e limite |
|---|---|---|
| [Stock Data Pipeline](stock-data-pipeline/RELATORIO.md), `f9feca6fba241479c9fcb113132c601b4d44d54d` | Funções originais + módulo original em Streamlit AppTest; fornecedor sintético; cache e indicadores/gráfico; benchmark local | 17checks:11PASS/6FAIL. Sem suíte/lint/build separados=N/A. 100mil linhas: mediana15,857ms, p95observado16,960ms, cinco repetições, cópia+cálculos Pandas em memória; exclui Yahoo/download/IO/cache/UI. |
| [Análise SPFC](analise-spfc/RELATORIO.md), `ff13dc28a6872d4b53f6e203eb241f9b2a1e6f32` | 26testes atuais, pipcheck, CLI/demo/wrapper/menu; extrator com HTML injetado, análises e CSV atômico; uma coleta pública normal | Suíte26PASS. Complemento original17PASS/2FAIL, um FAIL instrumental (igualdade exata de float), outro de expectativa de formato rawDataFrame. 100mil linhas: mediana186,832ms, p95observado191,080ms, três repetições; normalização+Top5+CSV local, exclui coleta/browser/parserHTML. |

Afirmações da tabela: **Confirmado por execução**, nas condições dos relatórios. P95 com n5/n3 equivale ao máximo observado e tem pouca força para estimar cauda. Throughput é derivado de walltime, não medição de CPU. Não comparar esses cenários entre si ou com métricas históricas/remotas como se fossem o mesmo workload.

## Falhas e bloqueios

- **Confirmado por execução — Stock:** uma linha gera IndexError; timeout injetado e coluna ausente chegam como exceções à UI; janela curta mostra tendência Baixa sem SMA20; série plana retorna RSI NaN (política exige confirmação); preço recebe prefixoR$ fixo inclusive ao selecionarAAPL. Sem integração remota, correção financeira completa ou validação visual desktop/mobile. Os números do README **Não verificado** nesta rodada. Cache: probe único demonstrou reutilização, não expirouTTL1h; tempo de download cacheado não é latência atual do hit.
- **Bloqueado — SPFC:** tentativa pública única recebeuHTTP403/“Um momento…” e timeout da espera pela tabela. Nenhum retry/bypass/fallback. 46registros/10,63s históricos **Não verificado** atualmente. Chrome headless padrão substituiu somente o bootstrap do driver, sem flags de disfarce do original.
- **Confirmado por execução — SPFC:** normalizador rawDataFrame converte `"1,234"` em0; parsing remoto desse token não foi verificado. Não generalizar como corrupção dos dados FBref. A comparação0,6/0,6000000000000001 foi diagnosticada pelo Lead como instrumental; `math.isclose(rel_tol=1e-12)` passou sobre o resultado preservado. Harness original arquivado; apenas predicado de reprodução corrigido, sem rerun dos benchmarks ou alegação de suíte nova PASS.
- **Bloqueado — [Horta Inteligente](horta-inteligente/BLOQUEIO.md):** busca pontual local encontrou apenas referências de planejamento; nenhum código executável identificado. Requer caminho/repositório autorizado do proprietário. Não houve varredura ampla do disco nem testes de hardware.

## Evidências e recursos

Relatórios incluem arquitetura/estado, inventário funcional, SHA/fontes, comandos/exitcodes, ambiente e freeze, testes/benchmarks com amostras/hashes, recomendações, contribuição pendente de confirmação, candidatosDRF, PT/EN e questões ao proprietário. Outputs e dados são sintéticos; único acesso público atual, FBref, foi bloqueado. Inputs grandes/cache/perfil/deps só no laboratório.

**Confirmado por execução:**53 arquivos novos/~640KB copiados com SHA256 idêntico do worktree ao checkout principal, nenhum acima1MiB e nenhuma credencial detectável na revisão direcionada. Lote02 permanece sem commit, para revisão; commit autorizado desta missão é apenas o de preservação do Lote01.

**Confirmado por execução:** tempos medidos da cópia até validação: Stock157,38s (~2,6min), SPFC229,28s (~3,8min), total~6,4min; leituras preparatórias, supervisão, espera e fechamento editorial fora dessa soma. RSS máximos amostrados: StockPython175MiB; SPFCofflinePython155,5MiB; tentativa pública Chrome agregado836,7MiB, com possibilidade de páginas compartilhadas contadas várias vezes. Amostragem~100ms, não picos garantidos; CPU/energia/custo exclusivo **Não verificado**.

**Confirmado por execução:** último indicador AgentGrid consultado pelo Lead31% disponível, acima da reserva solicitada~20%; nenhuma nova carga/projeto será iniciada. Ferramenta de quota ausente no worker, monitorada pelo Lead. OrigensStock/SPFC continuam no mesmo SHA/main e limpas; principal4231c1e, mainc1bb276 inalterada. Nenhum códigoV1/V2/catálogo/pacote original alterado, nenhuma GUI externa aberta, processos de laboratório encerrados. Worktrees e capturas preservados; workers não adicionais nem Resume Specialist ativado.

Próxima ação: aprovação do proprietário sobre os dois relatórios e indicação do caminho da Horta. Correções de projetos, publicação e próximo lote dependem de autorização; nenhum resultado de laboratório apresentado como produção ou contribuição profissional individual.
