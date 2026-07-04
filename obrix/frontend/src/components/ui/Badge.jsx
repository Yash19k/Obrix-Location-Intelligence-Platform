/** Badge — score tier badge derived from a numeric score. */

import { SCORE_TIERS } from '@/constants'

export function getTier(score) {
  if (score >= SCORE_TIERS.EXCELLENT.min) return SCORE_TIERS.EXCELLENT
  if (score >= SCORE_TIERS.GOOD.min)      return SCORE_TIERS.GOOD
  if (score >= SCORE_TIERS.FAIR.min)      return SCORE_TIERS.FAIR
  return SCORE_TIERS.POOR
}

export default function Badge({ score }) {
  const tier = getTier(score)
  return (
    <span className={tier.className}>
      {tier.label}
    </span>
  )
}
