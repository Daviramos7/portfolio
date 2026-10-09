import type { PortfolioShellProps } from '../contracts/index.ts'

// Ponto reservado ao Frontend/UX. Mesmo placeholder em ambos os modos.
export function PortfolioShell({ content, state }: PortfolioShellProps) {
  const zone = content.zones.find(zone => zone.id === state.target.zoneId)
  return (
    <header className="foundation-header" data-view-mode={state.mode}>
      <p className="foundation-eyebrow">DRF Engineering · {content.profile.location[state.locale]}</p>
      <h1>{content.profile.name}</h1>
      <p>{state.locale === 'pt' ? 'Experiência em preparação.' : 'Experience in preparation.'}</p>
      <p className="foundation-zone">{zone?.label[state.locale]}</p>
    </header>
  )
}
