# Índice de evidências do portfólio

Consolidado em09/10/2026 para revisão do proprietário. Cinco projetos auditados experimentalmente; classificações e ressalvas completas nos relatórios. Aprovação dos lotes autoriza preservação das evidências, não publicação automática de métricas nem aprovação de produto.

| Projeto | Revisão | Evidências atuais | Relatório / limites principais |
|---|---|---|---|
| Atleta Híbrido | `0ae9190` | 283testes existentes PASS; lint/build; smoke com fixtures; complemento4PASS/3FAIL | [Relatório](atleta-hibrido/RELATORIO.md). Banco/RLS/Auth e Android/Health Connect reais bloqueados; console adicional com erros sem causa identificada. |
| BrasilScore | `aadc1e9` | 32testes PASS; build; API/fluxos web locais; cache/coalescência | [Relatório](brasilscore/RELATORIO.md). Fornecedor sintético, contas demonstrativas; webhint limitado; três problemas reproduzidos. |
| Despesas Públicas Recife | `27f0c93` | Pipeline PySpark público:127.119registros/R$7.803.361.234,91 liquidados; CSV/JSON/PNG/ZIP;10PASS/2FAIL complementares | [Relatório](auditoria-despesas-pyspark/RELATORIO.md). Sparklocal[2], monetárioDoubleType, compatibilidadeANSI e CSV pequeno; sem cluster/validação contábil completa. |
| Stock Data Pipeline | `f9feca6` | Módulo Streamlit original viaAppTest, fornecedor sintético;11PASS/6FAIL; cálculoPandas local | [Relatório](stock-data-pipeline/RELATORIO.md). Yahoo/produção e browser desktop/mobile não verificados; números históricosREADME não reproduzidos. |
| Análise SPFC | `ff13dc2` | 26testes PASS; demo explícita, extratorHTML injetado, menu/análises/CSV;17PASS/2FAIL complementares brutos | [Relatório](analise-spfc/RELATORIO.md). Coleta atualHTTP403; umFAIL instrumental e outro contrato rawDataFrame; histórico remoto não reproduzido. |

As evidências da tabela são **Confirmado por execução**, apenas nos escopos descritos. Estado real do produto, funcionalidades confirmadas por código, declaração do autor e bloqueios não se confundem com execução remota/produção. Contribuição pessoal e responsabilidades ainda dependem de confirmação; presença de commits não prova exclusividade.

## Pendências técnicas

[Registro do Lote01](PENDENCIAS-TECNICAS.md): AH01–03 (ausência semanal/denominador kcal/zero passos); BS01–03 (erro como busca vazia/foundednull→0/fallback imagem); PY01–02 (moeda malformada comANSI/CSV<1KiB). Permanecem abertas, sem correções nos originais.

Stock: ST01 uma linha→IndexError; ST02 timeout injetado não tratado; ST03 schema semClose→KeyError; ST04 histórico insuficiente→tendênciaBaixa/nan; ST05 prefixoR$ fixo; ST06 RSI planoNaN, política a confirmar. São seis FAILs complementares reproduzidos, não comprovação de impacto em mercado/produção.

SPFC: SP01 normalizador rawDataFrame não preserva magnitude de`"1,234"`; contrato/formato exige confirmação, caminho remoto não validado. Igualdade exata0,6/0,6000000000000001 é falha instrumental arquivada, sem defeito demonstrado na fórmula. Coleta externa403 bloqueada, sem retry/bypass/fallback.

Avisos de bundle, documentação/ranking PySpark, limites de tooling, política de ausência/zero e testes não executados permanecem nos relatórios. Nenhuma pendência foi fechada apenas porque uma suíte existente passou.

## Métricas e uso editorial

Manter [condições do Lote01](CHECKPOINT-LOTE-01.md) e [Lote02](CHECKPOINT-LOTE-02.md): p95Atleta é de médias por lote; p95Brasil de requests individuais com upstreamloopback; p95PySpark/SPFC(n3) eStock(n5) são máximos observados, estimativas fracas de cauda. RSS é amostrado/snapshots com escopo explícito, não pico garantido nem CPU. Não converter throughput local em SLA, percentual de cobertura, ganho profissional ou desempenho de fornecedor. CV pode descrever tecnologias/escopo e resultados públicos comprovados; não precisa carregar microbenchmarks sem contexto.

## Projetos ainda pendentes

- [Horta Inteligente](horta-inteligente/BLOQUEIO.md): código não localizado na busca pontual autorizada; sem firmware/hardware/métricas verificadas.
- Demais repositórios inventariados ainda sem auditoria experimental deste ciclo: task_manager, av2_backend, Faculdade, LocateMe/variantes, ed-marcas-site e Mushmc bedwars etl. Relevância para portfólio e escopo de cada um precisam de seleção posterior; não inferir capacidades pelo nome.
- Trabalho municipal/SEFAZ: somente descrição profissional pública autorizada daV1/V2/CV; conteúdo interno não auditado nem divulgado. Não iniciar novo lote nesta missão.

## Próximo passo autorizado

Preparar currículoPT/PDF/DOCX como rascunho privado revisável, com fontes e dúvidas separadas. Conteúdo/download atual do portfólio eV1 permanecem preservados. Atualização do catálogo, integração de download e publicação dependem da aprovação do proprietário.
