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
    summary: t('Gerenciador de tarefas com API HTTP em Python, cliente de terminal e persistência SQLite para criação, listagem e consulta.', 'Task manager with a Python HTTP API, terminal client and SQLite persistence for creation, listing and retrieval.'),
    productStatus: t('API e CLI locais verificados; CRUD incompleto', 'Local API and CLI verified; incomplete CRUD'),
    technologies: ['Python', 'SQLite', 'HTTPServer', 'requests'],
    decisions: [t('HTTPServer retorna JSON e utiliza SQL parametrizado; cliente requests permite criar e consultar tarefas persistidas. Operações locais verificadas em banco descartável.', 'HTTPServer returns JSON and uses parameterized SQL; a requests client creates and retrieves persisted tasks. Local operations checked in a disposable database.')],
    limitations: [t('CRUD parcial: PUT e DELETE indisponíveis. Validação de entrada e roteamento exigem ajustes; título null pode interromper respostas e afetar escritas. Sem autenticação ou validação de produção.', 'Partial CRUD: PUT and DELETE unavailable. Input validation and routing need adjustments; a null title can interrupt responses and affect writes. No authentication or production validation.')],
  },
  'guess-the-pokemon': {
    evidenceIds: ['audit-pokemon'],
    problem: t('Criar um jogo de dedução com dicas, tentativas limitadas e pontuação persistida.', 'Create a deduction game with hints, limited attempts and persisted scores.'),
    summary: t('Jogo web de adivinhação com silhuetas, dicas progressivas, tentativas limitadas, sugestões de nomes e recorde persistido localmente.', 'Web guessing game with silhouettes, progressive hints, limited attempts, name suggestions and a locally persisted high score.'),
    productStatus: t('Fluxos offline verificados; API real não validada', 'Offline flows verified; live API unvalidated'),
    limitations: [t('Fluxos verificados com API e imagens sintéticas locais; integração remota e aparência completa pendentes. Estado da rodada e recuperação de erros exigem ajustes. Licenças de assets e contribuição individual precisam de revisão.', 'Flows checked with a local synthetic API and images; live integration and full appearance pending. Round state and error recovery need adjustments. Asset licenses and individual contribution need review.')],
    decisions: [t('HTML, CSS e JavaScript consomem a PokéAPI e mantêm o estado da rodada no navegador; recorde em localStorage e sugestões navegáveis por teclado.', 'HTML, CSS and JavaScript consume PokéAPI and keep round state in the browser; localStorage high score and keyboard-navigable suggestions.')],
  },
  'atleta-hibrido': {
    problem: t('Reunir treino, alimentação, hidratação e recuperação distinguindo origem e ausência.', 'Bring training, nutrition, hydration and recovery together while distinguishing provenance and missing data.'),
    productStatus: t('Web verificada com fixtures; integrações reais pendentes', 'Web checked with fixtures; real integrations pending'),
    limitations: [t('Web verificada com dados sintéticos; agregações semanais têm inconsistências conhecidas. Integrações reais Supabase/RLS/Auth e Android/Health Connect não executadas. Sem dados pessoais de saúde nesta apresentação.', 'Web checked with synthetic data; weekly aggregates have known inconsistencies. Real Supabase/RLS/Auth and Android/Health Connect integrations not executed. No personal health records in this presentation.')],
    summary: t('Aplicação para organizar treino, alimentação, hidratação e recuperação, com consolidação de registros manuais e importados e origem explícita.', 'Application for organizing training, nutrition, hydration and recovery, consolidating manual and imported records with explicit provenance.'),
    decisions: [t('Cliente React/TypeScript com serviços Supabase e regras determinísticas de consolidação; Android Bridge previsto para leitura autorizada do Health Connect.', 'React/TypeScript client with Supabase services and deterministic consolidation rules; Android Bridge designed for authorized Health Connect reads.')],
  },
  'brasilscore': {
    summary: t('Aplicação acadêmica colaborativa para consultar clubes e classificação da Série A, com busca e favoritos locais demonstrativos.', 'Collaborative academic application for browsing Série A clubs and standings, with search and local demo favorites.'),
    problem: t('Organizar consulta de clubes e classificação atrás de um proxy normalizado.', 'Organize club and standings queries behind a normalized proxy.'),
    productStatus: t('API e interface verificadas com fornecedor sintético', 'API and UI checked with synthetic provider'),
    limitations: [t('API e interface verificadas com fornecedor sintético; integração remota pendente. Contas locais são demonstração, sem autenticação segura; partidas não têm tela implementada. Apresentação de erros e dados ausentes exige ajustes.', 'API and UI checked with a synthetic provider; live integration pending. Local accounts are a demo without secure authentication; matches have no implemented screen. Error and missing-data presentation needs adjustments.')],
    decisions: [t('Interface multipágina e proxy Express com endpoints de equipes, classificação e partidas; validação, normalização de respostas e cache de consultas. Partidas estão disponíveis no backend, sem tela implementada.', 'Multipage interface and Express proxy with team, standings and match endpoints; validation, response normalization and query caching. Matches are backend endpoints without an implemented screen.')],
  },
  'stock-data-pipeline': {
    summary: t('Dashboard de análise de ações com filtros por ativo e período, indicadores técnicos, gráficos interativos e tabela de dados.', 'Stock analysis dashboard with asset and period filters, technical indicators, interactive charts and a data table.'),
    problem: t('Explorar séries de ações e indicadores em um dashboard interativo.', 'Explore stock series and indicators in an interactive dashboard.'),
    productStatus: t('AppTest local; fornecedor remoto não verificado', 'Local AppTest; remote provider unverified'),
    technologies: ['Python', 'Pandas', 'NumPy', 'yfinance', 'Streamlit', 'Plotly'],
    decisions: [t('Streamlit integra yfinance, normalização OHLCV/Pandas e gráficos Plotly; médias móveis, Bollinger, RSI e volatilidade, com cache de consultas de uma hora.', 'Streamlit integrates yfinance, OHLCV/Pandas normalization and Plotly charts; moving averages, Bollinger bands, RSI and volatility, with one-hour query caching.')],
    limitations: [t('AppTest e cálculos verificados com fornecedor sintético; mercado real e demo não verificados. Histórico insuficiente, entradas inválidas e casos-limite dos indicadores exigem tratamento.', 'AppTest and calculations checked with a synthetic provider; live market and demo unverified. Insufficient history, invalid inputs and indicator edge cases need handling.')],
  },
  'spfc-analysis': {
    problem: t('Normalizar estatísticas públicas do elenco para análises por 90 minutos e disciplina.', 'Normalize public squad statistics for per-90 and disciplinary analysis.'),
    summary: t('Automação para coletar e normalizar estatísticas públicas do SPFC, analisar desempenho por 90 minutos e disciplina e produzir CSV e gráficos.', 'Automation for collecting and normalizing public SPFC statistics, analyzing per-90 performance and discipline, and producing CSV and charts.'),
    productStatus: t('Offline verificado; coleta remota bloqueada', 'Offline verified; remote acquisition blocked'),
    decisions: [t('Python/Selenium e Pandas centralizam coleta, validação e análises; gravação por arquivo temporário e substituição, com demo explícita separada de falhas de coleta.', 'Python/Selenium and Pandas centralize acquisition, validation and analysis; temporary-file replacement for writes, with an explicit demo separate from acquisition failures.')],
    limitations: [t('Testes e fluxo offline verificados; coleta atual FBref bloqueada por HTTP 403. Formatos numéricos requerem contrato; dados sintéticos da demo não demonstram coleta atual.', 'Tests and offline flow checked; current FBref acquisition blocked by HTTP 403. Numeric formats need a contract; synthetic demo data does not demonstrate current acquisition.')],
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
