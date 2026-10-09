# Revisão de currículo no night shift

Esta nota registra QA do rascunho privado PT preservado da Missão07. Não contém contatos, arquivos pessoais ou caminhos privados. Não autoriza publicação nem substituição do currículo público.

## Estado e escopo

- Principal consultado somente para leitura: `1a8445da6c31565e1b6c186510a5e800559be6e9`.
- Worker manteve sua base `175820af7937840f4a7367bfd5dedc2a76ae8269`, sem sync, merge ou rebase.
- Artefatos anteriores e pesquisas não versionadas preservados. PDF, DOCX e fonte foram copiados sem alterações para a entrega privada do night shift.
- Nenhuma auditoria de projeto, instalação, acesso a demonstração externa ou modificação de conteúdo/UI ocorreu neste turno.

## Revisão factual

**Confirmado por documentação/código:** CV anterior, V1, conteúdo V2, índice e cinco relatórios foram conferidos nas partes pertinentes. O índice e os relatórios permanecem iguais aos usados na Missão07. A mudança na V2 aplica as evidências consolidadas; a descrição atual de BrasilScore confirma a correção do rascunho: interface de classificação/clubes e endpoints backend de equipes/classificação/partidas, sem tela de partidas.

**Declarado pelo autor:** experiência, título, datas, formação, competências pessoais e idioma continuam vinculados às declarações públicas anteriores. Campos de experiência sem datas na V2 não comprovam nem negam as datas expressas no CV. Não houve confirmação do empregador ou inferência de senioridade.

**Não verificado:** contribuição individual e atualidade dos dados pessoais. Confirmações ficam no documento privado destinado ao proprietário. Não se atribuiu ao candidato a execução dos testes pelo auditor, exclusividade de autoria ou ganho profissional.

O volume público reproduzido do projeto PySpark conserva seu contexto de dataset. Benchmarks locais, valores financeiros, números históricos não reproduzidos e alegações de integração remota não foram promovidos a resultados pessoais. Os limites de demo, colaboração e coleta externa continuam na proveniência privada.

## PDF

**Confirmado por execução:**

- Duas páginas rasterizadas novamente com o tooling isolado existente e inspecionadas integralmente.
- Corpo de 11,5 pt; títulos de seção de 12,5 pt; nome de 19 pt. Coluna única, texto selecionável, sem imagens, gráficos ou tabelas de layout.
- Nenhum corte, sobreposição ou glifo ausente observado nas páginas.
- Texto normalizado corresponde à fonte e ao DOCX.
- Sete destinos de hyperlink: sintaxe válida e igualdade entre PDF e DOCX. Os destinos não foram visitados; disponibilidade externa não foi testada.
- Correção de BrasilScore presente; a afirmação antiga sobre testes de componentes ausente.
- PDF preservado byte a byte em relação à versão corrigida da Missão07.

Essa verificação de estrutura legível não equivale a aprovação por um serviço ATS comercial nem garante pontuação de recrutamento.

## DOCX

**Confirmado por execução:** texto e destinos de links consistentes com a fonte/PDF; sem tabelas de layout ou imagens. Artefato preservado sem alteração.

**Bloqueado:** renderer empacotado `render_docx.py` terminou com exitcode 1, `FileNotFoundError: LibreOffice soffice.exe was not found on PATH`. Busca pontual por Word, Word COM e LibreOffice não encontrou renderer compatível nos caminhos consultados. Log, comando, condições e walltime preservados privadamente. Nenhuma suite global foi instalada.

**Não verificado:** layout final no Word ou renderer compatível sem influência de avaliação. O DOCX permanece **draft pendente de QA**. A skill documents exige renderizar e abrir as imagens de todas as páginas antes de considerar o layout validado. A linha herdada do estilo Title anteriormente observada continua como pendência de apresentação.

Exports Aspose de avaliação anteriores permanecem somente no QA privado, com marcas intactas. Não houve remoção de marca/licença, pagamento, geração de PDF final por trial ou nova tentativa de contornar esse limite. O PDF final é o artefato independente gerado da fonte própria.

## Revisão pelo proprietário

1. Confirmar foco das vagas antes de manter ou ampliar o objetivo de estágio, sem inferir junioridade.
2. Confirmar título, datas e vínculo profissional atual, além de formação e nível de idioma.
3. Confirmar contatos e destinos pessoais no documento privado.
4. Confirmar contribuição efetiva nos projetos e autorização da descrição pública da experiência.
5. Revisar o PDF local; revisar o DOCX quando houver renderer compatível autorizado.

O mecanismo de revisão local em desenvolvimento não equivale a publicação. Nenhum download público, contrato, catálogo, currículo antigo, V1 ou cena foi alterado. Commit deste turno contém somente esta nota; artefatos e pesquisas anteriores ficam fora dele.
