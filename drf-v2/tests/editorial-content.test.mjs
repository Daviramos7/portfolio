import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { portfolioContent } from '../src/content/portfolio.ts'

test('owner-confirmed contact and education are bilingual and public CV stays unchanged', () => {
  const profile = portfolioContent.profile
  assert.equal(profile.contactLinks.find(link => link.id === 'linkedin').url, 'https://www.linkedin.com/in/daviramosferreira')
  assert.match(profile.education[0].pt, /6º período.*dezembro de 2027/)
  assert.match(profile.education[0].en, /6th semester.*December 2027/)
  assert.equal(profile.cvUrl, '/cv/Davi-Ramos-Ferreira-public-2026.pdf')
})

test('six audited cases retain useful detail, bounded claims and unknown contribution', () => {
  const ids = ['atleta-hibrido', 'brasilscore', 'stock-data-pipeline', 'spfc-analysis', 'task-manager', 'guess-the-pokemon']
  for (const id of ids) {
    const project = portfolioContent.projects.find(item => item.id === id)
    assert.equal(project.contribution, null)
    for (const locale of ['pt', 'en']) {
      assert.ok(project.summary[locale].length > 50)
      assert.ok(project.problem[locale])
      assert.ok(project.decisions[0][locale].length > 60)
      assert.ok(project.limitations[0][locale].length < 370)
      assert.doesNotMatch(project.limitations[0][locale], /PASS|FAIL|KiB|ANSI/)
    }
  }
  assert.match(portfolioContent.projects.find(item => item.id === 'task-manager').limitations[0].en, /Partial CRUD/)
  assert.match(portfolioContent.projects.find(item => item.id === 'brasilscore').decisions[0].en, /without an implemented screen/)
})

test('Recife Public Budget leads the catalogue with the dossier figures verbatim and the single-run caveat', () => {
  const project = portfolioContent.projects[0]
  assert.equal(project.id, 'recife-public-budget')
  assert.equal(project.title.pt, 'Orçamento Público do Recife: dados prontos para agentes de IA')
  assert.equal(project.title.en, 'Recife Public Budget: data ready for AI agents')
  assert.equal(project.demoUrl, 'https://orcamento-recife.streamlit.app')
  assert.equal(project.repositoryUrl, 'https://github.com/Daviramos7/orcamento-publico-recife')
  assert.deepEqual(project.technologies, ['Python', 'PySpark', 'dbt', 'PostgreSQL', 'FastAPI', 'LLM tool calling', 'Streamlit', 'Docker', 'GitHub Actions', 'Supabase'])
  assert.equal(project.results.length, 3)
  const pt = [project.problem.pt, project.decisions[0].pt, ...project.results.map(item => item.pt)].join(' ')
  const en = [project.problem.en, project.decisions[0].en, ...project.results.map(item => item.en)].join(' ')
  for (const figure of ['86 MB', '132 mil registros', '86 testes de dados', '10 consultas', '100% de acerto com Gemini', '96,7%', '30 perguntas', 'de 90% para 76,7%', 'limite de 2 min em produção passou a rodar em 2,7 s']) assert.ok(pt.includes(figure), figure)
  for (const figure of ['86 MB', '132k records', '86 data tests', '10 queries', '100% accuracy with Gemini', '96.7%', '30 questions', 'from 90% to 76.7%', '2-minute timeout in production now runs in 2.7 s', 'SQL ground truth']) assert.ok(en.includes(figure), figure)
  assert.match(project.limitations[0].pt, /1 rodada por modelo.*100%.*96,7% \(93,3% sem o guardrail\).*escritos por mim.*3 repetições ainda não rodados/)
  assert.match(project.limitations[0].en, /1 run per model.*100%.*96\.7% \(93\.3% without the guardrail\).*written by me.*3 repetitions have not been run yet/)
  assert.deepEqual(project.metricIds, [])
  assert.doesNotMatch(JSON.stringify(project), /sefaz/i)
  // Every other record keeps an empty result list: outcomes are only stated where a source documents them.
  assert.ok(portfolioContent.projects.slice(1).every(item => item.results.length === 0))
})

test('audit metrics, evidence identifiers, source classifications and benchmark conditions are immutable in this editorial revision', () => {
  const source = readFileSync(new URL('../src/content/auditEvidence.ts', import.meta.url), 'utf8').replaceAll('\r\n', '\n')
  const prefix = source.split('const updates:')[0]
  assert.equal(createHash('sha256').update(prefix).digest('hex'), 'd38e993004f7b3fb8fddd3ebd7e68c2df9c341345ce78656d555bf9bf3c90f0b')
})

test('the old PySpark audit card is gone and survives only as the Recife Public Budget origin line', () => {
  assert.equal(portfolioContent.projects.some(item => item.id === 'public-expenditure-big-data'), false)
  assert.doesNotMatch(JSON.stringify(portfolioContent.projects), /Auditoria de Despesas Públicas|Public Expenditure Audit/)
  assert.ok(portfolioContent.metrics.every(metric => portfolioContent.projects.some(item => item.id === metric.projectId)))
  assert.ok(portfolioContent.evidence.every(item => item.id !== 'audit-pyspark'))
  const budget = portfolioContent.projects[0]
  assert.equal(budget.decisions.length, 2)
  assert.match(budget.decisions[1].pt, /^Começou como um notebook PySpark de auditoria das despesas de 2023.*analise-despesas-recife-pyspark.*evoluiu para pipeline, API e agente.$/)
  assert.match(budget.decisions[1].en, /^It started as a PySpark notebook.*2023.*analise-despesas-recife-pyspark.*pipeline, an API and an agent.$/)
  assert.ok(budget.evidenceIds.includes('pyspark-readme'))
  assert.equal(portfolioContent.evidence.find(item => item.id === 'pyspark-readme').publicUrl, 'https://github.com/Daviramos7/analise-despesas-recife-pyspark')
  assert.equal(budget.results.length, 3)
})
