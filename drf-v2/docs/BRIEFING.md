# DRF Engineering — briefing consolidado

Arquitetura proposta em 08/10/2026. Escopo desta entrega: documentação; interface, cena e workers ainda não iniciados. Ler junto de [CONTRATOS.md](CONTRATOS.md) e [PLANO.md](PLANO.md).

## Produto e direção

DRF Engineering é uma equipe fictícia de engenharia de competição sediada em Recife, Brasil. Sua garagem/paddock 3D e o monoposto original DRF-01 apresentam o trabalho real de Davi Ramos Ferreira. Deixar clara a natureza fictícia da equipe; não atribuir a Davi experiência profissional em motorsport.

A experiência principal oferece navegação cinematográfica entre zonas. Recruiter Mode apresenta o mesmo conteúdo em leitura direta. As duas experiências evoluem em paralelo, a partir de uma única fonte estruturada; nenhuma precisa esperar a conclusão integral da outra. O conteúdo HTML e os controles essenciais estão disponíveis durante carregamento ou falha do 3D.

| Zona / ID estável | Função e conteúdo |
|---|---|
| Garage/Projects / `garage` | DRF-01 e programas de engenharia: problema, contribuição, decisões, stack, evidências, limites e links dos projetos |
| Telemetry / `telemetry` | Resultados rastreáveis dos projetos; fonte, unidade, período e contexto sempre identificados |
| Pit Wall/Experience / `pit-wall` | Experiência profissional e formação; fatos e datas documentados, sem dados internos da SEFAZ |
| Driver Profile / `driver-profile` | Apresentação, currículo, interesses e Recife; seção Driver Performance relaciona Atleta Híbrido à engenharia de dados de treino |
| Strategy Room / `strategy-room` | Raciocínio técnico e decisões dos casos verificados; contato e próximos passos para recrutadores |

Driver Performance é uma seção de Driver Profile e um vínculo ao mesmo projeto Atleta Híbrido da Garage; não constitui um catálogo duplicado nem publicação de dados pessoais de saúde. A abertura para a pista integra o cenário e o sistema Trackside, sem criar uma sexta zona de navegação.

## Identidade e interação

- Paleta: preto, carbono, vermelho profundo, branco e metal. Superfícies industriais e instrumentos legíveis; cor nunca é o único indicador de estado.
- Referências pessoais discretas: Ferrari/F1, Cristiano Ronaldo, Batman, Dragon Ball, Hunter x Hunter, Attack on Titan, Dr. Stone, futebol, Xbox 360 e Recife. Traduzir interesses em disciplina, silhuetas originais, materiais, ciência, estratégia e detalhes locais; não usar logos, personagens, modelos, trilhas, vozes ou sons protegidos sem licença apropriada.
- O DRF-01, os carros de pista, a equipe e sua identificação são originais. Começar com geometria própria simples, evitando dependência de modelos externos.
- Origin UI, Skiper UI e Cult UI são referências de UX, não pacotes obrigatórios. Avaliar componente a componente: licença, gratuidade, teclado, contraste, stack e custo. Reutilizar os componentes existentes quando equivalentes.
- Toda interação comunica algo sobre Davi, melhora a navegação ou reforça a metáfora de engenharia. Remover efeitos redundantes; nenhum minigame ou efeito decorativo pode bloquear o conteúdo.
- PT/EN com IDs independentes do idioma, foco visível, teclado, toque, movimento reduzido e mobile otimizado são requisitos da primeira versão.

Layout final, tipografia complementar, enquadramentos, nível de realismo e intensidade dos detalhes pessoais permanecem abertos à revisão visual. Esses pontos não impedem o protótipo geométrico e os contratos.

## Trackside Ambient Event System — obrigatório

A abertura da garagem permite ver carros fictícios passando ocasionalmente. Um evento `CAR_PASS` sincroniza deslocamento visual, áudio espacial opcional, resposta de reflexos e pequenas vibrações amortecidas em objetos leves. Um relógio e um progresso normalizado comandam todos os efeitos; sem motor físico pesado e sem tremor da câmera ou dos textos.

