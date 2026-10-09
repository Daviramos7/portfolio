import type { Evidence, Localized, Metric, PortfolioContent, Project } from '../contracts/index.ts'

const t = (pt: string, en: string): Localized => ({ pt, en })
// Sanitized editorial projection of docs/research/{project}/RELATORIO.md.
// Execution evidence remains in Git; no private paths, datasets or health records in this payload.
// A null URL deliberately avoids publishing an unavailable remote report.
const audit = (id: string, name: string, revision: string): Evidence => ({
  id, revision, checkedAt: '2026-10-09', publicUrl: null,
  label: t(`Performance Lab • ${name} • 09/10/2026 • ${revision}`,
    `Performance Lab • ${name} • 2026-10-09 • ${revision}`),
})
const audits = [
  audit('audit-atleta', 'Atleta Híbrido', '0ae9190'),
  audit('audit-brasilscore', 'BrasilScore', 'aadc1e9'),
  audit('audit-pyspark', 'PySpark / Recife', '27f0c93'),
  audit('audit-stock', 'Stock Data Pipeline', 'f9feca6'),
  audit('audit-spfc', 'SPFC', 'ff13dc2'),
  audit('audit-task', 'Task Manager', 'b1b2409'),
  audit('audit-pokemon', 'Guess the Pokémon', '14d501c'),
]
const metric = (id: string, projectId: string, evidenceId: string, value: number,
  unit: string, label: Localized, context: Localized): Metric => ({
  id, projectId, evidenceIds: [evidenceId], state: 'reproduced', value, unit, label,
  period: t('Auditoria local • 09/10/2026', 'Local audit • 2026-10-09'), context,
})
const metrics: Metric[] = [
  metric('recife-records-2023', 'public-expenditure-big-data', 'audit-pyspark', 127119, 'records',
    t('Registros públicos processados', 'Public records processed'),
    t('Dataset Recife 2023. Spark 4.0.4 local[2], Windows 11, Python 3.13.9. CSV público; exportações verificadas. Não é cluster ou produção.',
      'Recife 2023 dataset. Spark 4.0.4 local[2], Windows 11, Python 3.13.9. Public CSV; exports checked. Not a cluster or production run.')),
  metric('recife-liquidated-2023', 'public-expenditure-big-data', 'audit-pyspark', 7803361234.91, 'BRL',
    t('Despesas liquidadas no dataset', 'Liquidated expenditure in dataset'),
    t('Total local arredondado a centavos, dataset público Recife 2023. DoubleType; não constitui validação contábil completa, economia gerada ou resultado profissional.',
      'Local total rounded to cents, public Recife 2023 dataset. DoubleType; not a full accounting validation, savings or professional outcome.')),
  metric('atleta-tests', 'atleta-hibrido', 'audit-atleta', 283, 'tests',
    t('Testes existentes aprovados', 'Existing tests passed'),
    t('22 arquivos de testes, revisão 0ae9190, Node 22.21.0; lint/build aprovados. Complemento: 4 PASS/3 FAIL. Smoke com backend sintético; Supabase/RLS e Android reais bloqueados. Não é cobertura.',
      '22 test files, revision 0ae9190, Node 22.21.0; lint/build passed. Supplement: 4 PASS/3 FAIL. Smoke with synthetic backend; real Supabase/RLS and Android blocked. Not coverage.')),
  metric('brasilscore-tests', 'brasilscore', 'audit-brasilscore', 32, 'tests',
    t('Testes de contratos e busca aprovados', 'Contract and search tests passed'),
    t('Node 22.21.0, npm 10.9.4, lock congelado, upstream sintético local. API/cache e fluxos web verificados; três problemas reproduzidos. Não valida fornecedor remoto ou autenticação de produção.',
      'Node 22.21.0, npm 10.9.4, frozen lockfile, local synthetic upstream. API/cache and web flows checked; three issues reproduced. Does not validate live provider or production authentication.')),
  metric('stock-calculation-100k', 'stock-data-pipeline', 'audit-stock', 15.857, 'ms',
    t('Cálculo local • 100 mil linhas', 'Local calculation • 100k rows'),
    t('Mediana, warmup + 5 repetições: calcular_indicadores/Pandas 3.0.6, Python 3.13.9, Windows 11. Input sintético e processo aquecidos, concorrência 1; exclui coleta, IO, cache e UI. AppTest/complemento: 11 PASS/6 FAIL. Não é latência Yahoo ou produção.',
      'Median, warmup + 5 repetitions: calcular_indicadores/Pandas 3.0.6, Python 3.13.9, Windows 11. Warm synthetic input/process, concurrency 1; excludes acquisition, IO, cache and UI. AppTest/supplement: 11 PASS/6 FAIL. Not Yahoo or production latency.')),
  metric('spfc-tests', 'spfc-analysis', 'audit-spfc', 26, 'tests',
    t('Testes locais aprovados', 'Local tests passed'),
    t('Python 3.13.9, revisão ff13dc2. Demo explícita e fluxo offline. Complemento bruto 17 PASS/2 FAIL: um instrumental, outro formato de milhares em DataFrame raw. Coleta FBref atual bloqueada por HTTP 403.',
      'Python 3.13.9, revision ff13dc2. Explicit demo and offline flow. Raw supplement 17 PASS/2 FAIL: one instrumental, one thousands-format expectation in raw DataFrame. Current FBref acquisition blocked by HTTP 403.')),
  metric('spfc-normalize-csv-100k', 'spfc-analysis', 'audit-spfc', 186.8317, 'ms',
    t('Normalização + Top5 + CSV • 100 mil linhas', 'Normalization + Top5 + CSV • 100k rows'),
    t('Mediana, warmup + 3 repetições, Pandas 2.3.3/Python 3.13.9, Windows 11. Fixture sintética aquecida, serial; inclui escrita local/replace, exclui coleta, parser HTML e gráfico. Sem fsync. Não comparar com o cálculo Stock.',
      'Median, warmup + 3 repetitions, Pandas 2.3.3/Python 3.13.9, Windows 11. Warm synthetic fixture, serial; includes local write/replace, excludes acquisition, HTML parser and chart. No fsync. Not comparable to Stock calculation.')),
]
const updates: Record<string, Partial<Project>> = {
  'task-manager': {
    evidenceIds: ['audit-task'],
    problem: t('Persistir tarefas e consultá-las por uma API HTTP e um cliente de terminal.', 'Persist tasks and query them through an HTTP API and a terminal client.'),
    summary: t('API Python HTTPServer com SQLite e cliente CLI requests. Criação, listagem e consulta verificadas em cópia isolada com dados sintéticos.', 'Python HTTPServer API with SQLite and a requests CLI client. Creation, listing and lookup verified in an isolated copy with synthetic data.'),
    productStatus: t('API e CLI locais verificados; CRUD incompleto', 'Local API and CLI verified; incomplete CRUD'),
    technologies: ['Python', 'SQLite', 'HTTPServer', 'requests'],
    decisions: [t('Persistência SQLite e respostas JSON; benchmark serial de listagem HTTP incluindo leitura e decodificação.', 'SQLite persistence and JSON responses; serial HTTP listing benchmark including reading and decoding.')],
    limitations: [t('Complemento: 11 PASS/5 FAIL. Título null encerra a resposta sem status e pode deixar conexão bloqueando escritas; PUT/DELETE ausentes; query string no ID falha. Política para título vazio exige confirmação. Sem autenticação ou validação de produção.', 'Supplement: 11 PASS/5 FAIL. A null title closes the response without a status and can leave a connection blocking writes; PUT/DELETE absent; ID query string fails. Empty-title policy needs confirmation. No authentication or production validation.')],
  },
  'guess-the-pokemon': {
    evidenceIds: ['audit-pokemon'],
    problem: t('Criar um jogo de dedução com dicas, tentativas limitadas e pontuação persistida.', 'Create a deduction game with hints, limited attempts and persisted scores.'),
    summary: t('Jogo HTML/CSS/JavaScript integrado à PokéAPI por código. Fluxos testados em navegador com API local e imagens sintéticas; pontuação via localStorage.', 'HTML/CSS/JavaScript game integrated with PokéAPI in code. Browser flows tested with a local API and synthetic images; scores stored in localStorage.'),
    productStatus: t('Fluxos offline verificados; API real não validada', 'Offline flows verified; live API unvalidated'),
    limitations: [t('Complemento: 14 PASS/4 FAIL. Feedback de acerto sobrescrito, tentativas continuam após vitória, reinício faz duas aquisições e retry de erro não tem limite por código. Quatro erros 503 foram injetados, sem carga externa. Assets de franquia não reaproveitados; contribuição e licenças exigem revisão.', 'Supplement: 14 PASS/4 FAIL. Success feedback overwritten, attempts continue after winning, restart acquires twice and code has no retry limit. Four 503 errors were injected without external load. Franchise assets not reused; contribution and licenses need review.')],
  },
  'public-expenditure-big-data': {
    problem: t('Transformar despesas públicas de 2023 em agregações e saídas verificáveis.', 'Turn 2023 public expenditure into inspectable aggregates and exports.'),
    summary: t('Pipeline PySpark para normalização monetária, agregação, qualidade e exportação de ranking/dashboard. Reprodução local de 127.119 registros públicos.', 'PySpark pipeline for monetary normalization, aggregation, quality checks and ranking/dashboard exports. Local reproduction of 127,119 public records.'),
    productStatus: t('Pipeline público reproduzido localmente', 'Public pipeline reproduced locally'),
    decisions: [t('Spark persistido para agregações; Top10 agregado em Pandas; CSV, JSON, PNG e ZIP.', 'Persisted Spark aggregations; aggregated Top10 in Pandas; CSV, JSON, PNG and ZIP.')],
    limitations: [t('Dois checks complementares falharam: moeda malformada com Spark 4 ANSI e CSV válido menor que 1 KiB. DoubleType não equivale a validação contábil; cluster/Colab/Parquet não verificados.', 'Two supplementary checks failed: malformed currency under Spark 4 ANSI and valid CSV below 1 KiB. DoubleType is not accounting validation; cluster/Colab/Parquet unverified.')],
  },
  'atleta-hibrido': {
    problem: t('Reunir treino, alimentação, hidratação e recuperação distinguindo origem e ausência.', 'Bring training, nutrition, hydration and recovery together while distinguishing provenance and missing data.'),
    productStatus: t('Web verificada com fixtures; integrações reais pendentes', 'Web checked with fixtures; real integrations pending'),
    limitations: [t('Três inconsistências semanais reproduzidas: ausência, denominador de kcal e zero passos. Banco/RLS/Auth reais e Android/Health Connect não executados. Nenhum dado pessoal de saúde é usado nesta apresentação.', 'Three weekly inconsistencies reproduced: missingness, calorie denominator and zero steps. Real database/RLS/Auth and Android/Health Connect not executed. No personal health records used in this presentation.')],
  },
  'brasilscore': {
    summary: t('Aplicação acadêmica colaborativa para classificação e clubes da Série A, com favoritos e perfis demonstrativos locais. Proxy Express com endpoints de equipes, classificação e partidas.', 'Collaborative academic application for Série A standings and clubs, with local demo profiles and favorites. Express proxy with team, standings and match endpoints.'),
    problem: t('Organizar consulta de clubes e classificação atrás de um proxy normalizado.', 'Organize club and standings queries behind a normalized proxy.'),
    productStatus: t('API e interface verificadas com fornecedor sintético', 'API and UI checked with synthetic provider'),
    limitations: [t('Contas locais são demonstração, sem autenticação segura. UI de partidas e busca real de jogadores ausentes. Três problemas reproduzidos: erro exibido como busca vazia, ano ausente como zero e fallback de escudo.', 'Local accounts are a demo, without secure authentication. Match UI and real player search absent. Three reproduced issues: error displayed as empty search, missing year as zero and crest fallback.')],
  },
  'stock-data-pipeline': {
    summary: t('Dashboard Streamlit: yfinance → OHLCV/Pandas → indicadores, gráficos Plotly e tabela. Cálculos e módulo original exercitados com fornecedor sintético.', 'Streamlit dashboard: yfinance → OHLCV/Pandas → indicators, Plotly charts and table. Calculations and original module exercised with synthetic provider.'),
    problem: t('Explorar séries de ações e indicadores em um dashboard interativo.', 'Explore stock series and indicators in an interactive dashboard.'),
    productStatus: t('AppTest local; fornecedor remoto não verificado', 'Local AppTest; remote provider unverified'),
    technologies: ['Python', 'Pandas', 'NumPy', 'yfinance', 'Streamlit', 'Plotly'],
    decisions: [t('Cache de consulta com TTL de 1 hora; indicadores rolling calculados em memória. Sem banco ou pipeline separado rastreado.', 'Query cache with 1-hour TTL; rolling indicators calculated in memory. No tracked database or separate pipeline.')],
    limitations: [t('Seis checks complementares falharam: histórico curto, timeout, schema sem Close, tendência com janela insuficiente, prefixo monetário fixo e RSI plano NaN. Mercado real e disponibilidade da demo não verificados.', 'Six supplementary checks failed: short history, timeout, missing Close schema, insufficient trend window, fixed currency prefix and flat RSI NaN. Live market and demo availability unverified.')],
  },
  'spfc-analysis': {
    problem: t('Normalizar estatísticas públicas do elenco para análises por 90 minutos e disciplina.', 'Normalize public squad statistics for per-90 and disciplinary analysis.'),
    summary: t('Automação Python/Selenium para coleta, normalização, análises e CSV. Demo explícita e fluxo offline verificados; coleta atual bloqueada por HTTP 403.', 'Python/Selenium automation for acquisition, normalization, analysis and CSV. Explicit demo and offline flow verified; current acquisition blocked by HTTP 403.'),
    productStatus: t('Offline verificado; coleta remota bloqueada', 'Offline verified; remote acquisition blocked'),
    decisions: [t('CSV temporário + replace; demo explícita separada de falhas de coleta; agregações e gráficos locais.', 'Temporary CSV + replace; explicit demo separate from acquisition failures; local aggregates and charts.')],
    limitations: [t('Formato de milhares no DataFrame raw requer contrato; uma falha complementar foi instrumental de ponto flutuante. HTTP 403 impede confirmar dados atuais. Sem prova de escrita concorrente ou durabilidade elétrica.', 'Thousands format in raw DataFrame requires a contract; one supplementary failure was instrumental floating-point equality. HTTP 403 prevents current-data confirmation. Concurrent writes and power-loss durability unproven.')],
  },
}

export function applyAuditEvidence(base: PortfolioContent): PortfolioContent {
  return {
    ...base, metrics, evidence: [...base.evidence, ...audits],
    projects: base.projects.map(project => {
      const update = updates[project.id]
      if (!update) return project
      const ownMetrics = metrics.filter(item => item.projectId === project.id)
      return { ...project, ...update, contribution: null,
        evidenceIds: [...new Set([...project.evidenceIds, ...(update.evidenceIds ?? []), ...ownMetrics.flatMap(item => item.evidenceIds)])],
        metricIds: ownMetrics.map(item => item.id),
        relatedZones: ownMetrics.length ? [...new Set([...project.relatedZones, 'telemetry' as const])] : project.relatedZones,
      }
    }),
  }
}
