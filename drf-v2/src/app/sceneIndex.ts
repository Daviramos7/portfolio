import type { Localized, PortfolioContent, SceneProps, ZoneId } from '../contracts/index.ts'

export function buildSceneContentIndex(content: PortfolioContent): SceneProps['contentIndex'] {
  const t = (pt: string, en: string): Localized => ({ pt, en })
  const readouts: Record<ZoneId, readonly Localized[]> = {
    garage: [t(`${content.projects.length} programas no catálogo`, `${content.projects.length} programs in catalogue`), ...content.projects.slice(0, 2).map(project => project.title)],
    telemetry: [t('Auditoria local · condições na leitura', 'Local audit · conditions in reading'), ...content.metrics.filter(metric => metric.state === 'reproduced').slice(0, 2).map(metric => t(`${metric.label.pt}: ${new Intl.NumberFormat('pt-BR').format(metric.value!)} ${metric.unit}`, `${metric.label.en}: ${new Intl.NumberFormat('en-US').format(metric.value!)} ${metric.unit}`))],
    'pit-wall': content.experiences.slice(0, 3).map(item => t(`${item.organization.pt} · ${item.role.pt}`, `${item.organization.en} · ${item.role.en}`)),
    'driver-profile': [t(content.profile.name, content.profile.name), content.profile.location, ...content.profile.education].slice(0, 3),
    'strategy-room': [t('Interesses documentados', 'Documented interests'), ...content.profile.interests].slice(0, 3),
  }
  return content.zones.flatMap(zone => [
    { zoneId: zone.id, projectId: null, label: zone.label, media: [], screenLines: readouts[zone.id] },
    ...content.projects.filter(project => project.relatedZones.includes(zone.id)).map(project => ({
      zoneId: zone.id,
      projectId: project.id,
      label: project.title,
      screenLines: [{ pt: project.technologies.join(' · '), en: project.technologies.join(' · ') }, ...(project.productStatus ? [project.productStatus] : [])],
      media: content.media.filter(media => project.mediaIds.includes(media.id)),
    })),
  ])
}