Áudio inicia desligado a cada carregamento e só é ativado por ação explícita. Usar áudio próprio/procedural ou licenciado. Movimento reduzido mantém a pista estática e suprime passagens, vibração e reflexos animados; áudio opcional não pode depender da ativação de movimento. Recruiter Mode, aba oculta, transição de câmera e painel de leitura aberto suspendem novos eventos. Detalhes executáveis: [contrato Trackside](CONTRATOS.md#trackside-car_pass).

## Catálogo e evidências inspecionadas

Verificação documental e de código local; não foram executados apps, bancos ou testes desses projetos. Existência de código, README ou URL não prova funcionamento em produção. Os links abaixo identificam as fontes, não certificam disponibilidade das demos.

| Projeto / ID proposto | Evidência e escopo seguro | Limite para publicação |
|---|---|---|
| Atleta Híbrido / `atleta-hibrido` | [Repositório](https://github.com/Daviramos7/AtletaHib), checkout local `0ae9190`: README, package.json, `src/domain/buildDailyTruth.ts`, serviços Supabase e `android_bridge/.../health/HealthConnectReader.kt`. React/TypeScript, Supabase, registros de alimentação/água/treino/recuperação e Android Bridge Kotlin/Compose/Health Connect. README declara Web 4.1.2 e Bridge 4.1.3. Há screenshots em `docs/portfolio/linkedin/screenshots/` | Sincronização depende de permissões/fontes; não prometer fila offline ou sincronização automática. Não publicar métricas de saúde reais, usuários ou ganhos de treino. Inspecionar/sanitizar screenshots antes de copiar |
| BrasilScore / `brasilscore` | [Repositório](https://github.com/Daviramos7/BrasilScore), checkout local `aadc1e9`: README, package.json, `server/routes/footballRoutes.js`, configuração de competições e `assets/js/auth.js`. HTML/CSS/JS/Vite; proxy Node/Express; classificação, clubes, partidas e favoritos da Série A | Contas e favoritos são demonstrativos em localStorage, sem autenticação de produção. Projeto colaborativo: não atribuir todo o trabalho a Davi sem confirmar contribuição. Sem métricas de usuários ou escala |
| Horta Inteligente / `horta-inteligente` | ESP32, MQTT e sensores informados pelo usuário; repositório/material específico ainda não localizado | Registro editorial pendente, não estado do produto. Não afirmar irrigação automática, dashboard, sensores específicos, economia, conclusão ou implantação. Solicitar link/material; sem métricas e sem URL inventada |
| Receitas Municipais / `municipal-revenue-platform` | `../../README.md`, `../../index.html`, `../../js/projects.js`: caso profissional sanitizado; Angular, FastAPI, Python, Pandas e ETL | Somente texto público e protótipo Figma já identificado; sem código, bases, URLs internas ou métricas da SEFAZ. Não confundir com outro repositório municipal |
| Despesas Públicas / `public-expenditure-big-data` | [Repositório](https://github.com/Daviramos7/analise-despesas-recife-pyspark), checkout local `27f0c93`: README informa dataset Recife 2023, 127.119 registros e R$ 7.803.361.234,91 liquidados | Resultados documentados, não reproduzidos nesta missão. Não usar 10,25 s nem promessa de memória; benchmark exige execução identificada |
| Stock Data Pipeline / `stock-data-pipeline` | [Repositório](https://github.com/Daviramos7/stock_data_pipeline), README local: Python, Pandas, NumPy, Streamlit/Plotly e dados externos; catálogo da V1 | README do projeto confirma a grafia da demo `stockdatapipeline-jnuaqfhrnt8jts3ymssrsp.streamlit.app`; disponibilidade não testada. Benchmarks do README ficam pendentes de contexto/evidência |
| Análise SPFC / `spfc-analysis` | [Repositório](https://github.com/Daviramos7/Projeto-SPFC); textos, stack e screenshot do catálogo V1 | Revisar versão atual antes de expandir afirmações além do catálogo; sem números novos |
| Task Manager / `task-manager` | [Repositório](https://github.com/Daviramos7/task_manager); Python/SQLite, descrição e screenshot V1 | Sem métricas novas ou afirmação de serviço publicado |
| Guess the Pokémon / `guess-the-pokemon` | [Repositório](https://github.com/Daviramos7/Guess-the-Pokemon); descrição/links V1 | Revisar direitos das imagens antes de incorporá-las à V2; screenshot pode ser substituído por capa original neutra |

O catálogo é extensível, não uma lista exaustiva de todos os projetos de Davi. Outros repositórios encontrados não entram automaticamente nesta primeira entrega.

Fontes locais adicionais: V1 `js/script.js` contém traduções PT/EN e afirmações divergentes do README; não copiar textos cegamente. Foto preferencial `img/profile-optimized.jpg`; currículo `curriculo/Davi Ramos 2026.pdf` precisa de conferência do conteúdo antes de montar uma cronologia completa. Formação/SEFAZ constam na V1; não inventar períodos, cargos adicionais ou resultados.

Busca da Horta: pastas do workspace e diretórios locais de Faculdade, Projetos, Programação e Projeto de Extensão; busca de repositórios de `Daviramos7` e pesquisa pública, sem material específico identificado. O relatório DOCX encontrado em Projeto de Extensão é um modelo em branco, não evidência do projeto. Ausência na busca não significa inexistência.

## Regras editoriais executáveis

1. Separar verificação de conteúdo, estado do produto e disponibilidade da demo. Horta permanece no catálogo de trabalho; mostrar somente informação fornecida, com aviso PT/EN de documentação em validação, até verificar material.
2. Métrica publicada precisa de fonte pública/sanitizada, unidade, período e método/contexto. Valores do README aparecem como resultados documentados; não como telemetria ao vivo nem reprodução recente.
3. Ausência não vira zero. Não usar porcentagens de domínio técnico, contagem dinâmica fictícia, experiência inventada ou dados pessoais de treino como decoração.
4. Assets da V1 são apenas lidos e, após revisão, copiados para `drf-v2/public/content/`; preservar originais. Cada asset novo registra autoria/licença e eventual uso de dados sintéticos.
5. Currículo, datas profissionais, contribuição individual no BrasilScore e material da Horta são pendências localizadas; não bloquear a arquitetura ou os protótipos paralelos com outras informações já verificadas.
