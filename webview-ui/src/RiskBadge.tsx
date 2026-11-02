import type { CommandSummary } from '../../src/messaging/protocol'
import Icon from './Icon'
import type { MessageKey } from './i18n'

const badges = {
  caution: { icon: 'warning', label: 'riskCaution' },
  destructive: { icon: 'error', label: 'riskDestructive' },
} as const satisfies Record<Exclude<CommandSummary['risk'], 'safe'>, { icon: string; label: MessageKey }>

/** Etiqueta de riesgo con icono y texto (el riesgo nunca depende solo del color). Nada si es `safe`. */
function RiskBadge({ risk, id, t }: { risk: CommandSummary['risk']; id: string; t: (key: MessageKey) => string }) {
  if (risk === 'safe') {
    return null
  }
  const badge = badges[risk]
  return (
    <span id={id} className={`risk risk-${risk}`}>
      <Icon name={badge.icon} />
      <span>{t(badge.label)}</span>
    </span>
  )
}

export default RiskBadge
