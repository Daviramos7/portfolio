import type { Evidence, Localized, PortfolioContent, Project } from '../contracts/index.ts'
import { applyAuditEvidence } from './auditEvidence.ts'

const text = (pt: string, en: string): Localized => ({ pt, en })
const github = 'https://github.com/Daviramos7'
const checkedAt = '2026-10-08'
const evidence = (id: string, label: Localized, publicUrl: string | null, revision: string | null): Evidence =>
  ({ id, label, publicUrl, revision, checkedAt })
const project = (entry: Pick<Project, 'id' | 'title' | 'summary' | 'technologies'> & Partial<Project>): Project => ({
  problem: null,
  contribution: null,
  decisions: [],
  contentStatus: 'reviewed',
  productStatus: null,
  limitations: [],
  evidenceIds: ['portfolio-v1'],
  mediaIds: [],
  metricIds: [],
  repositoryUrl: null,
  demoUrl: null,
  relatedZones: ['garage'],
  ...entry,
})

const baselineContent: PortfolioContent = {
  schemaVersion: 1,
  profile: {
    name: 'Davi Ramos Ferreira',
    summary: text(
      'Estudante de Ciência da Computação com foco em Engenharia de Dados e Desenvolvimento Full Stack. Interesse em pipelines, automação e transformação de dados em informações úteis.',
      'Computer Science student focused on Data Engineering and Full Stack Development. Interested in pipelines, automation, and turning data into useful information.',
    ),
    location: text('Recife, Pernambuco, Brasil', 'Recife, Pernambuco, Brazil'),
    // Owner confirmation, 2026-10-10; academic documentary verification pending.
    education: [text('Ciência da Computação — UNINASSAU, 6º período. Conclusão prevista: dezembro de 2027.', 'Computer Science — UNINASSAU, 6th semester. Expected graduation: December 2027.')],
    interests: [text('Engenharia de dados, automação e desenvolvimento de aplicações.', 'Data engineering, automation, and application development.')],
    // Existing public V1 PDF only. The new private draft is not published.
    cvUrl: '/cv/Davi-Ramos-Ferreira-public-2026.pdf',
    contactLinks: [
      { id: 'github', label: text('GitHub', 'GitHub'), url: github },
      { id: 'linkedin', label: text('LinkedIn', 'LinkedIn'), url: 'https://www.linkedin.com/in/daviramosferreira' },
      { id: 'instagram', label: text('Dados com Davi', 'Dados com Davi'), url: 'https://www.instagram.com/dadoscomdavi/' },
    ],
  },
  zones: [
    { id: 'garage', label: text('Garagem / Projetos', 'Garage / Projects'), summary: text('Projetos apresentados como programas de engenharia.', 'Projects presented as engineering programs.') },
    { id: 'telemetry', label: text('Telemetria', 'Telemetry'), summary: text('Resultados documentados com origem e contexto.', 'Documented results with sources and context.') },
    { id: 'pit-wall', label: text('Pit Wall / Experiência', 'Pit Wall / Experience'), summary: text('Experiência profissional e formação.', 'Professional experience and education.') },
    { id: 'driver-profile', label: text('Perfil do Piloto', 'Driver Profile'), summary: text('Davi, Recife e Driver Performance com Atleta Híbrido.', 'Davi, Recife, and Driver Performance with Atleta Híbrido.') },
    { id: 'strategy-room', label: text('Sala de Estratégia', 'Strategy Room'), summary: text('Decisões técnicas, evidências e contato.', 'Technical decisions, evidence, and contact.') },
  ],
  projects: [
    project({
      id: 'municipal-revenue-platform',
      title: text('Plataforma de Análise de Receitas Municipais', 'Municipal Revenue Analytics Platform'),
      summary: text(
        'Estudo de caso sanitizado de uma plataforma profissional para ingestão, tratamento e análise de receitas municipais, com dashboards, comparações temporais e automação de dados.',
        'A sanitized case study of a professional platform for municipal revenue ingestion, processing, and analysis, featuring dashboards, time-based comparisons, and data automation.',
      ),
      technologies: ['Angular', 'FastAPI', 'Python', 'Pandas', 'ETL'],
      relatedZones: ['garage', 'pit-wall', 'strategy-room'],
      limitations: [text('Código, bases e ambiente interno não são públicos. O material da V1 identifica um protótipo Figma sanitizado.', 'Code, datasets, and the internal environment are not public. V1 materials identify a sanitized Figma prototype.')],
    }),
    project({
      id: 'public-expenditure-big-data',
      title: text('Auditoria de Despesas Públicas com PySpark', 'Public Expenditure Audit with PySpark'),
      summary: text('Pipeline PySpark para análise de despesas públicas do Recife, com normalização monetária, agregações, qualidade de dados e exportações de ranking e dashboard.', 'PySpark pipeline for Recife public expenditure analysis, with monetary normalization, aggregation, data quality and ranking and dashboard exports.'),
      technologies: ['Python', 'PySpark', 'Spark SQL', 'Pandas', 'ETL'],
      repositoryUrl: `${github}/analise-despesas-recife-pyspark`,
      relatedZones: ['garage', 'telemetry', 'strategy-room'],
      evidenceIds: ['pyspark-readme'],
      metricIds: ['recife-records-2023', 'recife-liquidated-2023'],
      limitations: [text('Resultados documentados no README, não reproduzidos nesta revisão. O tempo de execução varia por ambiente.', 'Results documented in the README, not reproduced in this review. Execution time varies by environment.')],
    }),
    project({
      id: 'atleta-hibrido',
      title: text('Atleta Híbrido', 'Atleta Híbrido'),
      summary: text('Aplicação para organizar treino, alimentação, hidratação e recuperação, com consolidação de registros manuais e importados e origem explícita.', 'Application for organizing training, nutrition, hydration and recovery, consolidating manual and imported records with explicit provenance.'),
      technologies: ['React', 'TypeScript', 'Supabase', 'PostgreSQL', 'Kotlin', 'Android Bridge', 'Health Connect'],
      repositoryUrl: `${github}/AtletaHib`,
      demoUrl: 'https://atleta-hib.vercel.app',
      evidenceIds: ['atleta-readme', 'atleta-bridge'],
      relatedZones: ['garage', 'driver-profile', 'strategy-room'],
      decisions: [text('Preservar a origem dos registros manuais e wearable e distinguir dados ausentes.', 'Preserve manual and wearable record provenance and distinguish missing data.')],
      limitations: [text('Sincronização depende de permissões e fontes Android; não há promessa de fila offline ou sincronização automática. Dados pessoais de saúde não integram este portfólio.', 'Synchronization depends on Android permissions and sources; no offline queue or automatic synchronization is promised. Personal health data is not included in this portfolio.')],
    }),
    project({
      id: 'brasilscore',
      title: text('BrasilScore', 'BrasilScore'),
      summary: text('Aplicação acadêmica colaborativa para consultar clubes e classificação da Série A, com busca e favoritos locais demonstrativos.', 'Collaborative academic application for browsing Série A clubs and standings, with search and local demo favorites.'),
      technologies: ['HTML', 'CSS', 'JavaScript', 'Vite', 'Node.js', 'Express', 'API REST'],
      repositoryUrl: `${github}/BrasilScore`,
      evidenceIds: ['brasilscore-readme'],
      decisions: [text('Proxy Node/Express mantém a chave da API externa no backend e normaliza respostas.', 'A Node/Express proxy keeps the external API key on the backend and normalizes responses.')],
      relatedZones: ['garage', 'strategy-room'],
      limitations: [text('Contas e favoritos são demonstrativos em localStorage, sem autenticação de produção. A contribuição individual de cada integrante precisa ser confirmada.', 'Accounts and favorites are localStorage demonstrations, not production authentication. Each team member’s individual contribution needs confirmation.')],
    }),
    project({
      id: 'horta-inteligente',
      title: text('Horta Inteligente', 'Smart Garden'),
      summary: text('Projeto com ESP32, MQTT e sensores, conforme informação fornecida por Davi. Documentação em validação.', 'A project using ESP32, MQTT, and sensors, as described by Davi. Documentation is being verified.'),
      technologies: ['ESP32', 'MQTT', 'Sensores / Sensors'],
      contentStatus: 'pending-evidence',
      evidenceIds: ['horta-user-brief'],
      limitations: [text('Material específico ainda não verificado. Funcionalidades, implantação, tipos de sensores e resultados permanecem não confirmados.', 'Project-specific materials have not yet been verified. Features, deployment, sensor types, and results remain unconfirmed.')],
    }),
    project({
      id: 'stock-data-pipeline',
      title: text('Pipeline de Dados de Ações', 'Stock Data Pipeline'),
      summary: text('Dashboard de análise de ações com filtros por ativo e período, indicadores técnicos, gráficos interativos e tabela de dados.', 'Stock analysis dashboard with asset and period filters, technical indicators, interactive charts and a data table.'),
      technologies: ['Python', 'Pandas', 'NumPy', 'ETL', 'Streamlit', 'Plotly'],
      repositoryUrl: `${github}/stock_data_pipeline`,
      demoUrl: 'https://stockdatapipeline-jnuaqfhrnt8jts3ymssrsp.streamlit.app/',
      evidenceIds: ['stock-readme'],
      limitations: [text('Disponibilidade da demo não testada nesta revisão; benchmarks não publicados sem contexto de execução.', 'Demo availability was not tested in this review; benchmarks are not published without execution context.')],
    }),
    project({
      id: 'spfc-analysis',
      title: text('Análise de Dados — SPFC', 'Data Analysis — SPFC'),
      summary: text('Automação para coletar e normalizar estatísticas públicas do SPFC, analisar desempenho por 90 minutos e disciplina e produzir CSV e gráficos.', 'Automation for collecting and normalizing public SPFC statistics, analyzing per-90 performance and discipline, and producing CSV and charts.'),
      technologies: ['Python', 'Selenium', 'Pandas', 'Matplotlib'],
      repositoryUrl: `${github}/Projeto-SPFC`,
    }),
    project({
      id: 'task-manager',
      title: text('Gerenciador de Tarefas', 'Task Manager'),
      summary: text('Gerenciador de tarefas com API HTTP em Python, cliente de terminal e persistência SQLite para criação, listagem e consulta.', 'Task manager with a Python HTTP API, terminal client and SQLite persistence for creation, listing and retrieval.'),
      technologies: ['Python', 'SQLite3'],
      repositoryUrl: `${github}/task_manager`,
    }),
    project({
      id: 'guess-the-pokemon',
      title: text('Adivinhe o Pokémon', 'Guess the Pokémon'),
      summary: text('Jogo web de adivinhação com silhuetas, dicas progressivas, tentativas limitadas, sugestões de nomes e recorde persistido localmente.', 'Web guessing game with silhouettes, progressive hints, limited attempts, name suggestions and a locally persisted high score.'),
      technologies: ['HTML', 'CSS', 'JavaScript', 'PokéAPI'],
      repositoryUrl: `${github}/Guess-the-Pokemon`,
      demoUrl: 'https://guess-the-pokemon-coral.vercel.app/',
      limitations: [text('Imagens e demais assets precisam de revisão de direitos antes de serem incorporados à V2.', 'Images and other assets need a rights review before inclusion in V2.')],
    }),
  ],
  experiences: [{
    id: 'sefaz-jaboatao',
    organization: text('Secretaria Municipal da Fazenda de Jaboatão dos Guararapes', 'Municipal Finance Department of Jaboatão dos Guararapes'),
    role: text('Estágio em desenvolvimento e dados', 'Development and data internship'),
    start: null,
    end: null,
    isCurrent: null,
    summary: text('Participação no desenvolvimento de uma plataforma de gestão e análise de receitas municipais, utilizando Angular, Python/FastAPI, Pandas, ETL e Parquet.', 'Participation in developing a municipal revenue management and analytics platform using Angular, Python/FastAPI, Pandas, ETL, and Parquet.'),
    evidenceIds: ['portfolio-v1'],
  }],
  metrics: [
    { id: 'recife-records-2023', projectId: 'public-expenditure-big-data', label: text('Registros processados', 'Records processed'), unit: 'records', period: text('Dataset de despesas do Recife — 2023', 'Recife expenditure dataset — 2023'), evidenceIds: ['pyspark-readme'], state: 'documented', value: 127119, context: text('Quantidade informada no README do projeto para o dataset de 2023. Pipeline não executado nesta revisão.', 'Count reported in the project README for the 2023 dataset. The pipeline was not executed in this review.') },
    { id: 'recife-liquidated-2023', projectId: 'public-expenditure-big-data', label: text('Valor liquidado', 'Liquidated expenditure'), unit: 'BRL', period: text('Dataset de despesas do Recife — 2023', 'Recife expenditure dataset — 2023'), evidenceIds: ['pyspark-readme'], state: 'documented', value: 7803361234.91, context: text('Total informado no README do projeto. É resultado documentado de dados públicos, não telemetria ao vivo ou métrica de desempenho.', 'Total reported in the project README. This is a documented result from public data, not live telemetry or a performance metric.') },
  ],
  media: [],
  evidence: [
    evidence('portfolio-v1', text('Conteúdo público do portfólio V1', 'Public V1 portfolio content'), `${github}/portfolio/blob/main/README.md`, null),
    evidence('pyspark-readme', text('README — despesas públicas do Recife', 'README — Recife public expenditure'), `${github}/analise-despesas-recife-pyspark/blob/27f0c93/README.md`, '27f0c93'),
    evidence('atleta-readme', text('README e código — Atleta Híbrido', 'README and code — Atleta Híbrido'), `${github}/AtletaHib/blob/0ae9190/README.md`, '0ae9190'),
    evidence('atleta-bridge', text('README — Android Bridge', 'README — Android Bridge'), `${github}/AtletaHib/blob/0ae9190/android_bridge/README.md`, '0ae9190'),
    evidence('brasilscore-readme', text('README e código — BrasilScore', 'README and code — BrasilScore'), `${github}/BrasilScore/blob/aadc1e9/README.md`, 'aadc1e9'),
    evidence('stock-readme', text('README — Stock Data Pipeline', 'README — Stock Data Pipeline'), `${github}/stock_data_pipeline/blob/main/README.md`, null),
    evidence('horta-user-brief', text('Informação fornecida por Davi; material pendente', 'Information supplied by Davi; materials pending'), null, null),
  ],
}

export const portfolioContent = applyAuditEvidence(baselineContent)
