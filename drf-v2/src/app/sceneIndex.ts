import type { PortfolioContent, SceneProps } from '../contracts/index.ts'

export function buildSceneContentIndex(content: PortfolioContent): SceneProps['contentIndex'] {
  return content.zones.flatMap(zone => [
    { zoneId: zone.id, projectId: null, label: zone.label, media: [] },
    ...content.projects.filter(project => project.relatedZones.includes(zone.id)).map(project => ({
      zoneId: zone.id,
      projectId: project.id,
      label: project.title,
      media: content.media.filter(media => project.mediaIds.includes(media.id)),
    })),
  ])
}
