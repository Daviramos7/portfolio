import { FileCheck2, FileClock } from 'lucide-react'
import type { Locale, Project } from '../../contracts/index.ts'
import { uiLabels } from '../../features/uiLabels.ts'

export function ProgramEvidenceStamp({ project, locale, qualification = true }: { project: Project; locale: Locale; qualification?: boolean }) {
  const t = uiLabels(locale)
  const pending = project.contentStatus === 'pending-evidence'
  const Icon = pending ? FileClock : FileCheck2
  const count = project.evidenceIds.length
  if (!qualification && count === 0) return null
  return <div className="drf-program-evidence" data-pending={pending}>
    {qualification && <span><Icon size={13} aria-hidden="true" />{pending ? t.pending : t.reviewed}</span>}
    {count > 0 && <span>{!qualification && <Icon size={13} aria-hidden="true" />}{count} {count === 1 ? t.evidenceOne : t.evidenceMany}</span>}
  </div>
}

// Identity derives from the Lead's selected record. No catalogue/URL state here.
export function ProgramIdentity({ project, locale, index, total }: { project: Project; locale: Locale; index: number; total: number }) {
  return <div className="drf-program-identity" data-program-id={project.id}>
    <h2 className="drf-program-title" aria-live="polite" aria-atomic="true"><span key={`${project.id}/${locale}`}>{project.title[locale]}</span></h2>
    <ProgramEvidenceStamp project={project} locale={locale} />
    <div className="drf-program-position" aria-hidden="true">{Array.from({ length: total }, (_, position) => <span key={position} data-active={position === index} />)}</div>
  </div>
}
