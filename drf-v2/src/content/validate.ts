import type { Localized, PortfolioContent } from '../contracts/index.ts'

// Pequena validação de fronteira; sem dependência adicional de schema.
export function validatePortfolioContent(content: PortfolioContent): void {
  const fail = (message: string): never => { throw new Error(`Invalid portfolio content: ${message}`) }
  const unique = (entries: readonly { id: string }[], label: string) => {
    const ids = new Set(entries.map(entry => entry.id))
    if (ids.size !== entries.length || entries.some(entry => !entry.id)) fail(`${label} IDs`)
    return ids
  }
  const localized = (value: Localized | null, label: string) => {
    if (value !== null && (!value.pt?.trim() || !value.en?.trim())) fail(`${label} PT/EN`)
  }
  const refs = (ids: readonly string[], available: Set<string>, label: string) => {
    if (ids.some(id => !available.has(id))) fail(`${label} references`)
  }
  const url = (value: string | null, label: string, allowLocal = false) => {
    if (value === null || (allowLocal && value.startsWith('/') && !value.startsWith('//'))) return
    try {
      if (new URL(value).protocol !== 'https:') fail(`${label} URL protocol`)
    } catch { fail(`${label} URL`) }
  }
  if (content.schemaVersion !== 1) fail('schemaVersion')
  const zones = unique(content.zones, 'zone')
  const projects = unique(content.projects, 'project')
  const metrics = unique(content.metrics, 'metric')
  const media = unique(content.media, 'media')
  const evidence = unique(content.evidence, 'evidence')
  unique(content.experiences, 'experience')
  unique(content.profile.contactLinks, 'contact')
  localized(content.profile.summary, 'profile summary')
  localized(content.profile.location, 'profile location')
  for (const value of [...content.profile.education, ...content.profile.interests]) localized(value, 'profile text')
  url(content.profile.cvUrl, 'CV', true)
  for (const link of content.profile.contactLinks) { localized(link.label, link.id); url(link.url, link.id) }
  for (const zone of content.zones) { localized(zone.label, zone.id); localized(zone.summary, zone.id) }
  for (const entry of content.projects) {
    for (const value of [entry.title, entry.summary, entry.problem, entry.contribution, entry.productStatus, ...entry.decisions, ...entry.limitations]) localized(value, entry.id)
    refs(entry.evidenceIds, evidence, entry.id)
    refs(entry.relatedZones, zones, entry.id)
    refs(entry.metricIds, metrics, entry.id)
    refs(entry.mediaIds, media, entry.id)
    url(entry.repositoryUrl, entry.id)
    url(entry.demoUrl, entry.id)
    if (entry.metricIds.some(id => content.metrics.find(metric => metric.id === id)?.projectId !== entry.id)) fail(`${entry.id} metric ownership`)
  }
  for (const metric of content.metrics) {
    const metricId = metric.id
    if (!projects.has(metric.projectId)) fail(`${metric.id} project`)
    refs(metric.evidenceIds, evidence, metric.id)
    localized(metric.label, metric.id)
    localized(metric.period, metric.id)
    localized(metric.context, metric.id)
    if (!metric.unit.trim()) fail(`${metric.id} unit`)
    if (metric.state !== 'missing' && (!Number.isFinite(metric.value) || !metric.context || !metric.evidenceIds.length)) fail(`${metric.id} value/evidence/context`)
    if (metric.state === 'missing' && (metric.value !== null || metric.context !== null)) fail(`${metricId} missing value`)
  }
  for (const entry of content.experiences) {
    for (const value of [entry.organization, entry.role, entry.summary]) localized(value, entry.id)
    refs(entry.evidenceIds, evidence, entry.id)
    for (const date of [entry.start, entry.end]) if (date !== null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(date)) fail(`${entry.id} date`)
  }
  for (const entry of content.evidence) { localized(entry.label, entry.id); url(entry.publicUrl, entry.id) }
  for (const entry of content.media) {
    localized(entry.alt, entry.id)
    localized(entry.credit, entry.id)
    url(entry.src, entry.id, true)
    if (!entry.licenseRef.trim()) fail(`${entry.id} license`)
  }
}
