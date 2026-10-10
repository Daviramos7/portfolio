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

test('seven audited cases retain useful detail, bounded claims and unknown contribution', () => {
  const ids = ['atleta-hibrido', 'brasilscore', 'public-expenditure-big-data', 'stock-data-pipeline', 'spfc-analysis', 'task-manager', 'guess-the-pokemon']
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

test('audit metrics, evidence identifiers, source classifications and benchmark conditions are immutable in this editorial revision', () => {
  const source = readFileSync(new URL('../src/content/auditEvidence.ts', import.meta.url), 'utf8').replaceAll('\r\n', '\n')
  const prefix = source.split('const updates:')[0]
  assert.equal(createHash('sha256').update(prefix).digest('hex'), '279d37a97e0e537e1a21a889ba8c477eb20e420b04fefc264d0773d9e1db8fd5')
})
